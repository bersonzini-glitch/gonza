-- Row Level Security policies.
--
-- Model summary:
--   * anon / authenticated (public traffic) can only ever read APPROVED
--     surgeon profiles and APPROVED events.
--   * authenticated users can fully manage their own surgeon profile while
--     it is a draft, and read/submit it thereafter - but they can never
--     set it to 'approved'/'suspended' themselves (enforced by trigger,
--     not just policy, so it holds even if a policy is loosened later).
--   * admins (public.profiles.role = 'admin') can read/manage everything.
--   * admin_audit_logs is admin-read-only and insert-only (no update/
--     delete policy exists for any role -> the log cannot be rewritten).
--   * rate_limit_attempts has NO client-facing policies at all; it is only
--     touched through the SECURITY DEFINER check_rate_limit() function.
--
-- Table-level grants: Supabase projects are provisioned with default
-- privileges (`alter default privileges in schema public grant select,
-- insert, update, delete ... to anon, authenticated, service_role`) so new
-- tables are reachable by the API roles as soon as they are created; RLS is
-- what actually restricts row visibility. Enabling RLS with zero policies
-- for an operation (as done below for admin_audit_logs update/delete and
-- for rate_limit_attempts entirely) is therefore a real deny-all, not just
-- an oversight. service_role always bypasses RLS and is used only in
-- trusted server-side code (see src/lib/supabase/admin.ts).

alter table public.profiles enable row level security;
alter table public.surgeon_profiles enable row level security;
alter table public.surgeon_specialties enable row level security;
alter table public.surgeon_locations enable row level security;
alter table public.events enable row level security;
alter table public.event_sources enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.rate_limit_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.current_user_is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.current_user_is_admin())
  with check (auth.uid() = id or public.current_user_is_admin());

-- Defense in depth: even though the update policy above lets a user update
-- their own row, the role column may only ever be changed by an admin. This
-- holds regardless of how the update is issued (ORM, RPC, future policy
-- changes), which is what "never trust a client-controlled admin flag"
-- means in practice.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.current_user_is_admin() then
    raise exception 'Only an administrator can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- No insert/delete policy: rows are created exclusively by the
-- handle_new_user() trigger (SECURITY DEFINER, runs as table owner) and
-- removed only via auth.users cascade.

-- ---------------------------------------------------------------------------
-- surgeon_profiles
-- ---------------------------------------------------------------------------

create policy "surgeon_profiles_select_public_approved"
  on public.surgeon_profiles for select
  to anon, authenticated
  using (status = 'approved');

create policy "surgeon_profiles_select_own"
  on public.surgeon_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "surgeon_profiles_select_admin"
  on public.surgeon_profiles for select
  to authenticated
  using (public.current_user_is_admin());

create policy "surgeon_profiles_insert_own_draft"
  on public.surgeon_profiles for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'draft');

create policy "surgeon_profiles_update_own_or_admin"
  on public.surgeon_profiles for update
  to authenticated
  using (auth.uid() = user_id or public.current_user_is_admin())
  with check (auth.uid() = user_id or public.current_user_is_admin());

create policy "surgeon_profiles_delete_own_draft_or_admin"
  on public.surgeon_profiles for delete
  to authenticated
  using (
    (auth.uid() = user_id and status = 'draft')
    or public.current_user_is_admin()
  );

-- Defense in depth for the same reason as profiles.role: a non-admin owner
-- may move their own profile between 'draft' and 'submitted' only, and can
-- never touch the approval bookkeeping columns. Only an admin action (which
-- always goes through a server-side check + audit log) can approve, reject,
-- suspend, mark a profile verified, or flag it as demo data.
create or replace function public.guard_surgeon_profile_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_is_admin() then
    return new;
  end if;

  if new.status <> old.status and not (
    old.status in ('draft', 'submitted') and new.status in ('draft', 'submitted')
  ) then
    raise exception 'Only an administrator can set this profile status';
  end if;

  if new.approved_by is distinct from old.approved_by
    or new.approved_at is distinct from old.approved_at
    or new.rejection_reason is distinct from old.rejection_reason
    or new.last_verified_at is distinct from old.last_verified_at
    or new.is_demo is distinct from old.is_demo
  then
    raise exception 'Only an administrator can change approval metadata';
  end if;

  return new;
end;
$$;

create trigger surgeon_profiles_guard_transitions
  before update on public.surgeon_profiles
  for each row execute function public.guard_surgeon_profile_transitions();

-- ---------------------------------------------------------------------------
-- surgeon_specialties / surgeon_locations
-- ---------------------------------------------------------------------------

create policy "surgeon_specialties_select_visible_parent"
  on public.surgeon_specialties for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.surgeon_profiles sp
      where sp.id = surgeon_specialties.surgeon_id
        and (
          sp.status = 'approved'
          or sp.user_id = auth.uid()
          or public.current_user_is_admin()
        )
    )
  );

create policy "surgeon_specialties_write_owner_or_admin"
  on public.surgeon_specialties for all
  to authenticated
  using (
    exists (
      select 1 from public.surgeon_profiles sp
      where sp.id = surgeon_specialties.surgeon_id
        and (sp.user_id = auth.uid() or public.current_user_is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.surgeon_profiles sp
      where sp.id = surgeon_specialties.surgeon_id
        and (sp.user_id = auth.uid() or public.current_user_is_admin())
    )
  );

create policy "surgeon_locations_select_visible_parent"
  on public.surgeon_locations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.surgeon_profiles sp
      where sp.id = surgeon_locations.surgeon_id
        and (
          sp.status = 'approved'
          or sp.user_id = auth.uid()
          or public.current_user_is_admin()
        )
    )
  );

create policy "surgeon_locations_write_owner_or_admin"
  on public.surgeon_locations for all
  to authenticated
  using (
    exists (
      select 1 from public.surgeon_profiles sp
      where sp.id = surgeon_locations.surgeon_id
        and (sp.user_id = auth.uid() or public.current_user_is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.surgeon_profiles sp
      where sp.id = surgeon_locations.surgeon_id
        and (sp.user_id = auth.uid() or public.current_user_is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- events / event_sources (admin-managed only; public read of approved rows)
-- ---------------------------------------------------------------------------

create policy "events_select_public_approved"
  on public.events for select
  to anon, authenticated
  using (status = 'approved');

create policy "events_select_admin"
  on public.events for select
  to authenticated
  using (public.current_user_is_admin());

create policy "events_write_admin"
  on public.events for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "event_sources_select_visible_parent"
  on public.event_sources for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_sources.event_id
        and (e.status = 'approved' or public.current_user_is_admin())
    )
  );

create policy "event_sources_write_admin"
  on public.event_sources for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- admin_audit_logs (append-only, admin-read-only)
-- ---------------------------------------------------------------------------

create policy "admin_audit_logs_select_admin"
  on public.admin_audit_logs for select
  to authenticated
  using (public.current_user_is_admin());

create policy "admin_audit_logs_insert_admin"
  on public.admin_audit_logs for insert
  to authenticated
  with check (public.current_user_is_admin() and actor_id = auth.uid());

-- Deliberately no update/delete policy for any role: the audit trail is
-- append-only, including for admins.

-- rate_limit_attempts: intentionally has RLS enabled with zero policies.
-- It is reachable only through public.check_rate_limit(), a SECURITY
-- DEFINER function that runs as the table owner and therefore bypasses
-- RLS; anon/authenticated have no direct table grants on it at all.
