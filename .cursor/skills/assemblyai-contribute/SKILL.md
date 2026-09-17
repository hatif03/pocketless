---
name: assemblyai-contribute
description: Find, file, and fix upstream AssemblyAI GitHub issues while building Pocketless. Use when the user mentions contributing, github.com/assemblyai, SDK bugs, skill inaccuracies, or opening PRs.
---

# Contribute to AssemblyAI

Org: https://github.com/assemblyai

## How we contribute (while shipping Pocketless)

Prefer issues we **hit in this repo**. A one-line “docs wrong for Voice Agent Bearer auth” with a failing snippet beats a drive-by feature request.

1. Reproduce against **latest** `assemblyai` npm/PyPI and live docs (`llms.txt`).
2. Search existing issues/PRs on the specific repo (`assemblyai-node-sdk`, `assemblyai-python-sdk`, `assemblyai-skill`, `cli`, `voice-agent-starter-js`).
3. File with: expected vs actual, request/response (redact keys), SDK version, region (US/EU).
4. If the fix is small and we already have a patch in Pocketless, open a PR. Do not stall the hackathon on upstream review.

## High-value gaps we already see

- **assemblyai-skill:** top of `SKILL.md` says never use Bearer; Voice Agent API **requires** Bearer. Agents that only read the header will generate broken `agents.assemblyai.com` clients. Also: Voice Agent coverage is thinner than LiveKit/Pipecat — a `references/voice-agent-api.md` would help this hackathon’s entire cohort.
- **assemblyai-node-sdk:** streaming `connect()` hanging on socket error ([#137](https://github.com/AssemblyAI/assemblyai-node-sdk/pull/137) / related issues).
- **cli:** still defaulting older speech models ([#125](https://github.com/AssemblyAI/assemblyai-cli/issues/125) `universal-3-pro`).
- **python-sdk:** asyncio client requested for years ([#80](https://github.com/AssemblyAI/assemblyai-python-sdk/issues/80)) — large, not a hackathon side quest unless we are already in Python.

## What not to do

Do not scrape private API surfaces into public issues. Do not paste customer audio. Do not “fix” deprecated LeMUR examples by resurrecting LeMUR — point them at LLM Gateway.
