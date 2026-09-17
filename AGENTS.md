# Pocketless — agent instructions

This repo is **Pocketless**: a coworker that joins **their** Google Meet, remembers people and promises, and does follow-through. [AssemblyAI Voice Agent Hackathon](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon) (submit by 30 Sep 2026).

Home is a **roster of people and promises**, not a recordings feed. We do **not** host the call.

## AssemblyAI (required)

Before writing **any** AssemblyAI code, fetch and follow:

1. https://www.assemblyai.com/docs/agent-instructions.md
2. https://www.assemblyai.com/docs/llms.txt

Do not use LeMUR, `auto_chapters`, `summarization`, or `u3-rt-pro`. Prefer `universal-3-5-pro`.

**Auth:** REST, streaming STT, LLM Gateway use `Authorization: YOUR_API_KEY` (no Bearer). Voice Agent token + WS (`agents.assemblyai.com`) use `Authorization: Bearer YOUR_API_KEY`. Never put the project key in client code (including the Recall Output Media page). Mint temp tokens server-side.

## Product rules

- Silent until “Pocketless, …”.
- Memory: Person, Episode (internal), Promise, Decision.
- Hackathon pipe: paste a **Google Meet** URL → Recall.ai bot joins. Zoom/Teams and companion are after submit. See `docs/after-hackathon.md`.
- No payments during the hackathon. RevenueCat after submit. No Polar.

## Stack

Next.js App Router, tRPC, Drizzle + Neon, Better Auth, Recall.ai (Meet join + Output Media), Inngest, AssemblyAI Voice Agent + LLM Gateway.

## Skills

- `.cursor/skills/pocketless/SKILL.md`
- `.cursor/skills/assemblyai-contribute/SKILL.md`
- `.agents/skills/assemblyai/SKILL.md`
- Vercel / Better Auth / shadcn / Inngest skills in `.agents/skills/`
