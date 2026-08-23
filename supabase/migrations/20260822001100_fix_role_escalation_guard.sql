-- prevent_role_self_escalation() ran for every role change, including
-- ones made by the service-role client (e.g. scripts/create-initial-admin.ts
-- and scripts/seed.ts). RLS policies are bypassed for the service role,
-- but BEFORE UPDATE triggers are not — and auth.uid() is null on a
-- service-role connection (there's no end-user JWT), so
-- current_user_is_admin() returned false and the trigger blocked the very
-- script meant to provision the first admin.
--
-- Fix: only enforce the guard when there IS an authenticated end user
-- (auth.uid() is not null). A null auth.uid() only ever happens for the
-- service role here — anon has no update policy on profiles at all, so it
-- can never reach this trigger.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role
    and auth.uid() is not null
    and not public.current_user_is_admin()
  then
    raise exception 'Only an administrator can change a profile role';
  end if;
  return new;
end;
$$;

-- Same class of bug, same fix: scripts/seed.ts upserts demo surgeon
-- profiles directly as 'approved' with is_demo/approved_at set, using the
-- service-role client. Treat a null auth.uid() (service role) the same
-- as an admin here too.
create or replace function public.guard_surgeon_profile_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_is_admin() or auth.uid() is null then
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
