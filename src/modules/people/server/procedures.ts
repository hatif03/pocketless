import { and, desc, eq, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/db";
import { people, promises } from "@/db/schema";
import { seedPriyaForUser } from "@/lib/seed-priya";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const peopleRouter = createTRPCRouter({
  ensureDemo: protectedProcedure.mutation(async ({ ctx }) => {
    const personId = await seedPriyaForUser(ctx.auth.user.id);
    return { personId };
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
