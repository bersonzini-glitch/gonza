-- profiles: one row per auth.users account. Holds the app-level role and a
-- unique username that lets people (including the initial admin) sign in
-- with a username instead of their email (see get_email_by_username()).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null,
  full_name text,
  role public.profile_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username::text) between 3 and 32),
  constraint username_format check (username::text ~ '^[a-zA-Z0-9_.-]+$')
);

comment on table public.profiles is
  'One row per authenticated account. role drives authorization together with RLS policies and server-side checks; it is never trusted from client input.';

create unique index profiles_username_key on public.profiles (username);
create index profiles_role_idx on public.profiles (role);
