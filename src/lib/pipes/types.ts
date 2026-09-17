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
      "Call this when asked to email someone. This is a mock send for the hackathon.",
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
      "Call this when asked to put something on the calendar. Mock hold only.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        when: { type: "string" },
      },
      required: ["title"],
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
