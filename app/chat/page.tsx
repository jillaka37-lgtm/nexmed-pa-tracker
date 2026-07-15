import type { Metadata } from "next";
import { ChatWindow } from "@/components/chatbot/ChatWindow";

export const metadata: Metadata = {
  title: "AI Assistant | NexMed",
  description: "Chat with the NexMed AI assistant for health guidance, booking, and more.",
};

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          N
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">NexMed AI Assistant</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Online
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <ChatWindow channel="web" className="flex-1" />
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400 py-3 px-4">
        This AI assistant provides general information only — not medical advice. For emergencies, call 911.
      </p>
    </div>
  );
}
