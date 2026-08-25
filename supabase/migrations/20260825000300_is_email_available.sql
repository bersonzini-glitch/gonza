-- Mirrors is_username_available() (see 20260822000800_functions_triggers.sql)
-- so the sign-up form can warn about a duplicate email up front, the same
-- way it already does for a taken username, instead of relying solely on
-- Supabase Auth's own signUp() error — which, with email confirmation
-- enabled, stays silent for an existing-but-unconfirmed account to avoid
-- email enumeration and only errors for already-confirmed ones.
-- Plain `text` + lower() rather than `citext` (unlike is_username_available)
-- so this doesn't depend on the `extensions` schema being on whatever
-- search_path the migration runner happens to use at CREATE FUNCTION time —
-- the citext type itself lives there, and that resolution isn't guaranteed
-- across every execution path (e.g. `supabase db push`'s legacy SQL runner).
create or replace function public.is_email_available(check_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.is_email_available(text) to anon, authenticated;
