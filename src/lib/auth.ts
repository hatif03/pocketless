import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Login only requests email/profile (see socialProviders default scopes).
      // Calendar/Gmail scopes are requested separately via authClient.linkSocial
      // from the settings page, so signing in with Google never prompts for them.
      accessType: "offline",
      // "consent" is what actually matters here — it forces Google to reissue
      // a refresh token on repeat logins. Better Auth's type also offers
      // "select_account+consent", but Google's real endpoint parses that as
      // one literal (invalid) prompt value and 400s — confirmed live.
      prompt: "consent",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
});
