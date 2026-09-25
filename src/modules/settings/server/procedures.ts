import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const REQUIRED_GOOGLE_SCOPES = ["calendar.events", "gmail.compose"];

export const settingsRouter = createTRPCRouter({
  googleStatus: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({ scope: account.scope })
      .from(account)
      .where(
        and(
          eq(account.userId, ctx.auth.user.id),
          eq(account.providerId, "google"),
        ),
      );

    const scopes = rows.map((r) => r.scope ?? "").join(" ");
    const linked = rows.length > 0;
    const hasFullScopes = REQUIRED_GOOGLE_SCOPES.every((s) => scopes.includes(s));

    return { linked, hasFullScopes };
  }),
});
