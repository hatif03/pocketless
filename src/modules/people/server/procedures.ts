import { and, desc, eq, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/db";
import { episodes, people, promises } from "@/db/schema";
import { seedPriyaForUser } from "@/lib/seed-priya";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const peopleRouter = createTRPCRouter({
  ensureDemo: protectedProcedure.mutation(async ({ ctx }) => {
    const personId = await seedPriyaForUser(ctx.auth.user.id);
    return { personId };
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), aliases: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(people)
        .values({
          userId: ctx.auth.user.id,
          name: input.name.trim(),
          aliases: input.aliases?.trim() || null,
        })
        .returning();
      return created;
    }),
  graph: protectedProcedure
    .input(z.object({ personId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({
          id: episodes.id,
          topics: episodes.topics,
          entitiesJson: episodes.entitiesJson,
        })
        .from(episodes)
        .where(
          and(
            eq(episodes.userId, ctx.auth.user.id),
            eq(episodes.personId, input.personId),
          ),
        );

      const nodeWeight = new Map<string, { label: string; kind: "topic" | "entity" }>();
      const frequency = new Map<string, number>();
      const edgeWeight = new Map<string, number>();

      for (const row of rows) {
        const labels = new Set<string>();

        for (const topic of (row.topics ?? "").split(",")) {
          const label = topic.trim();
          if (!label) continue;
          const key = `topic:${label.toLowerCase()}`;
          nodeWeight.set(key, { label, kind: "topic" });
          labels.add(key);
        }

        if (row.entitiesJson) {
          try {
            const entities = JSON.parse(row.entitiesJson) as {
              entity_type: string;
              text: string;
            }[];
            for (const entity of entities) {
              if (entity.entity_type !== "person_name" && entity.entity_type !== "organization") {
                continue;
              }
              const label = entity.text.trim();
              if (!label) continue;
              const key = `entity:${label.toLowerCase()}`;
              nodeWeight.set(key, { label, kind: "entity" });
              labels.add(key);
            }
          } catch {
            // malformed entitiesJson — skip entity nodes for this episode
          }
        }

        for (const key of labels) {
          frequency.set(key, (frequency.get(key) ?? 0) + 1);
        }

        const labelList = Array.from(labels);
        for (let i = 0; i < labelList.length; i++) {
          for (let j = i + 1; j < labelList.length; j++) {
            const edgeKey = [labelList[i], labelList[j]].sort().join("|");
            edgeWeight.set(edgeKey, (edgeWeight.get(edgeKey) ?? 0) + 1);
          }
        }
      }

      return {
        nodes: Array.from(nodeWeight.entries()).map(([id, { label, kind }]) => ({
          id,
          label,
          kind,
          weight: frequency.get(id) ?? 1,
        })),
        edges: Array.from(edgeWeight.entries()).map(([key, weight]) => {
          const [source, target] = key.split("|");
          return { source, target, weight };
        }),
      };
    }),
  getMany: protectedProcedure.query(async ({ ctx }) => {
    await seedPriyaForUser(ctx.auth.user.id);
    return db
      .select()
      .from(people)
      .where(eq(people.userId, ctx.auth.user.id))
      .orderBy(desc(people.lastSpokeAt), desc(people.updatedAt));
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [person] = await db
        .select()
        .from(people)
        .where(
          and(eq(people.id, input.id), eq(people.userId, ctx.auth.user.id)),
        );
      if (!person) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Person not found" });
      }
      return person;
    }),
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.query.trim()) {
        return db
          .select()
          .from(people)
          .where(eq(people.userId, ctx.auth.user.id))
          .limit(20);
      }
      return db
        .select()
        .from(people)
        .where(
          and(
            eq(people.userId, ctx.auth.user.id),
            ilike(people.name, `%${input.query}%`),
          ),
        )
        .limit(20);
    }),
  roster: protectedProcedure.query(async ({ ctx }) => {
    await seedPriyaForUser(ctx.auth.user.id);
    const roster = await db
      .select()
      .from(people)
      .where(eq(people.userId, ctx.auth.user.id))
      .orderBy(desc(people.lastSpokeAt), desc(people.updatedAt));

    const openPromises = await db
      .select()
      .from(promises)
      .where(
        and(eq(promises.userId, ctx.auth.user.id), eq(promises.status, "open")),
      )
      .orderBy(desc(promises.createdAt));

    return { people: roster, openPromises };
  }),
});
