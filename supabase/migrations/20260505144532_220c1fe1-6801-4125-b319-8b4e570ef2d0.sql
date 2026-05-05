
-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  create type tipo_usuario as enum ('responsavel', 'aluno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ano_escolar as enum ('1_EF','2_EF','3_EF','4_EF','5_EF','6_EF','olimpiadas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_plano as enum ('gerando','ativo','concluido','erro');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  tipo tipo_usuario not null default 'responsavel',
  termos_lgpd_at timestamptz default now(),
  criado_em timestamptz default now()
);

create table if not exists public.filhos (
  id uuid primary key default uuid_generate_v4(),
  responsavel_id uuid not null references public.profiles(id) on delete cascade,
  nome text not null,
  ano_escolar ano_escolar not null,
  escola text,
  data_nascimento date,
  criado_em timestamptz default now()
);
create index if not exists idx_filhos_responsavel on public.filhos(responsavel_id);

create table if not exists public.planos (
  id uuid primary key default uuid_generate_v4(),
  filho_id uuid not null references public.filhos(id) on delete cascade,
  disciplina text not null,
  data_prova date not null,
  status status_plano not null default 'gerando',
  conteudo_json jsonb,
  observacoes text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);
create index if not exists idx_planos_filho on public.planos(filho_id);
create index if not exists idx_planos_data on public.planos(data_prova);

create table if not exists public.materiais (
  id uuid primary key default uuid_generate_v4(),
  plano_id uuid not null references public.planos(id) on delete cascade,
  storage_path text not null,
  ordem int default 0,
  criado_em timestamptz default now()
);
create index if not exists idx_materiais_plano on public.materiais(plano_id);

create table if not exists public.familia_vinculos (
  id uuid primary key default uuid_generate_v4(),
  filho_id uuid not null references public.filhos(id) on delete cascade,
  codigo text not null unique,
  responsavel_id uuid references public.profiles(id) on delete cascade,
  expira_em timestamptz default (now() + interval '24 hours'),
  usado boolean default false,
  criado_em timestamptz default now()
);

create table if not exists public.assinaturas (
  id uuid primary key default uuid_generate_v4(),
  responsavel_id uuid not null references public.profiles(id) on delete cascade unique,
  plano text not null check (plano in ('mensal','anual')),
  status text not null default 'trial',
  mp_subscription_id text,
  proximo_pagamento date,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Triggers
create or replace function public.tg_set_atualizado_em()
returns trigger language plpgsql
set search_path = public as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists tg_planos_atualizado_em on public.planos;
create trigger tg_planos_atualizado_em
  before update on public.planos
  for each row execute function public.tg_set_atualizado_em();

drop trigger if exists tg_assinaturas_atualizado_em on public.assinaturas;
create trigger tg_assinaturas_atualizado_em
  before update on public.assinaturas
  for each row execute function public.tg_set_atualizado_em();

create or replace function public.tg_handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email, nome, tipo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'tipo')::tipo_usuario, 'responsavel')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists tg_on_auth_user_created on auth.users;
create trigger tg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.filhos enable row level security;
alter table public.planos enable row level security;
alter table public.materiais enable row level security;
alter table public.familia_vinculos enable row level security;
alter table public.assinaturas enable row level security;

drop policy if exists "users select own profile" on public.profiles;
create policy "users select own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "responsavel manages children" on public.filhos;
create policy "responsavel manages children" on public.filhos
  for all using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);

drop policy if exists "responsavel manages planos" on public.planos;
create policy "responsavel manages planos" on public.planos
  for all using (exists (select 1 from public.filhos where filhos.id = planos.filho_id and filhos.responsavel_id = auth.uid()))
  with check (exists (select 1 from public.filhos where filhos.id = planos.filho_id and filhos.responsavel_id = auth.uid()));

drop policy if exists "responsavel manages materiais" on public.materiais;
create policy "responsavel manages materiais" on public.materiais
  for all using (exists (select 1 from public.planos p join public.filhos f on f.id = p.filho_id where p.id = materiais.plano_id and f.responsavel_id = auth.uid()));

drop policy if exists "responsavel manages vinculos" on public.familia_vinculos;
create policy "responsavel manages vinculos" on public.familia_vinculos
  for all using (
    exists (select 1 from public.filhos where filhos.id = familia_vinculos.filho_id and filhos.responsavel_id = auth.uid())
    or auth.uid() = responsavel_id
  );

drop policy if exists "responsavel sees own assinatura" on public.assinaturas;
create policy "responsavel sees own assinatura" on public.assinaturas for select using (auth.uid() = responsavel_id);
drop policy if exists "responsavel updates own assinatura" on public.assinaturas;
create policy "responsavel updates own assinatura" on public.assinaturas for update using (auth.uid() = responsavel_id);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('materiais-prova', 'materiais-prova', false)
on conflict (id) do nothing;

drop policy if exists "responsavel uploads to own plano folder" on storage.objects;
create policy "responsavel uploads to own plano folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'materiais-prova'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.planos p
      join public.filhos f on f.id = p.filho_id
      where f.responsavel_id = auth.uid()
    )
  );

drop policy if exists "responsavel reads own plano files" on storage.objects;
create policy "responsavel reads own plano files" on storage.objects
  for select to authenticated using (
    bucket_id = 'materiais-prova'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.planos p
      join public.filhos f on f.id = p.filho_id
      where f.responsavel_id = auth.uid()
    )
  );
