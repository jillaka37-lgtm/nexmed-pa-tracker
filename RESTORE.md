# Restore runbook — for the 2am incident

Written after living through this exact failure once already: the `nexmed-chatbot`
Supabase project paused itself (free-tier inactivity pause), and every
Supabase-backed feature — chatbot, admin dashboard, AuthDraft — started failing
with `TypeError: fetch failed` / `ENOTFOUND`.

## 1. Confirm it's actually a paused/down project (not your code)

Symptom: any Supabase call fails with one of:
- `TypeError: fetch failed` (DNS doesn't resolve — project fully paused)
- `Error 521: Web server is down` (project is restoring, DNS resolves but origin isn't up yet)
- `relation "..." does not exist` (misleading — can appear transiently while
  PostgREST's schema cache is still warming up right after a restore)
- The PA Tracker reminder cron (`vercel.json`, daily) silently produces
  `{"scanned":0,"notified":0}` or errors out — check the project isn't paused
  before assuming the scan logic itself is broken

Check status: [supabase.com/dashboard](https://supabase.com/dashboard) →
select the project → look for "Paused" or "Restoring" banner at the top.

## 2. Restore it

In the dashboard: click **Restore project** (or **Resume**) on the paused
project banner.

**What to expect** (from experience, not the docs — actual restore took
~10 minutes, not the "1-2 minutes" you might assume):
1. Status goes to `COMING_UP`
2. For the first few minutes, requests fail with DNS `ENOTFOUND` (nothing resolves yet)
3. Then DNS resolves but requests return Cloudflare `521 Web server is down` —
   the origin is still booting
4. Occasionally during this window, `PostgREST` schema cache lag shows a
   `relation "public.<table>" does not exist` error even though the table
   is really there — this clears itself within a minute, don't panic and
   don't try to re-run migrations because of it
5. Eventually settles to `ACTIVE_HEALTHY` and everything works again

**Don't retry-loop aggressively while waiting** — space checks out by 15-30
seconds, the project is doing real work coming back up regardless of how
often you poll it.

## 3. Verify before declaring it fixed

Don't just check the dashboard says "Active" — actually hit the app:

```bash
# Chat
curl -s -X POST https://nexmed-eta.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"channel":"web","message":"test"}'
# Expect a real JSON response with "text", not a 500

# PA Tracker (needs a logged-in admin session — check via the dashboard UI directly)

# PA Tracker reminder cron (needs CRON_SECRET from Vercel env vars)
curl -s -X GET https://nexmed-eta.vercel.app/api/pa-tracker/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
# Expect {"scanned": <n>, "notified": <n>}, not a 401/500
```

If it still fails after the dashboard shows "Active," wait another minute —
PostgREST's schema cache can lag behind the DB actually being ready.

## 4. If data itself is lost (not just paused — an actual data-loss incident)

This project is on Supabase's free/pro tier with **point-in-time recovery
availability depending on plan** — check current plan before assuming PITR
is available. If it is:

1. Dashboard → Project → Database → Backups
2. Pick a restore point before the incident
3. **Restoring creates data loss for anything written after that point** —
   there is no partial/selective restore on the dashboard UI. If you need to
   recover specific rows without rolling back everything else, export the
   backup to a new/branch project first and manually copy the rows you need,
   rather than restoring in place.

## 5. Which projects exist, and what's in each

NexMed currently spans **two** Supabase projects — worth knowing before you
start restoring the wrong one:
- `nexmed` (`hhrasvarsefgiiubvjrw`) — main site (bookings, shop, admin)
- `nexmed-chatbot` (`kxdhmzzswssqxfexfpot`) — **this is the one
  `NEXT_PUBLIC_SUPABASE_URL` actually points to in production** — chatbot,
  voice, PA Tracker, and everything else all live here despite the name.
  Both projects currently show `INACTIVE`/pausable on the free tier — check
  both if something's down and you're not sure which one broke.

## 6. Prevention

Free-tier Supabase projects pause after a period of inactivity. If this
becomes disruptive, either upgrade off the free tier, or set up a low-frequency
scheduled ping (e.g. a cron hitting a lightweight read endpoint) to keep the
project active — not implemented yet, worth doing if this recurs.
