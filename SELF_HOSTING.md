# Self-hosting H-Code

H-Code is a standard TanStack Start (React + Vite) app on top of Postgres (Supabase-compatible). Nothing is tied to the editor.

## What you need

- Node 20+ (or Bun)
- A Postgres database with the Supabase stack (self-hosted Supabase works, or the managed one)
- Any Node host: your own VPS, Docker, Cloudflare, Vercel, Fly, etc.

## Steps

1. Download / clone the project (Export or GitHub sync).
2. `npm install`
3. Create `.env`:

```
VITE_SUPABASE_URL=https://your-supabase-host
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_URL=https://your-supabase-host
SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Apply the SQL in `supabase/migrations/` in order (`supabase db push`, or paste into psql). This creates every table, the RLS policies and the seeded challenge bank.
5. `npm run build` then `npm start`.

## Python execution

Student code runs in the browser with Pyodide (WebAssembly). No Python is installed on your server and no student code is executed server-side.

## Email from your own mailbox

Auth emails are sent by the Supabase Auth service, so point it at your SMTP server (`GOTRUE_SMTP_HOST`, `GOTRUE_SMTP_PORT`, `GOTRUE_SMTP_USER`, `GOTRUE_SMTP_PASS`, `GOTRUE_SMTP_SENDER_NAME`) in your Supabase config. The same values are editable in-app under **Admin → Email (SMTP)**, stored in `app_settings`, so you can change the sending address without redeploying. Keep the password as a server-side secret only.

## Admin account

Sign up normally, then promote yourself:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@yourschool.org';
```

After that, the Admin tab lets you set anyone else's role.

## Adding challenges

Insert into `public.challenges` (`slug`, `title`, `brief`, `track`, `topic`, `difficulty`, `xp`, `starter_code`, `hints`, `tests`). `tests` is JSON: `[{"stdin": "...", "expected": "..."}]`. Practice picks randomly from everything matching a student's track, topic and level, so the more you add, the more varied the practice.

## Subscriptions later

Billing is not wired up. The clean hooks for it are `app_settings` (feature flags) and a future `subscriptions` table keyed by `profiles.id`; gate features in `src/lib/game.ts` and the route guards.

## Visitor locations

Admin → **Visitor locations** shows roughly where the site is opened from (city, region, country), counting each person once a day. The server looks the visitor's IP up in a location database file on its own disk ([DB-IP IP to City Lite](https://db-ip.com/db/download/ip-to-city-lite), CC BY 4.0), so IPs are never sent to a third-party service, and only the place and a count are saved (`visitor_locations` table) — no IPs, names, accounts or pages.

- The database file (~60 MB download, ~130 MB in memory) is fetched into the temp directory on first use and refreshed every 30 days. The server needs outbound access to `download.db-ip.com`.
- `GEOIP_DB_PATH=/path/to/file.mmdb` uses a file you supply instead (DB-IP or MaxMind GeoLite2-City format).
- `VISITOR_LOCATIONS=off` turns it off completely.

## Daily email allowance

Resend's free plan sends 100 emails a day, then refuses everything until the next day (midnight UTC), including sign-up confirmations and password resets, which can't be retried. So bulk email (homework, homework messages, weekly reports) stops once 70 have gone out in a day, leaving the rest for account emails. Anything held back is sent on a later run: homework emails within two days of being set, and weekly reports on the following day (students on Monday, teachers on Tuesday). A "1 day left" reminder that can't go before the deadline is skipped.

- `RESEND_BULK_DAILY_LIMIT` changes the 70. On a paid Resend plan there is no daily cap, so nothing is held back.
