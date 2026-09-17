import "server-only";

const US = "https://agents.assemblyai.com";

export async function mintVoiceAgentToken() {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) {
    throw new Error("ASSEMBLYAI_API_KEY is not set");
  }

  const url = new URL(`${US}/v1/token`);
  url.searchParams.set("expires_in_seconds", "300");
  url.searchParams.set("max_session_duration_seconds", "3600");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    throw new Error(
      `Voice Agent token failed (${response.status}): ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { token: string };
  return body.token;
}
