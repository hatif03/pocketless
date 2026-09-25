import { eq } from "drizzle-orm";

import { db } from "@/db";
import { episodes, people, promises } from "@/db/schema";
import { indexEpisode } from "@/lib/memory/index-episode";

const MARCH_QUOTE =
  "In March Priya said she would rather we ship the memory graph before we add another OAuth.";

export async function seedPriyaForUser(userId: string) {
  const existing = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.userId, userId))
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const [priya] = await db
    .insert(people)
    .values({
      userId,
      name: "Priya Shah",
      aliases: "Priya",
      relationshipBrief:
        "Design partner. Cares about staying present in calls. Wants Pocketless to remember people, not recordings. " +
        MARCH_QUOTE,
      lastSpokeAt: new Date("2026-03-12T15:00:00Z"),
    })
    .returning();

  const seededEpisodes = await db
    .insert(episodes)
    .values([
    {
      userId,
      personId: priya.id,
      title: "March scoping walk",
      brief:
        "Agreed memory should attach to people. " + MARCH_QUOTE,
      transcript: `You: Should we add more integrations next?\nPriya: ${MARCH_QUOTE}`,
      topics: "memory, oauth, sequencing",
      occurredAt: new Date("2026-03-12T15:00:00Z"),
    },
    {
      userId,
      personId: priya.id,
      title: "June demo retro",
      brief: "Priya asked for wake-name gating so Pocketless stays silent in the room.",
      transcript:
        "Priya: I don't want another bot that talks over us. Wake name only.\nYou: Pocketless, got it.",
      topics: "wake-name, silence",
      occurredAt: new Date("2026-06-04T18:00:00Z"),
    },
    {
      userId,
      personId: priya.id,
      title: "August promises check-in",
      brief: "Open follow-up: send Priya the one-pager after the next live session.",
      transcript:
        "You: I'll send the one-pager after we try this in a real Meet.\nPriya: Perfect.",
      topics: "follow-up, one-pager",
      occurredAt: new Date("2026-08-21T16:30:00Z"),
    },
  ])
    .returning({ id: episodes.id });

  await db.insert(promises).values({
    userId,
    personId: priya.id,
    text: "Send Priya the Pocketless one-pager after the next live Google Meet",
    status: "open",
    dueAt: new Date("2026-09-20T17:00:00Z"),
  });

  await Promise.all(seededEpisodes.map((episode) => indexEpisode(episode.id)));

  return priya.id;
}
