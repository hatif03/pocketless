import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/db";
import { people, promises } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const promisesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z
        .object({
          personId: z.string().optional(),
          status: z.enum(["open", "done", "dropped"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({
          promise: promises,
          personName: people.name,
        })
        .from(promises)
        .innerJoin(people, eq(promises.personId, people.id))
        .where(
          and(
            eq(promises.userId, ctx.auth.user.id),
            input?.personId ? eq(promises.personId, input.personId) : undefined,
            input?.status ? eq(promises.status, input.status) : undefined,
          ),
        )
        .orderBy(desc(promises.createdAt));

      return rows.map((row) => ({
        ...row.promise,
        personName: row.personName,
      }));
    }),
  create: protectedProcedure
    .input(
      z.object({
        personId: z.string(),
        text: z.string().min(1),
        sourceSessionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [person] = await db
        .select()
        .from(people)
        .where(
          and(eq(people.id, input.personId), eq(people.userId, ctx.auth.user.id)),
        );
      if (!person) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [created] = await db
        .insert(promises)
        .values({
          userId: ctx.auth.user.id,
          personId: input.personId,
          text: input.text,
          sourceSessionId: input.sourceSessionId,
        })
        .returning();
      return created;
    }),
  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["open", "done", "dropped"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(promises)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(eq(promises.id, input.id), eq(promises.userId, ctx.auth.user.id)),
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return updated;
    }),
});
