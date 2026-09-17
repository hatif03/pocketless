"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type AgentStatus = "silent" | "listening" | "speaking";

type PendingTool = {
  call_id: string;
  result: string;
  is_error: boolean;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToPcm16(b64: string) {
  const raw = atob(b64);
  const pcm16 = new Int16Array(raw.length / 2);
  for (let i = 0; i < pcm16.length; i++) {
    pcm16[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
  }
  return pcm16;
}

export function RecallVoiceAgent() {
  const searchParams = useSearchParams();
  const k = searchParams.get("k");
  const [status, setStatus] = useState("starting");
  const [you, setYou] = useState("");
  const [them, setThem] = useState("");
  const [pocketless, setPocketless] = useState("");
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("silent");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!k) {
      setStatus("missing session link");
      return;
    }

    let cancelled = false;
    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let playbackTime = 0;
    const sources: AudioBufferSourceNode[] = [];
    const pendingTools: PendingTool[] = [];

    const postLive = (next: {
      liveYou?: string;
      liveThem?: string;
      livePocketless?: string;
      agentStatus?: AgentStatus;
      participants?: string[];
    }) => {
      void fetch(`/api/agent/live?k=${encodeURIComponent(k)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    };

    const flushTools = (ws: WebSocket, discard: boolean) => {
      if (discard) {
        pendingTools.length = 0;
        return;
      }
      while (pendingTools.length > 0) {
        const tool = pendingTools.shift();
        if (!tool || ws.readyState !== WebSocket.OPEN) continue;
        ws.send(
          JSON.stringify({
            type: "tool.result",
            call_id: tool.call_id,
            result: tool.result,
            is_error: tool.is_error,
          }),
        );
      }
    };

    const run = async () => {
      setStatus("minting token");
      const [tokenRes, sessionRes] = await Promise.all([
        fetch(`/api/assemblyai/voice-agent-token?k=${encodeURIComponent(k)}`),
        fetch(`/api/agent/session?k=${encodeURIComponent(k)}`),
      ]);
      if (!tokenRes.ok || !sessionRes.ok) {
        setStatus("auth failed");
        return;
      }
      const { token } = (await tokenRes.json()) as { token: string };
      const session = (await sessionRes.json()) as {
        systemPrompt: string;
        tools: unknown[];
        keyterms: string[];
      };

      audioCtx = new AudioContext({ sampleRate: 24000 });
      await audioCtx.audioWorklet.addModule("/pcm-processor.js");
      await audioCtx.resume();

      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false },
      });

      const source = audioCtx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioCtx, "pcm-processor", {
        processorOptions: {
          inputSampleRate: audioCtx.sampleRate,
          targetSampleRate: 24000,
        },
      });

      const wsUrl = new URL("wss://agents.assemblyai.com/v1/ws");
      wsUrl.searchParams.set("token", token);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let ready = false;

      worklet.port.onmessage = (event) => {
        if (!ready || ws.readyState !== WebSocket.OPEN) return;
        const b64 = bytesToBase64(new Uint8Array(event.data as ArrayBuffer));
        ws.send(JSON.stringify({ type: "input.audio", audio: b64 }));
      };
      source.connect(worklet);

      try {
        const recallWs = new WebSocket(
          "wss://meeting-data.bot.recall.ai/api/v1/transcript",
        );
        recallWs.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string) as {
              transcript?: { words?: { text?: string }[] };
            };
            const text = payload.transcript?.words
              ?.map((word) => word.text)
              .filter(Boolean)
              .join(" ");
            if (text) {
              setThem(text);
              postLive({ liveThem: text });
            }
          } catch {
            /* ignore non-transcript frames */
          }
        };
      } catch {
        /* Recall meeting-data WS is only available inside Output Media */
      }

      ws.addEventListener("open", () => {
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              system_prompt: session.systemPrompt,
              input: {
                format: { encoding: "audio/pcm" },
                keyterms: session.keyterms,
              },
              output: {
                voice: "alba",
                format: { encoding: "audio/pcm" },
                volume: 100,
              },
              tools: session.tools,
            },
          }),
        );
      });

      ws.addEventListener("message", async (event) => {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          text?: string;
          data?: string;
          name?: string;
          call_id?: string;
          arguments?: Record<string, unknown>;
          status?: string;
          message?: string;
        };

        if (msg.type === "session.ready") {
          ready = true;
          setStatus("in Meet — silent until Pocketless");
          setAgentStatus("silent");
          postLive({ agentStatus: "silent" });
        } else if (msg.type === "input.speech.started") {
          setAgentStatus("listening");
          postLive({ agentStatus: "listening" });
        } else if (msg.type === "reply.started") {
          setAgentStatus("speaking");
          postLive({ agentStatus: "speaking" });
        } else if (msg.type === "reply.done") {
          setAgentStatus("silent");
          postLive({ agentStatus: "silent" });
          if (msg.status === "interrupted" && audioCtx) {
            playbackTime = audioCtx.currentTime;
            sources.splice(0).forEach((node) => {
              try {
                node.stop();
              } catch {
                /* already stopped */
              }
            });
            flushTools(ws, true);
          } else {
            flushTools(ws, false);
          }
        } else if (msg.type === "transcript.user") {
          setThem(msg.text ?? "");
          postLive({ liveThem: msg.text, agentStatus: "listening" });
        } else if (msg.type === "transcript.agent") {
          setPocketless(msg.text ?? "");
          postLive({ livePocketless: msg.text, agentStatus: "speaking" });
        } else if (msg.type === "reply.audio" && audioCtx && msg.data) {
          const pcm16 = base64ToPcm16(msg.data);
          const float32 = new Float32Array(pcm16.length);
          for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768;
          }
          const buffer = audioCtx.createBuffer(1, float32.length, 24000);
          buffer.getChannelData(0).set(float32);
          const src = audioCtx.createBufferSource();
          src.buffer = buffer;
          src.connect(audioCtx.destination);
          const now = audioCtx.currentTime;
          playbackTime = Math.max(playbackTime, now);
          src.start(playbackTime);
          playbackTime += buffer.duration;
          sources.push(src);
        } else if (msg.type === "tool.call" && msg.call_id && msg.name) {
          setYou(`tool: ${msg.name}`);
          postLive({ liveYou: `tool: ${msg.name}` });
          const toolRes = await fetch(
            `/api/agent/tools?k=${encodeURIComponent(k)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: msg.name,
                arguments: msg.arguments ?? {},
              }),
            },
          );
          const json = (await toolRes.json()) as { result?: unknown };
          pendingTools.push({
            call_id: msg.call_id,
            result: JSON.stringify(json.result ?? json),
            is_error: !toolRes.ok,
          });
        } else if (msg.type === "session.error" || msg.type === "error") {
          setStatus(msg.message || "session error");
        } else if (msg.type === "session.ended") {
          setStatus("ended");
        }
      });
    };

    run().catch((error: unknown) => {
      if (!cancelled) {
        setStatus(error instanceof Error ? error.message : "failed");
      }
    });

    const onHide = () => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "session.end" }));
        ws.close();
      }
    };
    window.addEventListener("pagehide", onHide);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onHide);
      onHide();
      stream?.getTracks().forEach((track) => track.stop());
      void audioCtx?.close();
    };
  }, [k]);

  return (
    <div className="min-h-screen bg-[#101213] text-white flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-2xl font-semibold">Pocketless</p>
      <p className="text-sm text-white/70">{status}</p>
      <p className="text-xs uppercase tracking-wide text-emerald-300">
        {agentStatus}
      </p>
      <div className="max-w-lg text-sm space-y-2 text-white/80">
        <p>
          <span className="text-white/50">Them:</span> {them}
        </p>
        <p>
          <span className="text-white/50">Pocketless:</span> {pocketless}
        </p>
        <p>
          <span className="text-white/50">Host:</span> {you}
        </p>
      </div>
    </div>
  );
}
