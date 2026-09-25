import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/db";
import { episodes, people, promises, talkMessages } from "@/db/schema";
import { gatewayChat } from "@/lib/assemblyai/gateway";
import { searchMemory } from "@/lib/memory/search";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const talkRouter = createTRPCRouter({
  history: protectedProcedure
    .input(z.object({ personId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(talkMessages)
        .where(
          and(
            eq(talkMessages.userId, ctx.auth.user.id),
            eq(talkMessages.personId, input.personId),
          ),
        )
        .orderBy(asc(talkMessages.createdAt));
    }),
  send: protectedProcedure
    .input(
      z.object({
        personId: z.string(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [person] = await db
        .select()
        .from(people)
        .where(
          and(
            eq(people.id, input.personId),
            eq(people.userId, ctx.auth.user.id),
          ),
        );
      if (!person) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db.insert(talkMessages).values({
        userId: ctx.auth.user.id,
        personId: person.id,
        role: "user",
        content: input.content,
      });

      const passages = await searchMemory({
        userId: ctx.auth.user.id,
        personId: person.id,
        query: input.content,
        k: 8,
      }).catch(() => []);

      const [open, recent, prior] = await Promise.all([
        db
          .select()
          .from(promises)
          .where(
            and(
              eq(promises.personId, person.id),
              eq(promises.status, "open"),
            ),
          ),
        db
          .select()
          .from(episodes)
          .where(eq(episodes.personId, person.id))
          .orderBy(episodes.occurredAt),
        db
          .select()
          .from(talkMessages)
          .where(
            and(
              eq(talkMessages.userId, ctx.auth.user.id),
              eq(talkMessages.personId, person.id),
            ),
          )
          .orderBy(asc(talkMessages.createdAt)),
      ]);

      const memory = [
        `Person: ${person.name}`,
        `Brief: ${person.relationshipBrief ?? "(none)"}`,
        `Open promises:\n${open.map((p) => `- ${p.text}`).join("\n") || "(none)"}`,
        `Episodes:\n${recent
          .map(
            (e) =>
              `- ${e.title} (${e.occurredAt.toISOString().slice(0, 10)}): ${e.brief ?? e.transcript?.slice(0, 400)}`,
          )
          .join("\n")}`,
        `Relevant excerpts for this question:\n${
          passages
            .map((p) => `- ${p.speaker ? `${p.speaker}: ` : ""}${p.content}`)
            .join("\n") || "(none)"
        }`,
      ].join("\n\n");

      const reply = await gatewayChat({
        messages: [
          {
            role: "system",
            content: `You are Pocketless. You remember people and promises. Answer only from this memory. If you do not know, say so.\n\n${memory}`,
          },
          ...prior.slice(-12).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      });

      const [assistant] = await db
        .insert(talkMessages)
        .values({
          userId: ctx.auth.user.id,
          personId: person.id,
          role: "assistant",
          content: reply,
        })
        .returning();

      return assistant;
    }),
});
