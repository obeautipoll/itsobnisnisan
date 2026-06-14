-- Supabase schema used directly by the Vite app.
-- Run this in the Supabase SQL editor.
-- Create an admin user in Supabase Auth, then sign in at /adminonlyme.
-- Content is stored in normalized tables only. No json/jsonb content table is used.

create extension if not exists pgcrypto;

create table if not exists public.cms_profile (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  short_name text not null default '',
  hero_tag text not null default '',
  tagline text not null default '',
  email text not null default '',
  phone text not null default '',
  resume text not null default '',
  avatar text not null default '',
  github_url text not null default '',
  facebook_url text not null default '',
  linkedin_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_education_schools (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  name text not null default '',
  period text not null default '',
  program text not null default '',
  note text not null default '',
  highlight boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_education_coursework (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_education_memberships (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_skills_languages (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  name text not null default '',
  icon text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_skills_tools (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  name text not null default '',
  icon text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_experience_roles (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null default '',
  period text not null default '',
  bullets text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_projects_meta (
  id smallint primary key default 1 check (id = 1),
  description text not null default '',
  badge text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_projects_featured (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null default '',
  period text not null default '',
  badge text not null default '',
  description text not null default '',
  image text not null default '',
  link text not null default '',
  icons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_projects_cards (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null default '',
  tag text not null default '',
  description text not null default '',
  image text not null default '',
  icons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_certificates_meta (
  id smallint primary key default 1 check (id = 1),
  description text not null default '',
  badge text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_certificates_items (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  tag text not null default '',
  title text not null default '',
  description text not null default '',
  pdf text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_leadership_roles (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null default '',
  role text not null default '',
  period text not null default '',
  bullets text[] not null default '{}',
  accent text not null default 'gold' check (accent in ('gold', 'navy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_contact (
  id smallint primary key default 1 check (id = 1),
  headline text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'portfolio',
  path text not null unique,
  public_url text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  asset_type text not null default 'file'
    check (asset_type in ('image', 'pdf', 'file')),
  related_section text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cms_profile_updated_at on public.cms_profile;
create trigger set_cms_profile_updated_at before update on public.cms_profile
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_education_schools_updated_at on public.cms_education_schools;
create trigger set_cms_education_schools_updated_at before update on public.cms_education_schools
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_education_coursework_updated_at on public.cms_education_coursework;
create trigger set_cms_education_coursework_updated_at before update on public.cms_education_coursework
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_education_memberships_updated_at on public.cms_education_memberships;
create trigger set_cms_education_memberships_updated_at before update on public.cms_education_memberships
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_skills_languages_updated_at on public.cms_skills_languages;
create trigger set_cms_skills_languages_updated_at before update on public.cms_skills_languages
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_skills_tools_updated_at on public.cms_skills_tools;
create trigger set_cms_skills_tools_updated_at before update on public.cms_skills_tools
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_experience_roles_updated_at on public.cms_experience_roles;
create trigger set_cms_experience_roles_updated_at before update on public.cms_experience_roles
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_projects_meta_updated_at on public.cms_projects_meta;
create trigger set_cms_projects_meta_updated_at before update on public.cms_projects_meta
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_projects_featured_updated_at on public.cms_projects_featured;
create trigger set_cms_projects_featured_updated_at before update on public.cms_projects_featured
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_projects_cards_updated_at on public.cms_projects_cards;
create trigger set_cms_projects_cards_updated_at before update on public.cms_projects_cards
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_certificates_meta_updated_at on public.cms_certificates_meta;
create trigger set_cms_certificates_meta_updated_at before update on public.cms_certificates_meta
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_certificates_items_updated_at on public.cms_certificates_items;
create trigger set_cms_certificates_items_updated_at before update on public.cms_certificates_items
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_leadership_roles_updated_at on public.cms_leadership_roles;
create trigger set_cms_leadership_roles_updated_at before update on public.cms_leadership_roles
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_contact_updated_at on public.cms_contact;
create trigger set_cms_contact_updated_at before update on public.cms_contact
for each row execute function public.set_updated_at();

alter table public.cms_profile enable row level security;
alter table public.cms_education_schools enable row level security;
alter table public.cms_education_coursework enable row level security;
alter table public.cms_education_memberships enable row level security;
alter table public.cms_skills_languages enable row level security;
alter table public.cms_skills_tools enable row level security;
alter table public.cms_experience_roles enable row level security;
alter table public.cms_projects_meta enable row level security;
alter table public.cms_projects_featured enable row level security;
alter table public.cms_projects_cards enable row level security;
alter table public.cms_certificates_meta enable row level security;
alter table public.cms_certificates_items enable row level security;
alter table public.cms_leadership_roles enable row level security;
alter table public.cms_contact enable row level security;
alter table public.messages enable row level security;
alter table public.media_assets enable row level security;

grant usage on schema public to anon, authenticated;

grant select on
  public.cms_profile,
  public.cms_education_schools,
  public.cms_education_coursework,
  public.cms_education_memberships,
  public.cms_skills_languages,
  public.cms_skills_tools,
  public.cms_experience_roles,
  public.cms_projects_meta,
  public.cms_projects_featured,
  public.cms_projects_cards,
  public.cms_certificates_meta,
  public.cms_certificates_items,
  public.cms_leadership_roles,
  public.cms_contact
to anon, authenticated;

grant insert on public.messages to anon, authenticated;
grant select on public.messages to authenticated;

grant all on
  public.cms_profile,
  public.cms_education_schools,
  public.cms_education_coursework,
  public.cms_education_memberships,
  public.cms_skills_languages,
  public.cms_skills_tools,
  public.cms_experience_roles,
  public.cms_projects_meta,
  public.cms_projects_featured,
  public.cms_projects_cards,
  public.cms_certificates_meta,
  public.cms_certificates_items,
  public.cms_leadership_roles,
  public.cms_contact,
  public.media_assets
to authenticated;

-- Realtime updates used by the public site and admin inbox.
-- Public visitors can subscribe only to CMS tables they are allowed to read.
-- Contact messages are insertable by the public, but readable/subscribable only by authenticated admins.
do $$
declare
  realtime_table text;
  realtime_tables text[] := array[
    'cms_profile',
    'cms_education_schools',
    'cms_education_coursework',
    'cms_education_memberships',
    'cms_skills_languages',
    'cms_skills_tools',
    'cms_experience_roles',
    'cms_projects_meta',
    'cms_projects_featured',
    'cms_projects_cards',
    'cms_certificates_meta',
    'cms_certificates_items',
    'cms_leadership_roles',
    'cms_contact',
    'messages'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach realtime_table in array realtime_tables loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = realtime_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', realtime_table);
      end if;
    end loop;
  end if;
end $$;

drop policy if exists "Public can read cms_profile" on public.cms_profile;
create policy "Public can read cms_profile" on public.cms_profile
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_profile" on public.cms_profile;
create policy "Authenticated users can manage cms_profile" on public.cms_profile
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_education_schools" on public.cms_education_schools;
create policy "Public can read cms_education_schools" on public.cms_education_schools
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_education_schools" on public.cms_education_schools;
create policy "Authenticated users can manage cms_education_schools" on public.cms_education_schools
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_education_coursework" on public.cms_education_coursework;
create policy "Public can read cms_education_coursework" on public.cms_education_coursework
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_education_coursework" on public.cms_education_coursework;
create policy "Authenticated users can manage cms_education_coursework" on public.cms_education_coursework
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_education_memberships" on public.cms_education_memberships;
create policy "Public can read cms_education_memberships" on public.cms_education_memberships
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_education_memberships" on public.cms_education_memberships;
create policy "Authenticated users can manage cms_education_memberships" on public.cms_education_memberships
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_skills_languages" on public.cms_skills_languages;
create policy "Public can read cms_skills_languages" on public.cms_skills_languages
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_skills_languages" on public.cms_skills_languages;
create policy "Authenticated users can manage cms_skills_languages" on public.cms_skills_languages
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_skills_tools" on public.cms_skills_tools;
create policy "Public can read cms_skills_tools" on public.cms_skills_tools
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_skills_tools" on public.cms_skills_tools;
create policy "Authenticated users can manage cms_skills_tools" on public.cms_skills_tools
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_experience_roles" on public.cms_experience_roles;
create policy "Public can read cms_experience_roles" on public.cms_experience_roles
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_experience_roles" on public.cms_experience_roles;
create policy "Authenticated users can manage cms_experience_roles" on public.cms_experience_roles
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_projects_meta" on public.cms_projects_meta;
create policy "Public can read cms_projects_meta" on public.cms_projects_meta
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_projects_meta" on public.cms_projects_meta;
create policy "Authenticated users can manage cms_projects_meta" on public.cms_projects_meta
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_projects_featured" on public.cms_projects_featured;
create policy "Public can read cms_projects_featured" on public.cms_projects_featured
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_projects_featured" on public.cms_projects_featured;
create policy "Authenticated users can manage cms_projects_featured" on public.cms_projects_featured
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_projects_cards" on public.cms_projects_cards;
create policy "Public can read cms_projects_cards" on public.cms_projects_cards
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_projects_cards" on public.cms_projects_cards;
create policy "Authenticated users can manage cms_projects_cards" on public.cms_projects_cards
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_certificates_meta" on public.cms_certificates_meta;
create policy "Public can read cms_certificates_meta" on public.cms_certificates_meta
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_certificates_meta" on public.cms_certificates_meta;
create policy "Authenticated users can manage cms_certificates_meta" on public.cms_certificates_meta
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_certificates_items" on public.cms_certificates_items;
create policy "Public can read cms_certificates_items" on public.cms_certificates_items
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_certificates_items" on public.cms_certificates_items;
create policy "Authenticated users can manage cms_certificates_items" on public.cms_certificates_items
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_leadership_roles" on public.cms_leadership_roles;
create policy "Public can read cms_leadership_roles" on public.cms_leadership_roles
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_leadership_roles" on public.cms_leadership_roles;
create policy "Authenticated users can manage cms_leadership_roles" on public.cms_leadership_roles
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read cms_contact" on public.cms_contact;
create policy "Public can read cms_contact" on public.cms_contact
for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage cms_contact" on public.cms_contact;
create policy "Authenticated users can manage cms_contact" on public.cms_contact
for all to authenticated using (true) with check (true);

drop policy if exists "Anyone can submit messages" on public.messages;
create policy "Anyone can submit messages" on public.messages
for insert to anon, authenticated with check (true);
drop policy if exists "Authenticated users can read messages" on public.messages;
create policy "Authenticated users can read messages" on public.messages
for select to authenticated using (true);

drop policy if exists "Authenticated users can manage media assets" on public.media_assets;
create policy "Authenticated users can manage media assets" on public.media_assets
for all to authenticated using (true) with check (true);

drop policy if exists "Public can read portfolio files" on storage.objects;
create policy "Public can read portfolio files" on storage.objects
for select to anon, authenticated using (bucket_id = 'portfolio');

drop policy if exists "Authenticated users can upload portfolio files" on storage.objects;
create policy "Authenticated users can upload portfolio files" on storage.objects
for insert to authenticated with check (bucket_id = 'portfolio');
