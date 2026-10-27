create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- first user to sign up becomes admin
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  subject text not null default 'Mathematics',
  created_at timestamptz not null default now()
);
grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "courses public read" on public.courses for select to anon, authenticated using (true);
create policy "admins manage courses" on public.courses for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create type public.resource_kind as enum ('pdf', 'tex', 'typst', 'link');
create type public.resource_status as enum ('pending', 'approved', 'rejected');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  author_name text not null,
  academic_year text,
  kind resource_kind not null,
  file_path text,
  url text,
  status resource_status not null default 'pending',
  uploader_id uuid not null,
  created_at timestamptz not null default now()
);
create index on public.resources (course_id, status);
grant select on public.resources to anon, authenticated;
grant insert, update, delete on public.resources to authenticated;
grant all on public.resources to service_role;
alter table public.resources enable row level security;
create policy "approved public read" on public.resources for select to anon, authenticated using (status = 'approved');
create policy "uploader reads own" on public.resources for select to authenticated using (uploader_id = auth.uid());
create policy "admins read all" on public.resources for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "users submit" on public.resources for insert to authenticated
  with check (uploader_id = auth.uid() and status = 'pending');
create policy "admins update" on public.resources for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins or owner delete" on public.resources for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or uploader_id = auth.uid());

-- storage policies for notes bucket
create policy "notes public read" on storage.objects for select to anon, authenticated using (bucket_id = 'notes');
create policy "notes upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "notes admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'notes' and (public.has_role(auth.uid(), 'admin') or (storage.foldername(name))[1] = auth.uid()::text));

insert into public.courses (code, name, subject) values
 ('MA101', 'Analysis I', 'Mathematics'),
 ('MA102', 'Algebra I', 'Mathematics'),
 ('MA103', 'Linear Algebra', 'Mathematics'),
 ('MA201', 'Analysis II', 'Mathematics'),
 ('MA202', 'Algebra II', 'Mathematics'),
 ('MA203', 'Topology', 'Mathematics'),
 ('MA204', 'Complex Analysis', 'Mathematics'),
 ('MA205', 'Probability Theory', 'Mathematics'),
 ('MA301', 'Differential Geometry', 'Mathematics'),
 ('MA302', 'Number Theory', 'Mathematics'),
 ('CS101', 'Programming in Python', 'Computer Science'),
 ('CS102', 'Discrete Mathematics', 'Computer Science'),
 ('CS201', 'Design and Analysis of Algorithms', 'Computer Science'),
 ('CS202', 'Theory of Computation', 'Computer Science'),
 ('CS301', 'Logic in Computer Science', 'Computer Science'),
 ('PH101', 'Classical Mechanics', 'Physics'),
 ('PH201', 'Quantum Mechanics I', 'Physics'),
 ('PH202', 'Electromagnetism', 'Physics');