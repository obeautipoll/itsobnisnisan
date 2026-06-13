-- Normalized CMS section tables for Supabase/Postgres.
-- This creates one table per editable CMS section or repeated item group.
-- Note: server/index.js currently uses public.content_sections JSON rows.
-- Use this schema if you plan to update the API to read/write normalized tables.

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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin' check (role in ('admin', 'editor')),
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

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
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
alter table public.users enable row level security;
alter table public.messages enable row level security;
