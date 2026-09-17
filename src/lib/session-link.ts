import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return process.env.BETTER_AUTH_SECRET || "dev-only-session-link-secret";
}

export function signSessionId(sessionId: string) {
  const sig = createHmac("sha256", secret()).update(sessionId).digest("hex");
  return `${sessionId}.${sig}`;
}

export function verifySessionLink(token: string | null): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const sessionId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(sessionId).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return sessionId;
  } catch {
    return null;
  }
}
