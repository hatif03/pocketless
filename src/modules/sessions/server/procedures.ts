import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/db";
import { callSessions, episodes, people } from "@/db/schema";
import { meetingUrlErrorMessage, parseMeetingUrl } from "@/lib/meeting-url";
import { recallMeetPipe } from "@/lib/pipes/recall-meet";
import { signSessionId } from "@/lib/session-link";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  );
}

export const sessionsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(callSessions)
      .where(eq(callSessions.userId, ctx.auth.user.id))
      .orderBy(desc(callSessions.createdAt));
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(callSessions)
        .where(
          and(
            eq(callSessions.id, input.id),
            eq(callSessions.userId, ctx.auth.user.id),
          ),
        );
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      return row;
    }),
  create: protectedProcedure
    .input(
      z.object({
        meetingUrl: z.string().min(8),
        personId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const parsed = parseMeetingUrl(input.meetingUrl);
      if (!parsed.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: meetingUrlErrorMessage(parsed.code),
        });
      }

      if (input.personId) {
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Person not found" });
        }
      }

      const [created] = await db
        .insert(callSessions)
        .values({
          userId: ctx.auth.user.id,
          personId: input.personId,
          meetingUrl: parsed.meetingUrl,
          provider: parsed.provider,
          status: "queued",
        })
        .returning();

      const outputMediaUrl = `${appUrl()}/agent/recall?k=${signSessionId(created.id)}`;

      try {
        const { botId } = await recallMeetPipe.start({
          sessionId: created.id,
          meetingUrl: parsed.meetingUrl,
          outputMediaUrl,
        });
        const [updated] = await db
          .update(callSessions)
          .set({ recallBotId: botId, updatedAt: new Date() })
          .where(eq(callSessions.id, created.id))
          .returning();
        return updated;
      } catch (error) {
        await db
          .update(callSessions)
          .set({
            status: "failed",
            lastTool:
              error instanceof Error ? error.message : "Failed to send Pocketless",
            updatedAt: new Date(),
          })
          .where(eq(callSessions.id, created.id));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Could not join the Google Meet",
        });
      }
    }),
  stop: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(callSessions)
        .where(
          and(
            eq(callSessions.id, input.id),
            eq(callSessions.userId, ctx.auth.user.id),
          ),
        );
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (row.recallBotId) {
        await recallMeetPipe.stop(row.recallBotId);
      }
      const [updated] = await db
        .update(callSessions)
        .set({
          status: row.status === "in_call" ? "processing" : row.status,
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(callSessions.id, row.id))
        .returning();
      return updated;
    }),
});

export const episodesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(z.object({ personId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(episodes)
        .where(
          and(
            eq(episodes.userId, ctx.auth.user.id),
            eq(episodes.personId, input.personId),
          ),
        )
        .orderBy(desc(episodes.occurredAt));
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(episodes)
        .where(
          and(eq(episodes.id, input.id), eq(episodes.userId, ctx.auth.user.id)),
        );
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return row;
    }),
  setYouSpeaker: protectedProcedure
    .input(z.object({ id: z.string(), speaker: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(episodes)
        .set({ youSpeakerLabel: input.speaker })
        .where(
          and(eq(episodes.id, input.id), eq(episodes.userId, ctx.auth.user.id)),
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return updated;
    }),
});
