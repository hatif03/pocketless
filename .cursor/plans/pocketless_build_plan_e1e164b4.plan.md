---
name: Pocketless build plan
overview: Create a public GitHub repo, strip Polar (no payments until RevenueCat after submit), bump remaining deps, remove Stream as a hosted-call MCU, then ship a pipe-agnostic Pocketless agent that joins Google Meet via a meeting-link bot (Recall.ai Output Media + AssemblyAI Voice Agent). Zoom/Teams adapters and the companion pipe come after submit on the same agent and memory. Commit and push after each slice. Deadline 30 Sep 2026.
todos:
  - id: repo-init
    content: git init, first commit, gh repo create pocketless --public, push
    status: in_progress
  - id: deps
    content: Bump remaining deps to latest stable (Next 16.3.x, no cacheComponents); add assemblyai; remove Stream/Polar packages; fix build
    status: in_progress
  - id: remove-polar
    content: Remove Polar packages, plugin, upgrade/trial UI, premiumProcedure; ungated creates
    status: pending
  - id: after-list
    content: Write docs/after-hackathon.md (Zoom/Teams adapters, companion, RevenueCat, OAuth, RAG, never host a room)
    status: pending
  - id: schema-seed
    content: people, episodes, promises, decisions, sessions (meeting URL + bot id) + Priya seed
    status: pending
  - id: home-roster
    content: Home = people + promises; sidebar; person card; relocate transcript/recording
    status: pending
  - id: meeting-bot
    content: Paste Google Meet URL only → Recall bot join; reject Zoom/Teams in UI; session observer; no Stream room
    status: pending
  - id: voice-agent
    content: Recall Output Media webpage → AssemblyAI Voice Agent (24 kHz PCM, wake-name, TTS into the meeting)
    status: pending
  - id: tools-pipeline
    content: In-call tools + Inngest post-call STT/Gateway brief/promises; Talk to Pocketless
    status: pending
isProject: false
---

# Pocketless: join their call, not ours

Hackathon submit is **30 Sep 2026**. Polar is removed now. RevenueCat is **after submit only**. We **do not host calls**. Stream Video/Chat are Meet.AI leftovers and come out.

Pocketless is a **coworker that joins a call you already have**. Same agent + memory for every capture pipe. Hackathon ships the **meeting-link bot for Google Meet only** (demo with a Meet link). After submit, add **Zoom and Teams adapters** (same bot vendor, same pipe) and the **companion** pipe (system audio + virtual mic) without rewriting the agent.

## Product

Silent until **“Pocketless, …”**. Home is a **roster of people and promises**. Transcript/recording live one click down on a person.

Demo (one take):

1. Seeded person (Priya) with prior episodes, including a March quote.
2. Host starts a real **Google Meet**; pastes the Meet URL in Pocketless; a participant named **Pocketless** joins.
3. Dashboard shows You / Them / Pocketless lanes (captions + state — we are not the MCU).
4. Wake name → a **tool fires** (recall or create promise). Them hears Pocketless speak in *their* meeting.
5. Leave / meeting ends → person card **updates**. **Talk to Pocketless** on that person.

```mermaid
flowchart LR
  subgraph pipes [Capture pipes]
    Bot[MeetingBot_Recall]
    Companion[Companion_after_submit]
  end
  subgraph call [Their platform]
    Meet[Google_Meet_now]
    Later[Zoom_Teams_after]
  end
  subgraph speech [AssemblyAI]
    VA[Voice Agent API]
    STT[Pre-recorded STT]
    GW[LLM Gateway]
  end
  subgraph memory [Neon]
    People
    Promises
    Episodes
  end
  Meet --> Bot
  Bot --> VA
  VA --> Bot
  Bot --> Meet
  Later -.-> Bot
  Companion -.-> VA
  VA -->|tools| Promises
  Bot -->|recording| STT
  STT --> GW
  GW --> People
  GW --> Promises
  GW --> Episodes
```

**Pipe interface (build this first in code, even with one implementation):** `start(session)`, `stop(session)`, `onAudioIn`, `speak(pcm)`. Session holds `personIds`, tools, memory snapshot. Meeting-bot and companion are adapters. Do not couple Voice Agent or DB to Recall.

## Pocket → Pocketless

| Pocket | Hackathon | After submit | Never |
|--------|-----------|--------------|-------|
| One-button capture | **Paste Google Meet URL → bot joins** | Zoom + Teams adapters; companion on the laptop | **Hosted Pocketless Room / Stream MCU** |
| Transcript | Episode on person + search | Export | Stream’s transcription as source of truth |
| Summary | Relationship brief via Gateway | Regen / templates | LeMUR |
| Action items | **Promises**, creatable live | Task-app OAuth | |
| Ask Pocket | **Talk to Pocketless** | Corpus RAG | |
| Speakers | Bot participant events + AAI `speaker_labels` → Person | Enroll “you” | True biometrics |
| Calendar / email / CRM | **Mock in-call tools** | Real OAuth | |
| Mind map | Topics list if time | Graph | |
| Search | Episode transcript search | Global search | |
| Hardware / contact-mic | — | — | Puck, MagSafe, cellular recording |
| Unlimited free STT | — | Meter agent-hours + graph | Copy Pocket |

## Strategic avoid list → [docs/after-hackathon.md](docs/after-hackathon.md)

**After submit (do not start before):**

- **Zoom and Teams meeting-bot adapters** — same Recall Create Bot + Output Media path; enable `zoom` / `teams` URL parsing and test those platforms. Do not spend hackathon days on them.
- **Companion pipe** — loopback + virtual mic; Discord/FaceTime/etc.; same agent/tools/memory.
- **RevenueCat** — entitlements; meter agent hours + retained graph. No Polar fallback.
- Real Gmail / Calendar / CRM OAuth.
- pgvector RAG, mind-map graph, speaker enrollment.
- PWA/offline, native mobile, orgs/SAML, public MCP.
- Next.js Cache Components.
- Extra bot platforms (Webex, Slack Huddles) only if needed later.

**Never:** Hosted Pocketless Room, Stream as our call platform, MagSafe/puck, contact-mic recording, Polar, LeMUR, API keys in any client (including the Recall-hosted webpage — mint a temp token).

Update [AGENTS.md](AGENTS.md), [.cursor/rules/pocketless.mdc](.cursor/rules/pocketless.mdc), [docs/keep-remove.md](docs/keep-remove.md), [docs/pocket-gap.md](docs/pocket-gap.md): **pipes, not a room we host.**

---

## Current codebase (what changes)

Meet.AI is a **Stream-hosted meeting product**. We keep the SaaS skeleton (auth, dashboard, tRPC, Drizzle, Inngest) and **delete the MCU**.

Remove with Polar / as soon as the bot path compiles:

- `@stream-io/video-react-sdk`, `@stream-io/node-sdk`, `@stream-io/openai-realtime-api`, `stream-chat`, `stream-chat-react`
- [src/app/api/webhook/route.ts](src/app/api/webhook/route.ts) Stream handlers (`connectOpenAi`, **end-on-first-leave**)
- Call lobby/active/ended, `/call/[meetingId]`, Stream token procedures
- Sidebar “Meetings” as a video product — becomes **Sessions** (bot jobs)

Keep: Next, tRPC, Neon, Better Auth, Inngest, dashboard shell, transcript search UI (retargeted to episodes).

---

## Architecture

**Meeting bot vendor: Recall.ai** (keeps Zoom/Teams a config change later). Conversational audio uses **Output Media** (not the short `output_audio` clip API): the bot loads a webpage we host; that page gets the meeting `MediaStream`, we run AssemblyAI Voice Agent there, and page playback is what participants hear. Pattern: [Recall Output Media](https://docs.recall.ai/docs/stream-media) + [voice-agent-demo](https://github.com/recallai/voice-agent-demo), with OpenAI realtime **replaced** by AssemblyAI Voice Agent. Hackathon: `variant.google_meet: web_4_core` only. Bot display name: **Pocketless**. Camera page can show silent / listening / speaking.

**Hackathon URL gate:** accept `meet.google.com` only. Zoom/Teams paste → clear UI copy that those pipes ship after submit. Do not create a Recall bot for non-Meet URLs.

**Why not Meeting BaaS first:** Recall’s Output Media path is the documented way to put a *talking* agent in Zoom/Meet/Teams in one integration. Meeting BaaS stays a possible later swap behind the pipe interface.

**Voice Agent (live docs before coding):**

- Token minted **on our server**: `GET https://agents.assemblyai.com/v1/token` with `Authorization: Bearer` project key. The Recall webpage receives a **single-use token** (query or short-lived session cookie), never `ASSEMBLYAI_API_KEY`.
- WS: `wss://agents.assemblyai.com/v1/ws?token=…`
- `session.update`: no greeting; silent until wake name; `audio/pcm` 24 kHz in/out; `keyterms` (Pocketless, person names); flat `tools[]`.
- Resample meeting audio → `input.audio`. Play `reply.audio` on the page (Recall injects it into the call).
- `session.end` when the session stops. REST/STT/Gateway still use **raw key, no Bearer**.

**Dashboard is an observer**, not the call:

- Host UI: paste URL, pick person(s), **Send Pocketless**, live captions/lanes, tool chips, **Remove bot**.
- Humans stay in **Google Meet**. We do not invite guests into our app.

**Post-call:** Recall recording webhook → Inngest → AssemblyAI pre-recorded STT (`speaker_labels`, `speech_models: ["universal-3-5-pro", "universal-2"]`) → LLM Gateway brief + promises → person card. Do not use Recall/Stream transcripts as the product source of truth.

**Tools:** `recall_memory`, `create_promise`, `list_promises`, `draft_email` (mock), `hold_calendar` (mock), `note_decision`. Server executes; webpage sends `tool.result`.

**Agents CRUD:** gone from the product. One Pocketless personality.

**Payments:** none. `protectedProcedure` only.

**Deps:** Latest stable Next **16.3.x** without `cacheComponents`. Add `assemblyai@latest`. Do **not** bump Stream — remove it. Inngest: latest 3.x unless v4 is mechanical.

**GitHub:** `git init`, `gh repo create pocketless --public --source=. --remote=origin --push`. Commit + push after each slice. No `.env*`.

**Env:** `ASSEMBLYAI_API_KEY`, `RECALL_API_KEY`, `RECALL_REGION` (e.g. `us-east-1`), existing `DATABASE_URL` / Better Auth. Drop `STREAM_*`, `OPENAI_API_KEY`, `POLAR_*`. Bot webpage must be publicly reachable (Vercel preview or ngrok) so Recall can load Output Media.

---

## Build order (one slice = one commit + push)

### Slice 0 — Repo
Init git, public `pocketless`, push current tree.

### Slice 1 — Dependency bump (keep Stream compiling until slice 2/7 if needed)
Latest stables + Next 16.3.x. Add `assemblyai`. Prefer removing Stream in the same or next commit if the app still typechecks without those pages.

### Slice 2 — Kill Polar
As before: plugin, `/upgrade`, trial, `premiumProcedure`, `@polar-sh/*`, Polar skills.

### Slice 3 — After-hackathon list
[docs/after-hackathon.md](docs/after-hackathon.md): Zoom/Teams adapters, companion pipe, RevenueCat, OAuth, RAG, **never host a room**.

### Slice 4 — Memory + sessions schema
[src/db/schema.ts](src/db/schema.ts):

- `people`, `episodes`, `promises`, `decisions` (as before)
- `sessions` — `userId`, `personId` (nullable), `meetingUrl`, `provider` (`google_meet` now; `zoom` | `teams` reserved), `recallBotId`, status (`queued` | `in_call` | `processing` | `completed` | `failed`), recording URL
- No `room_invites`

Seed **Priya** + ≥3 episodes (March quote) + ≥1 open promise.

### Slice 5–6 — Home roster + person card
`/` is people + open promises. **Send Pocketless** (not Start Room). Sessions list is audit. Transcript/recording on the episode, not the homepage.

### Slice 7 — Meeting-bot pipe (no AAI yet)
tRPC `sessions.create({ meetingUrl, personId })` → parse URL → **reject unless Google Meet** → Recall Create Bot. Webhook route for Recall bot status (joining / in_call / done / fatal). Dashboard: status + **Remove**. Strip Stream call create, tokens, `/call/*`, Stream webhook. Bot can join mute/camera-placeholder so we can test join without speech.

### Slice 8 — Observer lanes
Live You / Them / Pocketless from Recall participant events + (later) Voice Agent captions. Not Stream `SpeakerLayout`.

### Slice 9 — Voice Agent on Output Media (P0)
Public page e.g. [src/app/agent/recall/page.tsx](src/app/agent/recall/page.tsx) (or route handler HTML) loaded by Recall `output_media.camera`. Token from our API with a signed session id. Wake-gated prompt. PCM bridge. `session.end` on bot leave.

### Slice 10 — In-call tools
Webpage `tool.call` → our server. Recall + create_promise minimum. Chips on the observer.

### Slice 11 — Post-session brief (P0)
Inngest on recording ready. AAI STT + Gateway. Drop gpt-4o / `@inngest/agent-kit` / `openai`.

### Slice 12 — Talk to Pocketless
Person-page text (and voice if time) via LLM Gateway + that person’s memory. Replace Stream Chat.

### Slice 13 — P1 if time
Speaker merge, topics list, export, host-only pre-brief in the dashboard (“Last time Priya said…”).

### Slice 14 — Demo harden
README: AssemblyAI + Recall + public URL for Output Media. Hide Agents/Upgrade. Verify on a **real Google Meet** only. Confirm we never create a Stream call and never dispatch a Zoom/Teams bot.

---

## Integrations

**Hackathon:** Recall.ai (Google Meet join + Output Media), AssemblyAI (Voice Agent + STT + Gateway), Inngest, Better Auth, Neon, tRPC.

**After:** Recall Zoom + Teams adapters, companion pipe, RevenueCat, Google Calendar, Gmail, pgvector.

**Not:** Stream Video/Chat, Polar, OpenAI realtime, a Pocketless-hosted WebRTC room.

---

## Verification

Roster → person → create a **real Google Meet** → paste Meet URL → Pocketless appears in *that* Meet → wake name → tool → people in Meet hear the reply → end meeting → person card updates → Talk to Pocketless. Confirm a Zoom URL is refused with “after launch” copy. No Stream, no Polar, no project API key in the bot webpage or browser bundle.
