# Claude Code — Pocketless

Read `AGENTS.md` first.

## Before AssemblyAI work

Fetch https://www.assemblyai.com/docs/agent-instructions.md and https://www.assemblyai.com/docs/llms.txt.

Then `.claude/skills/assemblyai/SKILL.md`. Voice Agent API uses `Authorization: Bearer`. The skill header “never Bearer” is wrong for `agents.assemblyai.com`.

## MCP

```bash
claude mcp add assemblyai-docs --transport http https://assemblyai.com/docs/mcp
```

## Do not

- Call LeMUR or pass `transcript_ids` to chat completions
- Put `ASSEMBLYAI_API_KEY` in client components or the Recall webpage
- Host a Pocketless Room / Stream MCU
- Add Polar checkout
