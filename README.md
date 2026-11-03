# My Sydney v1.6 — Family Cloud

Premium Sydney travel dashboard with three entry points: **owner**, **family**, and **public demo**.

## Setup in order
1. In Supabase SQL Editor, run `supabase-setup.sql` once. It extends the existing `trip_items` schema to store one shared workspace snapshot. Keep the existing `trips`, `trip_members`, and RLS policies.
2. Verify both owner and shared family account exist in Supabase Authentication and their `trip_members` rows have `owner` and `member` roles. You already created these in the earlier setup.
3. Open `config.js`. The project URL and publishable browser key are filled in. **Replace only `familyEmail`** with the family account's real Supabase Auth email. Use a non-personal dedicated mailbox/alias because this value is visible to anyone inspecting public browser source.
4. Launch `index.html` with VS Code **Live Server**, not `file://`. Keep internet connectivity for Supabase and Leaflet.
5. Test owner email/password login, family password-only login, and demo independently. After login, edit a test item on one device, then refresh on another; remote changes are polled every 15 seconds or via **↻ 새로고침**.
6. To bring previous `localStorage` trip data into cloud, sign in **as owner** and click **⇪ 내 기존 데이터 가져오기**. This **replaces** the remote snapshot, so export cloud data first if you already saved any. It reads only the old `my-sydney-v1` localStorage key on the **same browser origin**. If old data were saved under `file://` rather than Live Server, export a backup from the original and migrate manually; do not clear old browser storage until verified.
7. Commit project updates using GitHub Desktop only after local testing.

## Security and limitations
- The **publishable** key and project URL are designed for browser clients, but RLS is the real access-control boundary. **Never** put database passwords, `secret`, or `service_role` keys in this folder.
- Family email is hidden from the page, **not from JavaScript source**. Use a dedicated mailbox if possible. Passwords are submitted to Supabase Auth and aren't stored in code.
- Demo records remain in browser localStorage, isolated from the cloud account.
- Owner vs member is represented by membership. In the *existing RLS*, **both can edit/delete trip data**. Owner-only membership administration is **not implemented**. The UI import button is owner-only but that's not a DB authorization boundary.
- Shared app data uses a single snapshot record: **last save wins** if two users edit simultaneously. Changes on other devices are checked roughly every 15 seconds; simultaneous writes can overwrite another person's edits. This is a first working sync MVP, not conflict-free real-time collaboration.
- Verify both allow and deny cases using separate login sessions before publishing real family data. Keep personal booking codes out of demo data and public repositories.
- Export JSON backup regularly. Sessions use Supabase Auth browser storage, so use trusted devices.

## Files
- `index.html`, `styles.css`, `app.js` — existing premium dashboard and features
- `config.js` — public project config and family login identifier
- `cloud.js` — Supabase Auth, shared workspace synchronization, import
- `supabase-setup.sql` — one-time DB migration and grants

## Technology
HTML, CSS, JavaScript, Leaflet, Supabase Auth, Postgres, RLS, GitHub Desktop.
