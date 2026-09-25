# Pocketless — agent instructions

This repo is **Pocketless**: a coworker that joins **their** Google Meet, remembers people and promises, and does follow-through. [AssemblyAI Voice Agent Hackathon](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon) (submit by 30 Sep 2026).

Home is a **roster of people and promises**, not a recordings feed. We do **not** host the call.

## AssemblyAI (required)

Before writing **any** AssemblyAI code, fetch and follow:

1. https://www.assemblyai.com/docs/agent-instructions.md
2. https://www.assemblyai.com/docs/llms.txt

Do not use LeMUR, `auto_chapters`, `summarization`, or `u3-rt-pro`. Prefer `universal-3-5-pro`.

**Auth:** REST, streaming STT, LLM Gateway use `Authorization: YOUR_API_KEY` (no Bearer). Voice Agent token + WS (`agents.assemblyai.com`) use `Authorization: Bearer YOUR_API_KEY`. Never put the project key in client code (including the Recall Output Media page). Mint temp tokens server-side.

**LLM Gateway model:** this account is on AssemblyAI's free tier, which only has Gateway access to `qwen3.5-4b-32k-fast` (verified live — every other model, including the skill's suggested defaults, returns "account does not have access"). It also doesn't support `response_format`, and requires the system message to be first in the array — see `src/lib/assemblyai/gateway.ts` for how JSON output is done via prompting instead. Check before changing the model that the account actually has access to whatever you switch to.

## Product rules

- Silent until “Pocketless, …”.
- Memory: Person, Episode (internal), Promise, Decision.
- Hackathon pipe: paste a **Google Meet** URL → Recall.ai bot joins. Zoom/Teams and companion are after submit. See `docs/after-hackathon.md`.
- No payments during the hackathon. RevenueCat after submit. No Polar.

## Stack

Next.js App Router, tRPC, Drizzle + Postgres (node-postgres driver; local dev runs a plain `postgres:16-alpine` Docker container — no Neon dependency), Better Auth, Recall.ai (Meet join + Output Media), Inngest, AssemblyAI Voice Agent + LLM Gateway.

## Skills

- `.cursor/skills/pocketless/SKILL.md`
- `.cursor/skills/assemblyai-contribute/SKILL.md`
- `.agents/skills/assemblyai/SKILL.md`
- Vercel / Better Auth / shadcn / Inngest skills in `.agents/skills/`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
