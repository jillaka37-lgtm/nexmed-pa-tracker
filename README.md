# NexMed

Pharmacy and health website for NexMed. Visitors browse health products, request
prescription refills, sign up, book a 1:1 consultation, and **pay before the slot
is reserved**. Built to grow into more services and online webinars.

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Database / Auth:** Supabase (Postgres + Auth + Row Level Security)
- **Payments:** Stripe Checkout (pay-first booking)
- **Email:** Resend (transactional)
- **Deploy:** Vercel

## How the booking flow works

1. `/book` — pick a service, date, and an open time slot (slots are computed from the
   admin's weekly availability minus already-booked and past times).
2. Sign in is required at the pay step (Google or email/password).
3. A `pending_payment` booking is created to **hold the slot**, then the visitor is sent
   to Stripe Checkout.
4. On payment, the Stripe webhook (and the success page as a fallback) flips the booking
   to `confirmed` and emails a confirmation.
5. If the visitor cancels or the hold expires, the slot is released.
6. The admin adds a meeting link in `/admin`, which emails it to the client.

## Local setup

Requires Node 20+.

```bash
npm install
cp .env.local.example .env.local   # then fill in real values (see below)
npm run dev                        # http://localhost:3000
```

The site renders in logged-out preview mode until Supabase keys are added, so you can
work on the marketing pages before wiring services.

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the URL, the `anon` key, and the `service_role`
   key into `.env.local`.
3. Apply the migrations in `supabase/migrations/` (in order) via the Supabase SQL editor
   or the CLI:
   ```bash
   supabase db push        # or paste each .sql file into the SQL editor
   ```
4. **Make yourself admin:** edit `supabase/migrations/0003_seed.sql` and replace
   `you@example.com` with your login email before running it (or just `insert` your email
   into `public.admin_emails`). Your account is promoted to admin on first sign-in.
5. **Enable Google OAuth** (optional): Supabase **Authentication → Providers → Google**,
   add the client ID/secret, and set the redirect URL to
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.

### 2. Stripe

1. Copy your test **secret** and **publishable** keys into `.env.local`.
2. Forward webhooks locally and copy the signing secret into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Test card: `4242 4242 4242 4242`, any future expiry / CVC / ZIP.

### 3. Resend

Add `RESEND_API_KEY` and a verified `EMAIL_FROM`. Without a key, emails are skipped
(logged to the console) and everything else still works.

## Environment variables

See [`.env.local.example`](.env.local.example) for the full annotated list:
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BUSINESS_TIMEZONE`, the Supabase URL/anon/service-role
keys, Stripe secret/publishable/webhook keys, `RESEND_API_KEY`, `EMAIL_FROM`, and
`ADMIN_EMAIL`.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — hero, services, how-it-works, testimonials |
| `/about`, `/services`, `/contact` | Marketing pages |
| `/book` | Service → date → slot → auth → Stripe |
| `/booking/success`, `/booking/cancelled` | Stripe return pages |
| `/login`, `/signup` | Auth (Google + email/password) |
| `/dashboard` | Client: my bookings, status, meeting links |
| `/admin` | Admin-only: availability, bookings, meeting links, services |
| `/api/stripe/webhook` | Stripe payment confirmation |

`/dashboard` and `/admin` are protected by `proxy.ts`; `/admin` additionally requires the
`admin` role.

## Deploy to Vercel

1. Push the repo to GitHub and import it into [Vercel](https://vercel.com).
2. Add every variable from `.env.local.example` in **Project Settings → Environment
   Variables**, using your production values and `NEXT_PUBLIC_SITE_URL=https://your-domain`.
3. In the Stripe dashboard, add a webhook endpoint at
   `https://your-domain/api/stripe/webhook` for `checkout.session.completed` and
   `checkout.session.expired`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Add your production domain to Supabase **Auth → URL Configuration** (redirect URLs).
5. Deploy.

## Things to personalize later

- Real About bio + headshot (`public/about.jpg`).
- Real testimonials (`public.testimonials` / `lib/content.ts`).
- Final consultation price (edit in `/admin` or `supabase/migrations/0003_seed.sql`).
- Real social links and the actual logo asset (`components/logo.tsx`).
