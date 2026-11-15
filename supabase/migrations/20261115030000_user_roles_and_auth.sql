-- ============================================================================
-- User roles and authentication (admin and examinee)
-- ----------------------------------------------------------------------------
-- Allows admin and examinees to sign in with username and password.
-- Default admin credentials: username: admin / pass: admin
-- ============================================================================

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  examinee_id uuid references public.examinees(id) on delete cascade,
  username text not null unique check (length(btrim(username)) > 0),
  password text not null check (length(btrim(password)) > 0),
  role text not null check (role in ('admin', 'examinee')),
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);

comment on table public.app_users is 'Application accounts for admin examiners and examinees.';
comment on column public.app_users.role is 'Role: admin (can edit tables) or examinee (read-only results).';

create index if not exists app_users_username_idx on public.app_users (lower(username));
create index if not exists app_users_examinee_id_idx on public.app_users (examinee_id);

alter table public.app_users enable row level security;

create policy "Authenticated users can manage app_users"
  on public.app_users
  for all
  to authenticated
  using (true)
  with check (true);

revoke all on table public.app_users from anon;
grant select, insert, update, delete on table public.app_users to authenticated;

-- Default admin account (username: admin / password: admin)
insert into public.app_users (username, password, role, name)
values ('admin', 'admin', 'admin', 'مدير النظام')
on conflict (username) do nothing;
