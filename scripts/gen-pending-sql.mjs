// Builds supabase/pending_update.sql: only what was added AFTER the earlier setup_all.sql run
// (deactivate/reactivate + Web Push). Safe to run more than once.
import fs from 'node:fs';
const part = n => fs.readFileSync(`supabase/${n}.sql`, 'utf8');
const out = [
  '-- PestCure: pending Supabase update (paste into the SQL editor and Run). Safe to re-run.',
  '-- Adds: shared admin workspace, status "inactive" for app_users, set_user_active() RPC, push_subscriptions table, push_audience() function.',
  '',
  '-- ---- 1. app_users.status may now be "inactive" (deactivated user) ------------------------------',
  'alter table public.app_users drop constraint if exists app_users_status_check;',
  "alter table public.app_users add constraint app_users_status_check check (status in ('pending','approved','rejected','inactive'));",
  '',
  '-- ---- 2. deactivate / reactivate -------------------------------------------------------------',
  part('lifecycle'),
  '',
  '-- ---- 3. Web Push: devices + who may be notified ----------------------------------------------',
  part('push'),
  '',
  '-- ---- 4. all admins share one workspace (Tushar and Ranjan sir see the same data) ---------------',
  part('shared_admin'),
].join('\n');
fs.writeFileSync('supabase/pending_update.sql', out);
console.log('wrote supabase/pending_update.sql', out.length, 'bytes');
