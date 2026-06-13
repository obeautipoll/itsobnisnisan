-- Supabase schema used by the local CMS API.
-- Run this in the Supabase SQL editor for the project used by server/.env.
-- For secure writes, put SUPABASE_SERVICE_ROLE_KEY in server/.env and keep it server-only.

create extension if not exists pgcrypto;

create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,
  data jsonb not null default '{}'::jsonb,
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

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'portfolio-media',
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

drop trigger if exists set_content_sections_updated_at on public.content_sections;
create trigger set_content_sections_updated_at
before update on public.content_sections
for each row execute function public.set_updated_at();

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.content_sections enable row level security;
alter table public.users enable row level security;
alter table public.messages enable row level security;
alter table public.media_assets enable row level security;
