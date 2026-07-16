import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const { listDrafts } = await import("../lib/prior-auth/list");
  const { getDraft } = await import("../lib/prior-auth/store");

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const suffix = Date.now();
  const { data: userA } = await admin.auth.admin.createUser({
    email: `isolation-a-${suffix}@example.com`,
    password: "TestPass123!",
    email_confirm: true,
  });
  const { data: userB } = await admin.auth.admin.createUser({
    email: `isolation-b-${suffix}@example.com`,
    password: "TestPass123!",
    email_confirm: true,
  });
  await admin.from("profiles").update({ role: "admin" }).eq("id", userA.user!.id);
  await admin.from("profiles").update({ role: "admin" }).eq("id", userB.user!.id);

  const { data: draftA } = await admin
    .from("prior_auth_drafts")
    .insert({
      case_id: "ISO-A",
      insurer: "x",
      medication: "x",
      diagnosis: "x",
      prior_treatments: "x",
      letter_body: "x",
      medical_necessity_summary: "x",
      prior_treatment_summary: "x",
      created_by: userA.user!.id,
    })
    .select("id")
    .single();

  console.log("--- User B listing drafts (should NOT see User A's draft) ---");
  const bList = await listDrafts(userB.user!.id);
  console.log("User B sees", bList.length, "drafts (expected 0)");

  console.log("\n--- User A listing drafts (SHOULD see own draft) ---");
  const aList = await listDrafts(userA.user!.id);
  console.log("User A sees", aList.length, "drafts (expected 1)");

  console.log("\n--- User B fetching User A's draft directly by ID ---");
  const bFetch = await getDraft(draftA!.id, userB.user!.id);
  console.log("User B getDraft result:", bFetch ? "LEAKED (BUG!)" : "null (expected — blocked)");

  console.log("\n--- User A fetching own draft directly by ID ---");
  const aFetch = await getDraft(draftA!.id, userA.user!.id);
  console.log("User A getDraft result:", aFetch ? "found (expected)" : "null (BUG!)");

  const pass = bList.length === 0 && aList.length === 1 && !bFetch && !!aFetch;

  // cleanup
  await admin.from("prior_auth_drafts").delete().eq("id", draftA!.id);
  await admin.auth.admin.deleteUser(userA.user!.id);
  await admin.auth.admin.deleteUser(userB.user!.id);

  console.log(pass ? "\nPASS: per-creator isolation works at app layer." : "\nFAIL");
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
