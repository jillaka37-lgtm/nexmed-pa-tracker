# PA Tracker — a SaaS for a real pharmacy pain point

**Live demo:** https://nexmed-eta.vercel.app
**Source code:** https://github.com/jillaka37-lgtm/nexmed-pa-tracker
**Feature location on the site:** `/pa-tracker` (visible in the site header as "PA Tracker" once logged in as an admin)

## Grader / demo login

```
URL:      https://nexmed-eta.vercel.app/login
Email:    professor-demo@nexmed-pa-tracker.test
Password: GradePATracker2026!
```

Use the email/password fields (not the Google button — Google sign-in isn't configured for this project). After logging in, "Admin" and "PA Tracker" appear in the site header.

## The pain point

Independent pharmacies spend enormous staff time on **prior authorizations (PAs)** — the insurance-approval process required before certain medications can be dispensed. Today this is typically tracked with sticky notes, spreadsheets, or memory:

- Staff call doctors' offices and fax PA requests
- They check insurance requirements manually
- They have to follow up multiple times per case
- Patients aren't kept informed
- Cases get forgotten because there's no central tracking

## The solution: PA Tracker

A cloud-based tool (built inside the existing NexMed pharmacy website) that manages every prior-authorization case from creation to resolution.

### Core features
- **Create a case in under 30 seconds** — insurer, medication, diagnosis, an optional follow-up date, and who it's assigned to
- **Status tracking** — New → Sent → Waiting → Approved/Denied, one click to update
- **Task assignment** — assign a case to another staff member; they see it in their own list
- **Timeline** — every status change, assignment, note, AI action, and reminder is recorded with a timestamp, so nothing is "he said/she said"
- **Notes** — free-text notes attached to a case (e.g. "called insurer, on hold 20 min")
- **Overdue dashboard** — a dedicated view showing every unresolved case that's past its follow-up date
- **Automatic reminders** — a daily background job emails (and, once Twilio is configured, texts) staff about overdue cases

### AI features (5 actions, one click each on a case)
1. **Explain a rejection code** in plain English, with a suggested next step
2. **Suggest the next action** to take on a case, with reasoning
3. **Draft a fax/message to the prescriber** requesting what's needed to move the case forward
4. **Draft a patient update** — both a short SMS version and a longer email version
5. **Summarize the case history** in a paragraph, for a staff member picking up someone else's case

AI suggestions are shown for staff review and only saved to the timeline if a staff member explicitly clicks "Save to timeline" — nothing is auto-applied.

### How to try it as a grader
1. Log in with the credentials above
2. Click **PA Tracker** in the header
3. Create a case (try the pre-filled feel — it's genuinely fast)
4. Open the case, change its status, assign it, add a note
5. Try each of the 5 AI buttons on the case detail page
6. Visit **PA Tracker → Overdue dashboard** to see the overdue view (create a case with a past follow-up date and a "Waiting" status to populate it)

## Why this is a SaaS, not just a form

- **Multi-user with real data isolation**: each case is only visible to its creator and whoever it's assigned to, enforced both in application logic and at the database level (Postgres Row Level Security) — verified by an automated isolation test that runs in CI on every push
- **Rate limiting**: capped case creation per day, enforced atomically at the database level
- **Audit trail**: every login, case deletion, and AI call is logged for accountability
- **Background automation**: a scheduled job (Vercel Cron) runs daily without any user action, scanning for overdue cases and notifying staff
- **Production-hardening**: error monitoring (server errors alert via Telegram), a documented incident-recovery runbook (`RESTORE.md`), and no secrets committed to source control

## Tech stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres + Auth + Row Level Security), an LLM (via OpenRouter) for the 5 AI actions, Resend for email, Twilio for SMS (optional), deployed on Vercel with a scheduled Cron job.
