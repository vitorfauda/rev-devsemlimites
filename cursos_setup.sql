-- ============================================================================
-- CURSOS — Setup completo (rodar no SQL editor do Supabase principal)
-- Projeto: qtbkvshbmqlszncxlcuc
-- ============================================================================

-- 1) Função utilitária pra checar se usuário é admin
-- Admin = email v17tormr@gmail.com OU user_metadata.role = 'admin'
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() ->> 'email') = 'v17tormr@gmail.com'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- 2) Função pra checar se reseller atual está ativo (entry_paid + status active)
create or replace function public.is_active_reseller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resellers
    where user_id = auth.uid()
      and entry_paid = true
      and status = 'active'
  );
$$;

grant execute on function public.is_active_reseller() to authenticated;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Cursos
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  thumbnail_url text,
  sort_order   int not null default 0,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_courses_published on public.courses (published, sort_order);

-- Módulos
create table if not exists public.course_modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_course_modules_course on public.course_modules (course_id, sort_order);

-- Aulas
create table if not exists public.course_lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.course_modules(id) on delete cascade,
  title            text not null,
  description      text,
  video_path       text,                -- path no bucket course-videos (ex: cursos/abc/aula1.mp4)
  duration_seconds int default 0,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_course_lessons_module on public.course_lessons (module_id, sort_order);

-- Progresso por reseller
create table if not exists public.course_progress (
  reseller_id           uuid not null references public.resellers(id) on delete cascade,
  lesson_id             uuid not null references public.course_lessons(id) on delete cascade,
  completed_at          timestamptz,
  last_position_seconds int not null default 0,
  updated_at            timestamptz not null default now(),
  primary key (reseller_id, lesson_id)
);

create index if not exists idx_course_progress_reseller on public.course_progress (reseller_id);

-- Trigger pra updated_at
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at before update on public.courses
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_course_lessons_updated_at on public.course_lessons;
create trigger trg_course_lessons_updated_at before update on public.course_lessons
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_course_progress_updated_at on public.course_progress;
create trigger trg_course_progress_updated_at before update on public.course_progress
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.courses          enable row level security;
alter table public.course_modules   enable row level security;
alter table public.course_lessons   enable row level security;
alter table public.course_progress  enable row level security;

-- COURSES
drop policy if exists courses_select_active        on public.courses;
drop policy if exists courses_admin_all            on public.courses;

create policy courses_select_active on public.courses
  for select to authenticated
  using (
    public.is_admin()
    or (published = true and public.is_active_reseller())
  );

create policy courses_admin_all on public.courses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- COURSE_MODULES
drop policy if exists course_modules_select_active on public.course_modules;
drop policy if exists course_modules_admin_all     on public.course_modules;

create policy course_modules_select_active on public.course_modules
  for select to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_reseller()
      and exists (
        select 1 from public.courses c
        where c.id = course_modules.course_id and c.published = true
      )
    )
  );

create policy course_modules_admin_all on public.course_modules
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- COURSE_LESSONS
drop policy if exists course_lessons_select_active on public.course_lessons;
drop policy if exists course_lessons_admin_all     on public.course_lessons;

create policy course_lessons_select_active on public.course_lessons
  for select to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_reseller()
      and exists (
        select 1
        from public.course_modules m
        join public.courses c on c.id = m.course_id
        where m.id = course_lessons.module_id and c.published = true
      )
    )
  );

create policy course_lessons_admin_all on public.course_lessons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- COURSE_PROGRESS — reseller só vê/edita o próprio
drop policy if exists course_progress_owner_select on public.course_progress;
drop policy if exists course_progress_owner_write  on public.course_progress;
drop policy if exists course_progress_admin_all    on public.course_progress;

create policy course_progress_owner_select on public.course_progress
  for select to authenticated
  using (
    public.is_admin()
    or reseller_id = (select id from public.resellers where user_id = auth.uid() limit 1)
  );

create policy course_progress_owner_write on public.course_progress
  for all to authenticated
  using (reseller_id = (select id from public.resellers where user_id = auth.uid() limit 1))
  with check (reseller_id = (select id from public.resellers where user_id = auth.uid() limit 1));

create policy course_progress_admin_all on public.course_progress
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Bucket privado pra vídeos (signed URLs)
insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', false)
on conflict (id) do nothing;

-- Bucket público pra thumbnails
insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do nothing;

-- Policies de storage
-- Vídeos: só admin faz upload/edita; reseller ativo pode ler (signed URL emitida pelo client)
drop policy if exists "course-videos admin write" on storage.objects;
drop policy if exists "course-videos read active"  on storage.objects;

create policy "course-videos admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'course-videos' and public.is_admin())
  with check (bucket_id = 'course-videos' and public.is_admin());

create policy "course-videos read active" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'course-videos'
    and (public.is_admin() or public.is_active_reseller())
  );

-- Thumbnails: leitura pública (bucket é público), só admin escreve
drop policy if exists "course-thumbnails admin write" on storage.objects;
create policy "course-thumbnails admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'course-thumbnails' and public.is_admin())
  with check (bucket_id = 'course-thumbnails' and public.is_admin());
