export type MeetingUrlFailure = "zoom_later" | "teams_later" | "unknown";

export type ParsedMeetingUrl =
  | { ok: true; provider: "google_meet"; meetingUrl: string }
  | { ok: false; code: MeetingUrlFailure };

export function parseMeetingUrl(raw: string): ParsedMeetingUrl {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, code: "unknown" };
  }

  const host = url.hostname.toLowerCase();

  if (host === "meet.google.com" || host.endsWith(".meet.google.com")) {
    return { ok: true, provider: "google_meet", meetingUrl: url.toString() };
  }

  if (host.includes("zoom.us") || host.includes("zoom.com")) {
    return { ok: false, code: "zoom_later" };
  }

  if (host.includes("teams.microsoft.com") || host.includes("teams.live.com")) {
    return { ok: false, code: "teams_later" };
  }

  return { ok: false, code: "unknown" };
}

export function meetingUrlErrorMessage(code: MeetingUrlFailure) {
  if (code === "zoom_later") {
    return "Zoom joins after launch. Paste a Google Meet link for the hackathon.";
  }
  if (code === "teams_later") {
    return "Teams joins after launch. Paste a Google Meet link for the hackathon.";
  }
  return "Use a Google Meet link (meet.google.com). We do not host the call.";
}
