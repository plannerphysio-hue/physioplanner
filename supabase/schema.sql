-- PhysioPlanner — schema Supabase (Fase 3)
-- Corre este ficheiro uma vez no SQL Editor do teu projeto Supabase.
-- Desenhado para funcionar só com a publishable/anon key (RLS trata da
-- autorização) — não é preciso a service role key para nada disto.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria automaticamente a linha em profiles quando alguém se regista.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Histórico de planos (substitui physioplanner_history_{email})
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_data jsonb not null,
  objetivos jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "Users manage own plans"
  on public.plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Banco de exercícios (substitui a chave "exercise_library")
create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sinonimos text[] not null default '{}',
  categoria text,
  imagem text,
  video text,
  instrucao text,
  tipo text,
  patologias text,
  fonte text,
  created_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;

create policy "Authenticated users can read exercise library"
  on public.exercise_library for select
  to authenticated
  using (true);

create policy "Admins manage exercise library"
  on public.exercise_library for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Guidelines próprias (antes só existiam em memória, perdiam-se ao recarregar)
create table public.custom_guidelines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null,
  file_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.custom_guidelines enable row level security;

create policy "Authenticated users can read guidelines"
  on public.custom_guidelines for select
  to authenticated
  using (true);

create policy "Admins manage guidelines"
  on public.custom_guidelines for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Depois de correr este script e de te registares na app com a tua conta:
-- update public.profiles set is_admin = true where email = 'o-teu-email@exemplo.com';
