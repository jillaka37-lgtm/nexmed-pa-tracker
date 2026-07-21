"use client";

import { useEffect, useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; text: string };
type VoiceStatus = "idle" | "connecting" | "listening" | "speaking";

type Props = { onClose: () => void; channel?: string };

const AGENT_ID = "agent_9501kwqvns24eyht179r35f290de";

export function VoiceMode({ onClose }: Props) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdkRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-load SDK so button click has no async gap before getUserMedia (Safari requires user gesture)
    import("@11labs/client").then((m) => { sdkRef.current = m.Conversation; });
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns]);
  useEffect(() => () => { convRef.current?.endSession?.(); }, []);

  async function handleStart() {
    setError(null);
    setStatus("connecting");
    try {
      const Conversation = sdkRef.current;
      if (!Conversation) throw new Error("Still loading, please try again.");
      const conv = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
        useWakeLock: false,
        onConnect: () => setStatus("listening"),
        onDisconnect: () => setStatus("idle"),
        onError: (msg: unknown) => {
          setError(typeof msg === "string" ? msg : JSON.stringify(msg));
          setStatus("idle");
        },
        onModeChange: (mode: { mode: string }) => {
          setStatus(mode.mode === "speaking" ? "speaking" : "listening");
        },
        onMessage: (msg: { source: string; message: string }) => {
          if (msg.source === "ai" && msg.message?.trim())
            setTurns((p) => [...p, { role: "assistant", text: msg.message }]);
          if (msg.source === "user" && msg.message?.trim())
            setTurns((p) => [...p, { role: "user", text: msg.message }]);
        },
      });
      convRef.current = conv;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("idle");
    }
  }

  function handleEnd() {
    convRef.current?.endSession?.();
    convRef.current = null;
    setStatus("idle");
  }

  function handleClose() { handleEnd(); onClose(); }

  const isActive = status !== "idle";

  const label: Record<VoiceStatus, string> = {
    idle: "Tap Start to begin",
    connecting: "Connecting…",
    listening: "Listening, speak now",
    speaking: "NexMed is speaking…",
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-end pointer-events-none">
      <div className="pointer-events-auto mb-36 mr-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">N</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">NexMed Voice</p>
            <p className="text-xs text-blue-100">AI voice assistant</p>
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>

        {/* Transcript */}
        <div className="overflow-y-auto p-4 min-h-[140px] max-h-48 space-y-2">
          {turns.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">Your conversation will appear here</p>
          )}
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${t.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                {t.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 break-words">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-3 py-5 border-t border-gray-100 bg-gray-50">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-4 transition-all duration-300 ${
            status === "idle" ? "bg-gray-200 ring-gray-200" :
            status === "connecting" ? "bg-yellow-400 ring-yellow-300 animate-pulse" :
            status === "listening" ? "bg-red-500 ring-red-300 animate-pulse" :
            "bg-blue-500 ring-blue-300 animate-pulse"
          }`}>
            {status === "listening" && (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            )}
            {status === "speaking" && (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
            {status === "connecting" && (
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            {status === "idle" && (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            )}
          </div>

          <p className="text-xs text-gray-500 font-medium">{label[status]}</p>

          <div className="flex gap-3">
            {!isActive && (
              <button onClick={handleStart} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors">
                Start
              </button>
            )}
            {isActive && (
              <button onClick={handleEnd} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-full transition-colors">
                Stop
              </button>
            )}
            <button onClick={handleClose} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition-colors">
              End call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
