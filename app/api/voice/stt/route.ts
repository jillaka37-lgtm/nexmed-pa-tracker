import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.formData();
  const audio = body.get("audio") as File | null;
  if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

  const form = new FormData();
  form.append("audio", audio, "recording.wav");
  form.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("ElevenLabs STT error:", res.status, err);
    return NextResponse.json({ error: "STT failed", detail: err }, { status: 500 });
  }

  const data = await res.json() as { text?: string };
  return NextResponse.json({ text: data.text ?? "" });
}
