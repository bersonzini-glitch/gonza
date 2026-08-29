-- Email notification preferences, set at sign-up and editable later from
-- the surgeon profile form. Doubles as an audience filter for the admin
-- bulk-emailing feature (see listApprovedSurgeonEmailsForAdmin()).
alter table public.profiles
  add column notify_new_events boolean not null default true,
  add column notify_suggested_invitations boolean not null default true;

-- Re-created to read the two preferences from the sign-up form's metadata
-- (see signUpAction), defaulting to true when absent so any other caller of
-- auth.signUp() (e.g. a future OAuth flow) still opts new accounts in.
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
      insert into public.profiles (
        id, username, full_name, notify_new_events, notify_suggested_invitations
      )
      values (
        new.id,
        final_username,
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        coalesce((new.raw_user_meta_data ->> 'notify_new_events')::boolean, true),
        coalesce((new.raw_user_meta_data ->> 'notify_suggested_invitations')::boolean, true)
      );
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
