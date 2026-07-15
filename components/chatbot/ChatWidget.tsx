"use client";

import { useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { VoiceMode } from "./VoiceMode";

export function ChatWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const openChat = () => { setVoiceOpen(false); setChatOpen(true); };
  const openVoice = () => { setChatOpen(false); setVoiceOpen(true); };
  const closeAll = () => { setChatOpen(false); setVoiceOpen(false); };

  return (
    <>
      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 z-[9998] w-80 h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">N</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">NexMed Assistant</p>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Online
              </p>
            </div>
            <button
              onClick={closeAll}
              className="text-white/70 hover:text-white text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <ChatWindow channel="widget" className="flex-1 min-h-0" />
        </div>
      )}

      {/* Voice mode */}
      {voiceOpen && <VoiceMode onClose={closeAll} channel="widget" />}

      {/* Floating buttons */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
        {/* Phone / voice button */}
        <button
          onClick={voiceOpen ? closeAll : openVoice}
          title="Voice call"
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 border-2 ${
            voiceOpen ? "bg-red-500 hover:bg-red-600 border-red-500" : "bg-white hover:bg-blue-50 border-blue-600"
          }`}
          aria-label="Voice call"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={voiceOpen ? "white" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.28 6.28l1.17-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>

        {/* Chat button */}
        <button
          onClick={chatOpen ? closeAll : openChat}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center gap-2 px-5 py-3 transition-all hover:scale-105"
          aria-label={chatOpen ? "Close chat" : "Open chat"}
        >
          {chatOpen ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="text-sm font-semibold">Close</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" />
              </svg>
              <span className="text-sm font-semibold">Chat with us</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
