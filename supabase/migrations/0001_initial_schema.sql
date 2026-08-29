create extension if not exists vector with schema extensions;

create type public.idea_status as enum (
  'inbox','structured','evaluated','validate','build','research','incubate','archive','kill'
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  raw_input text not null,
  summary text,
  problem text,
  solution text,
  target_user text,
  revenue_model text,
  distribution text,
  status public.idea_status not null default 'inbox',
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.idea_versions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  version_no integer not null,
  snapshot jsonb not null,
  change_reason text,
  created_at timestamptz not null default now(),
  unique (idea_id, version_no),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create table public.idea_relationships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_idea_id uuid not null,
  target_idea_id uuid not null,
  relationship_type text not null,
  strength numeric(5,2) check (strength between 0 and 100),
  confidence numeric(5,2) check (confidence between 0 and 100),
  rationale text,
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  check (source_idea_id <> target_idea_id),
  unique (source_idea_id, target_idea_id, relationship_type),
  foreign key (source_idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade,
  foreign key (target_idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scoring_model_version text not null,
  dimensions jsonb not null,
  opportunity_score numeric(5,2) not null check (opportunity_score between 0 and 100),
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  rationale text,
  assumptions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recommendation text not null check (recommendation in ('BUILD','VALIDATE','RESEARCH','INCUBATE','ARCHIVE','KILL')),
  confidence numeric(5,2) check (confidence between 0 and 100),
  rationale text,
  accepted boolean,
  override_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create table public.signals (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  signal_type text not null,
  title text not null,
  body text,
  source_url text,
  source_title text,
  fetched_at timestamptz,
  confidence numeric(5,2) check (confidence between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  validation_hypothesis text,
  target_metrics jsonb not null default '{}'::jsonb,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete restrict
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  sort_order integer not null default 0,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (project_id, owner_id) references public.projects(id, owner_id) on delete cascade
);

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null,
  project_id uuid,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  actual_cost numeric check (actual_cost is null or actual_cost >= 0),
  actual_days numeric check (actual_days is null or actual_days >= 0),
  actual_revenue numeric,
  demand_metric numeric,
  outcome_label text,
  lessons text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade,
  foreign key (project_id, owner_id) references public.projects(id, owner_id) on delete restrict
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  idea_id uuid,
  task_type text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  input_version text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  status text not null,
  output jsonb,
  created_at timestamptz not null default now(),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create table public.idea_embeddings (
  idea_id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  embedding_model text not null,
  input_hash text not null,
  embedding extensions.vector(1536) not null,
  updated_at timestamptz not null default now(),
  foreign key (idea_id, owner_id) references public.ideas(id, owner_id) on delete cascade
);

create index ideas_owner_status_idx on public.ideas(owner_id, status);
create index idea_versions_idea_created_idx on public.idea_versions(idea_id, created_at desc);
create index evaluations_idea_created_idx on public.evaluations(idea_id, created_at desc);
create index relationships_source_idx on public.idea_relationships(source_idea_id);
create index relationships_target_idx on public.idea_relationships(target_idea_id);
create index signals_owner_created_idx on public.signals(owner_id, created_at desc);
create index projects_owner_status_idx on public.projects(owner_id, status);

alter table public.ideas enable row level security;
alter table public.idea_versions enable row level security;
alter table public.idea_relationships enable row level security;
alter table public.evaluations enable row level security;
alter table public.recommendations enable row level security;
alter table public.signals enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.outcomes enable row level security;
alter table public.ai_runs enable row level security;
alter table public.idea_embeddings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ideas','idea_relationships','recommendations','signals','projects','tasks','outcomes','idea_embeddings']
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)',
      t || '_owner_all', t
    );
  end loop;
end $$;

create policy idea_versions_owner_select on public.idea_versions
for select to authenticated using ((select auth.uid()) = owner_id);
create policy idea_versions_owner_insert on public.idea_versions
for insert to authenticated with check ((select auth.uid()) = owner_id);

create policy evaluations_owner_select on public.evaluations
for select to authenticated using ((select auth.uid()) = owner_id);
create policy evaluations_owner_insert on public.evaluations
for insert to authenticated with check ((select auth.uid()) = owner_id);

create policy ai_runs_owner_select on public.ai_runs
for select to authenticated using ((select auth.uid()) = owner_id);
create policy ai_runs_owner_insert on public.ai_runs
for insert to authenticated with check ((select auth.uid()) = owner_id);

grant usage on schema public to authenticated;
grant usage on schema extensions to authenticated;
grant usage on type public.idea_status to authenticated;

grant select, insert, update, delete on table
  public.ideas,
  public.idea_relationships,
  public.recommendations,
  public.signals,
  public.projects,
  public.tasks,
  public.outcomes,
  public.idea_embeddings
to authenticated;

grant select, insert on table
  public.idea_versions,
  public.evaluations,
  public.ai_runs
to authenticated;

revoke all on table
  public.ideas,
  public.idea_versions,
  public.idea_relationships,
  public.evaluations,
  public.recommendations,
  public.signals,
  public.projects,
  public.tasks,
  public.outcomes,
  public.ai_runs,
  public.idea_embeddings
from anon;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create or replace function public.protect_idea_raw_input()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.raw_input is distinct from old.raw_input then
    raise exception 'raw_input is immutable';
  end if;
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.protect_idea_raw_input() from public, anon, authenticated;

create trigger ideas_touch_updated_at before update on public.ideas
for each row execute function public.touch_updated_at();

create trigger ideas_protect_raw_input before update on public.ideas
for each row execute function public.protect_idea_raw_input();

create trigger projects_touch_updated_at before update on public.projects
for each row execute function public.touch_updated_at();
