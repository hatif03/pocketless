# Upstream AssemblyAI

Track work against https://github.com/assemblyai while building Pocketless. File issues we actually hit. Details: `.cursor/skills/assemblyai-contribute/SKILL.md`.

## First issue to file (high confidence)

**Repo:** [AssemblyAI/assemblyai-skill](https://github.com/AssemblyAI/assemblyai-skill)

The skill `SKILL.md` Authentication section says all endpoints use `Authorization: YOUR_API_KEY` and **not** Bearer. Later in the same file, Voice Agent API is listed as the exception (`Authorization: Bearer KEY`). Agents that only load the header will generate broken Voice Agent clients — exactly this hackathon’s default path.

Ask: lead with “Voice Agent API requires Bearer”; keep “no Bearer” for REST/streaming/LLM Gateway.

## Other watch list

| Repo | Item | Notes |
|------|------|--------|
| [assemblyai-node-sdk#137](https://github.com/AssemblyAI/assemblyai-node-sdk/pull/137) | Streaming connect hang on socket error | Useful if we use JS streaming STT |
| [assemblyai-cli#125](https://github.com/AssemblyAI/assemblyai-cli/issues/125) | Default still pre-3.5-pro | Easy CLI PR after submit |
| [assemblyai-python-sdk#80](https://github.com/AssemblyAI/assemblyai-python-sdk/issues/80) | asyncio client | Too large for the hackathon |
| [voice-agent-starter-js](https://github.com/AssemblyAI/voice-agent-starter-js) | Browser starter | Steal patterns; send PRs if token/PCM docs drift |
| [realtime-transcription-browser-js-example](https://github.com/AssemblyAI/realtime-transcription-browser-js-example) | AudioWorklet PCM | We will need this if we roll our own streaming STT |

## Official agent wiring (done in this repo)

Per [coding-agent-prompts](https://www.assemblyai.com/docs/coding-agent-prompts):

- URL pin in `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/assemblyai.mdc`, `.github/copilot-instructions.md`
- Docs MCP: `.cursor/mcp.json` → `https://assemblyai.com/docs/mcp`
- Skill: `npx skills add AssemblyAI/assemblyai-skill` (Cursor + Claude Code)
