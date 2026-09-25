# Claude Code — Pocketless

Read `AGENTS.md` first.

## Before AssemblyAI work

Fetch https://www.assemblyai.com/docs/agent-instructions.md and https://www.assemblyai.com/docs/llms.txt.

Then `.claude/skills/assemblyai/SKILL.md`. Voice Agent API uses `Authorization: Bearer`. The skill header “never Bearer” is wrong for `agents.assemblyai.com`.

## MCP

```bash
claude mcp add assemblyai-docs --transport http https://assemblyai.com/docs/mcp
claude mcp add recall-ai --transport http https://ap-northeast-1.recall.ai/mcp
```

Recall MCP region must match the workspace this account's bot/API calls actually run in (`ap-northeast-1` here — see [docs.recall.ai/docs/docs-mcp](https://docs.recall.ai/docs/docs-mcp)). Other regions: `us-east-1`, `us-west-2`, `eu-central-1`.

## Do not

- Call LeMUR or pass `transcript_ids` to chat completions
- Put `ASSEMBLYAI_API_KEY` in client components or the Recall webpage
- Host a Pocketless Room / Stream MCU
- Add Polar checkout
