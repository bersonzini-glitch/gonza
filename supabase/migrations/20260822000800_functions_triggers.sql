-- Generic updated_at maintenance -------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger surgeon_profiles_set_updated_at
  before update on public.surgeon_profiles
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- New account provisioning ---------------------------------------------------------
-- Runs as SECURITY DEFINER because the triggering statement (auth.users insert)
-- is executed by Supabase Auth, not by a session with insert rights on
-- public.profiles. Falls back to a randomized username on a collision so
-- signup never fails because of the auto-generated default.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  desired_username citext;
  final_username citext;
  attempt int := 0;
begin
  desired_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  final_username := desired_username;

  loop
    begin
      insert into public.profiles (id, username, full_name)
      values (new.id, final_username, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      final_username := desired_username || '_' || substr(new.id::text, 1, 4) || attempt::text;
      if attempt > 5 then
        raise;
      end if;
    end;
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Authorization helpers -------------------------------------------------------------
-- SECURITY DEFINER so RLS policies on other tables can check role without
-- re-entering RLS on public.profiles (which would otherwise recurse).

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role = 'admin'
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid());
$$;

grant execute on function public.current_user_is_admin() to authenticated, anon;

-- Username-based sign-in ------------------------------------------------------------
-- Supabase Auth signs in by email/password. To let people (including the
-- initial admin) sign in with a username, the client resolves username ->
-- email through this narrow, rate-limited RPC before calling
-- signInWithPassword. It only ever returns an email or null - no other
-- profile data - and is deliberately the only way anon/authenticated roles
-- can read across the username -> email mapping.

create or replace function public.get_email_by_username(lookup_username citext)
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = lookup_username
  limit 1;
$$;

grant execute on function public.get_email_by_username(citext) to anon, authenticated;

create or replace function public.is_username_available(check_username citext)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select not exists (
    select 1 from public.profiles where username = check_username
  );
$$;

grant execute on function public.is_username_available(citext) to anon, authenticated;

-- Rate limiting -----------------------------------------------------------------------
-- Sliding-window check backed by rate_limit_attempts. Prunes stale rows for
-- the same identifier/action as it goes, so the table stays small without a
-- scheduled job. Returns true (and records the attempt) when the caller is
-- still within the limit, false when it should be rejected.

create or replace function public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  delete from public.rate_limit_attempts
  where identifier = p_identifier
    and action = p_action
    and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into recent_count
  from public.rate_limit_attempts
  where identifier = p_identifier
    and action = p_action
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_max_attempts then
    return false;
  end if;

  insert into public.rate_limit_attempts (identifier, action) values (p_identifier, p_action);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, text, int, int) to anon, authenticated;

-- Audit logging helper ------------------------------------------------------------------
-- Wraps the admin_audit_logs insert with an explicit admin check so a bug in
-- calling code can never silently record an action from a non-admin actor.

create or replace function public.log_admin_action(
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'log_admin_action: caller is not an admin';
  end if;

  insert into public.admin_audit_logs (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_metadata)
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;
