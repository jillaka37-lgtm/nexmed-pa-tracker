"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";

type Message = {
  role: "user" | "assistant";
  content: string;
  messageId?: string;
  feedback?: 1 | -1;
};

type Props = {
  channel?: "web" | "widget";
  className?: string;
};

const WELCOME =
  "Hi! I'm the NexMed AI assistant. I can help you learn about our services, book a consultation, or answer any health questions. How can I help you today?";

const QUICK_REPLIES = [
  "What services do you offer?",
  "How much does a consultation cost?",
  "How do I book an appointment?",
  "Can I get a prescription refill?",
];

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={active ? "currentColor" : "none"} />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function ChatWindow({ channel = "web", className = "" }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [liveAgentBanner, setLiveAgentBanner] = useState(false);
  const [contactBanner, setContactBanner] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playTTS = useCallback(async (text: string) => {
    if (voiceMuted || !text.trim()) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    try {
      setSpeaking(true);
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setSpeaking(false);
        audioRef.current = null;
      };
      audio.play().catch(() => setSpeaking(false));
    } catch {
      setSpeaking(false);
    }
  }, [voiceMuted]);

  const sendFeedback = useCallback(async (messageId: string, rating: 1 | -1) => {
    if (!sessionId) return;
    setMessages((prev) =>
      prev.map((m) => (m.messageId === messageId ? { ...m, feedback: rating } : m)),
    );
    await fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, sessionId, rating }),
    }).catch(() => null);
  }, [sessionId]);

  const sendText = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setShowQuickReplies(false);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, channel }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
      if (data.liveAgentRequested) setLiveAgentBanner(true);
      if (data.contactCollected) setContactBanner(true);
      const replyText = data.text || "Sorry, I could not generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: replyText, messageId: data.messageId }]);
      playTTS(replyText);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, channel, playTTS]);

  const send = useCallback(() => sendText(input.trim()), [input, sendText]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const toggleMic = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false); }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) sendText(transcript.trim());
    };
    recognition.start();
  }, [listening, sendText]);

  const toggleMute = useCallback(() => {
    if (!voiceMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
    }
    setVoiceMuted((v) => !v);
  }, [voiceMuted]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {(speaking || listening) && (
        <div className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium ${listening ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${listening ? "bg-red-500" : "bg-blue-500"}`} />
          {listening ? "Listening… speak now" : "Speaking…"}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i}>
            <ChatMessage role={m.role} content={m.content} />
            {m.role === "assistant" && m.messageId && (
              <div className="flex gap-1 mb-3 ml-9">
                <button onClick={() => sendFeedback(m.messageId!, 1)} disabled={m.feedback !== undefined} title="Helpful"
                  className={`text-sm px-2 py-0.5 rounded-full border transition-colors ${m.feedback === 1 ? "bg-green-100 border-green-400 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 disabled:opacity-40"}`}>👍</button>
                <button onClick={() => sendFeedback(m.messageId!, -1)} disabled={m.feedback !== undefined} title="Not helpful"
                  className={`text-sm px-2 py-0.5 rounded-full border transition-colors ${m.feedback === -1 ? "bg-red-100 border-red-400 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600 disabled:opacity-40"}`}>👎</button>
              </div>
            )}
          </div>
        ))}
        {showQuickReplies && !loading && (
          <div className="flex flex-wrap gap-2 mt-2 mb-1">
            {QUICK_REPLIES.map((q) => (
              <button key={q} onClick={() => sendText(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">{q}</button>
            ))}
          </div>
        )}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">N</div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {contactBanner && !liveAgentBanner && (
        <div className="mx-3 mb-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 flex gap-2 items-start">
          <span className="text-blue-500 mt-0.5">●</span>
          <div><p className="font-semibold">Details received!</p><p className="mt-0.5 text-blue-700">Our team will be in touch with you shortly.</p></div>
        </div>
      )}
      {liveAgentBanner && (
        <div className="mx-3 mb-2 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800 flex gap-2 items-start">
          <span className="text-green-500 mt-0.5">●</span>
          <div><p className="font-semibold">Our team has been notified!</p><p className="mt-0.5 text-green-700">We&apos;ll reach out shortly. You can also <a href="/contact" className="underline font-medium">visit our contact page</a>.</p></div>
        </div>
      )}
      <div className="border-t border-gray-200 p-3 flex gap-2 items-end">
        <textarea className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
          rows={1} placeholder="Type a message…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} disabled={loading} />
        <button onClick={send} disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl p-2.5 transition-colors flex-shrink-0" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
