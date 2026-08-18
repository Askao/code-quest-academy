# Self-hosting PyForge

PyForge is a standard TanStack Start (React + Vite) app on top of Postgres (Supabase-compatible). Nothing is tied to the editor.

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
