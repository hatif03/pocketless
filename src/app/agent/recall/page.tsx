import { Suspense } from "react";

import { RecallVoiceAgent } from "@/modules/sessions/ui/components/recall-voice-agent";

export default function RecallAgentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#101213] text-white p-8">Starting Pocketless…</div>}>
      <RecallVoiceAgent />
    </Suspense>
  );
}
