import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
