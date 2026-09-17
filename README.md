# Pocketless

A coworker in **their** Google Meet. Silent until you say **Pocketless**. Remembers people and promises.

Hackathon: [AssemblyAI Voice Agent Hackathon](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon) (30 Sep 2026).

We do **not** host the call. Paste a Meet URL; Pocketless joins as a participant.

## Setup

```bash
npm install
cp env.example .env.local
# DATABASE_URL, BETTER_AUTH_*, ASSEMBLYAI_API_KEY, RECALL_API_KEY
# NEXT_PUBLIC_APP_URL must be publicly reachable so Recall can load /agent/recall
npm run db:push
npm run dev
npx inngest-cli@latest dev
```

Create keys at [assemblyai.com/dashboard](https://www.assemblyai.com/dashboard/home) and [recall.ai](https://www.recall.ai/).

## Docs

- `docs/keep-remove.md` — what we kept from Meet.AI
- `docs/pocket-gap.md` — Pocket feature mapping
- `docs/after-hackathon.md` — Zoom/Teams, companion, RevenueCat, never-list
