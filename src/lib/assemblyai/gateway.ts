import "server-only";

const GATEWAY = "https://llm-gateway.assemblyai.com/v1/chat/completions";

export async function gatewayChat(input: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  json?: boolean;
}) {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) {
    throw new Error("ASSEMBLYAI_API_KEY is not set");
  }

  // qwen3.5-4b-32k-fast is the only model this AssemblyAI free-tier account
  // has Gateway access to. It doesn't support response_format (JSON output
  // relies on prompting, with a fallback in callers if parsing fails) and
  // requires the system message to be first, so the JSON instruction is
  // folded into the existing leading system message rather than appended.
  const JSON_INSTRUCTION =
    "Respond with ONLY valid JSON. No markdown, no code fences, no explanation before or after.";
  const messages =
    input.json && input.messages[0]?.role === "system"
      ? [
          {
            ...input.messages[0],
            content: `${input.messages[0].content}\n\n${JSON_INSTRUCTION}`,
          },
          ...input.messages.slice(1),
        ]
      : input.json
        ? [{ role: "system" as const, content: JSON_INSTRUCTION }, ...input.messages]
        : input.messages;

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3.5-4b-32k-fast",
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `LLM Gateway failed (${response.status}): ${await response.text()}`,
    );
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content ?? "";
}
