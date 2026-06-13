-- Supabase schema used directly by the Vite app.
-- Run this in the Supabase SQL editor.
-- Create an admin user in Supabase Auth, then sign in at /admin with that email/password.

create extension if not exists pgcrypto;

create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,
  data jsonb not null default '{}'::jsonb,
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

alter table public.content_sections enable row level security;
alter table public.messages enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "Public can read content sections" on public.content_sections;
create policy "Public can read content sections"
on public.content_sections for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can manage content sections" on public.content_sections;
create policy "Authenticated users can manage content sections"
on public.content_sections for all
to authenticated
using (true)
with check (true);

drop policy if exists "Anyone can submit messages" on public.messages;
create policy "Anyone can submit messages"
on public.messages for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated users can read messages" on public.messages;
create policy "Authenticated users can read messages"
on public.messages for select
to authenticated
using (true);

drop policy if exists "Authenticated users can manage media assets" on public.media_assets;
create policy "Authenticated users can manage media assets"
on public.media_assets for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read portfolio files" on storage.objects;
create policy "Public can read portfolio files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'portfolio');

drop policy if exists "Authenticated users can upload portfolio files" on storage.objects;
create policy "Authenticated users can upload portfolio files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'portfolio');
