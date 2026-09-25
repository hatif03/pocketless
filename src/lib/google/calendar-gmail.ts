import "server-only";

import { auth } from "@/lib/auth";

async function getGoogleAccessToken(userId: string) {
  try {
    const result = await auth.api.getAccessToken({
      body: { userId, providerId: "google" },
    });
    return result.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function createCalendarEvent(input: {
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
}) {
  const token = await getGoogleAccessToken(input.userId);
  if (!token) return null;

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        start: { dateTime: input.startTime },
        end: { dateTime: input.endTime },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Google Calendar event creation failed (${response.status}): ${await response.text()}`,
    );
  }
  const event = (await response.json()) as { id: string; htmlLink: string };
  return { id: event.id, url: event.htmlLink };
}

export async function createGmailDraft(input: {
  userId: string;
  to?: string;
  subject: string;
  body: string;
}) {
  const token = await getGoogleAccessToken(input.userId);
  if (!token) return null;

  const message = [
    input.to ? `To: ${input.to}` : null,
    `Subject: ${input.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.body,
  ]
    .filter((line): line is string => line !== null)
    .join("\r\n");

  const raw = Buffer.from(message).toString("base64url");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: { raw } }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Gmail draft creation failed (${response.status}): ${await response.text()}`,
    );
  }
  const draft = (await response.json()) as { id: string };
  return { id: draft.id };
}
