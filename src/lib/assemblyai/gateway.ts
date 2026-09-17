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

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      messages: input.messages,
      ...(input.json
        ? { response_format: { type: "json_object" } }
        : {}),
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
