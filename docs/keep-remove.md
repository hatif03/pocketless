# Existing Meet.AI vs Pocketless vs Pocket

CodeWithAntonio **Meet.AI** is the dump we started from. We keep the SaaS skeleton and **delete the hosted-call MCU**.

## Keep

| Piece | Why |
|-------|-----|
| Next.js App Router, React, Tailwind, shadcn | Standard web stack |
| tRPC + TanStack Query + Zod | Typed API |
| Drizzle + Neon | People, promises, episodes |
| Better Auth (email + GitHub + Google) | Keep; SAML only post-PMF |
| Dashboard shell, forms, tables | Rename toward people/promises |
| Transcript search UI | Reuse on episodes |
| Inngest | Post-session STT + Gateway jobs |

## Replace

| Today (Meet.AI) | Pocketless |
|-----------------|------------|
| Stream Video room we host | Recall.ai bot joins **their Google Meet** |
| `connectOpenAi` | AssemblyAI Voice Agent on Recall Output Media |
| gpt-4o summarizer / Ask AI | LLM Gateway on person memory |
| Meetings + custom agents home | People + promises home |
| Polar `premiumProcedure` | No payments until RevenueCat after submit |

## Remove

- Stream Video, Stream Chat, `@stream-io/openai-realtime-api`
- Polar (`@polar-sh/*`, `/upgrade`, trial, billing portal)
- OpenAI / `@inngest/agent-kit` once Gateway is wired
- Hosted `/call/*` lobby
- Agents CRUD as a product surface

## Add

- `ASSEMBLYAI_API_KEY`, `RECALL_API_KEY`, public Output Media URL
- `people`, `promises`, `decisions`, `episodes`, `call_sessions`
- Seeded Priya history
- Wake-name gating + You / Them / Pocketless observer lanes
- In-call tools: recall, mock email, mock calendar, create promise
