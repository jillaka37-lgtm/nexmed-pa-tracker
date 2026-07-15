import { NextResponse } from "next/server";

const AGENT_ID = "agent_9501kwqvns24eyht179r35f290de";

export async function GET() {
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
      }
    );
    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: body }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ signed_url: data.signed_url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
