import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChatWindow } from "@/components/chatbot/ChatWindow";

export const metadata: Metadata = {
  title: "NexMed Chat",
  robots: { index: false },
};

// Allow embedding from any origin (required for the widget iframe)
export async function generateStaticParams() {
  return [];
}

export default async function EmbedPage() {
  // Suppress headers usage lint — needed for dynamic rendering
  await headers();

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
          <ChatWindow channel="widget" className="h-full" />
        </div>
        <p style={{ textAlign: "center", fontSize: "10px", color: "#9ca3af", padding: "4px 8px", margin: 0 }}>
          NexMed AI · Not medical advice
        </p>
      </body>
    </html>
  );
}
