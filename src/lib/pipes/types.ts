import "server-only";

export type CapturePipe = {
  start: (input: {
    sessionId: string;
    meetingUrl: string;
    outputMediaUrl: string;
  }) => Promise<{ botId: string }>;
  stop: (botId: string) => Promise<void>;
};

export const voiceAgentTools = [
  {
    type: "function" as const,
    name: "recall_memory",
    description:
      "Call this when someone says Pocketless and asks what you remember, what Priya said, past episodes, or prior promises.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to look up in relationship memory",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "create_promise",
    description:
      "Call this when someone asks Pocketless to remember a commitment, send something, or follow up.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "The promise in one sentence" },
      },
      required: ["text"],
    },
  },
  {
    type: "function" as const,
    name: "list_promises",
    description: "Call this when asked what is still open with this person.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "draft_email",
    description:
      "Call this when asked to email someone. Creates a real Gmail draft (never auto-sent) if the user has connected Gmail, otherwise holds a mock placeholder.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["subject", "body"],
    },
  },
  {
    type: "function" as const,
    name: "hold_calendar",
    description:
      "Call this when asked to put something on the calendar. Creates a real Google Calendar event if the user has connected Google Calendar, otherwise holds a mock placeholder.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        startTime: {
          type: "string",
          description: "ISO 8601 date-time, e.g. 2026-09-25T15:00:00-07:00",
        },
        endTime: {
          type: "string",
          description: "ISO 8601 date-time, e.g. 2026-09-25T15:30:00-07:00",
        },
      },
      required: ["title", "startTime", "endTime"],
    },
  },
  {
    type: "function" as const,
    name: "note_decision",
    description: "Call this when someone says Pocketless, note that we decided…",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string" },
      },
      required: ["text"],
    },
  },
];
