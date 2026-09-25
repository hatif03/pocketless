import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

// Recall.ai delivers webhooks via Svix: https://docs.svix.com/receiving/verifying-payloads/how-manual
// Signed content is `${id}.${timestamp}.${body}`, HMAC-SHA256, secret is `whsec_<base64>`,
// svix-signature is a space-delimited list of `v1,<base64sig>` (supports key rotation).
const TOLERANCE_SECONDS = 5 * 60;

export function verifySvixWebhook(input: {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  body: string;
  secret: string;
}): boolean {
  const { id, timestamp, signature, body, secret } = input;
  if (!id || !timestamp || !signature) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > TOLERANCE_SECONDS) {
    return false;
  }

  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", keyBytes)
    .update(`${id}.${timestamp}.${body}`)
    .digest();

  return signature.split(" ").some((entry) => {
    const [version, sig] = entry.split(",");
    if (version !== "v1" || !sig) return false;
    try {
      const actual = Buffer.from(sig, "base64");
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  });
}
