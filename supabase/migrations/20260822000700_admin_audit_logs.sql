-- admin_audit_logs: append-only trail of every sensitive administrative
-- action (approve/reject/suspend/delete a surgeon profile, create/update/
-- delete an event or source, provisioning the initial admin, role
-- changes). Rows are written exclusively by server-side code after an
-- admin check; RLS additionally forbids any client-side insert/update/
-- delete outside that path (see 20260822001100_rls_policies.sql).
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is
  'Append-only audit trail for admin actions. No update/delete policy exists for any role, including admins, so history cannot be rewritten.';

create index admin_audit_logs_actor_idx on public.admin_audit_logs (actor_id);
create index admin_audit_logs_target_idx on public.admin_audit_logs (target_table, target_id);
create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

-- rate_limit_attempts: lightweight, DB-backed abuse protection for public
-- write endpoints (sign-up, surgeon profile submission, contact-style
-- actions) that works on stateless serverless deployments without a
-- third-party rate-limiting service.
create table public.rate_limit_attempts (
  id bigint generated always as identity primary key,
  identifier text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_attempts_lookup_idx
  on public.rate_limit_attempts (identifier, action, created_at desc);

comment on table public.rate_limit_attempts is
  'Sliding-window abuse protection: server actions count recent rows for (identifier, action) before allowing another attempt, then prune old rows.';
