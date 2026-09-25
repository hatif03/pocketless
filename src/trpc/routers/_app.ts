import { peopleRouter } from "@/modules/people/server/procedures";
import { promisesRouter } from "@/modules/promises/server/procedures";
import { settingsRouter } from "@/modules/settings/server/procedures";
import {
  episodesRouter,
  sessionsRouter,
} from "@/modules/sessions/server/procedures";
import { talkRouter } from "@/modules/talk/server/procedures";

import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  people: peopleRouter,
  promises: promisesRouter,
  sessions: sessionsRouter,
  episodes: episodesRouter,
  talk: talkRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
