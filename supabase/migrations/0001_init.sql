-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── profile ─────────────────────────────────────────────────────────────────
create table profile (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  goals           text,
  height_cm       numeric,
  age             int,
  sex             text check (sex in ('male', 'female', 'other')),
  training_experience text check (training_experience in ('beginner', 'intermediate', 'advanced')),
  equipment_available text[] default '{}',
  constraints     text,
  preferences     text,
  updated_at      timestamptz default now(),
  unique (user_id)
);

-- ─── workout_plan ─────────────────────────────────────────────────────────────
create table workout_plan (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_start   date not null,
  generated_at timestamptz default now(),
  plan_json    jsonb not null
);

-- ─── workout_session ──────────────────────────────────────────────────────────
create table workout_session (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  plan_id                 uuid references workout_plan(id) on delete set null,
  day_index               int,
  date                    date not null,
  performed_exercises_json jsonb default '[]',
  perceived_effort        int check (perceived_effort between 1 and 10),
  completed               boolean default false,
  created_at              timestamptz default now()
);

-- ─── body_metric ──────────────────────────────────────────────────────────────
create table body_metric (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  weight_kg       numeric,
  body_fat_pct    numeric,
  muscle_mass_kg  numeric,
  water_pct       numeric,
  source          text default 'manual' check (source in ('manual', 'garmin')),
  created_at      timestamptz default now(),
  unique (user_id, date, source)
);

-- ─── garmin_activity ─────────────────────────────────────────────────────────
create table garmin_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  type        text,
  duration_s  int,
  distance_m  numeric,
  avg_hr      int,
  calories    int,
  raw_payload jsonb,
  created_at  timestamptz default now(),
  unique (user_id, date, type)
);

-- ─── coach_review ────────────────────────────────────────────────────────────
create table coach_review (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  week_start     date not null,
  summary_md     text,
  suggestions_json jsonb default '[]',
  generated_at   timestamptz default now(),
  unique (user_id, week_start)
);

-- ─── RLS policies ────────────────────────────────────────────────────────────
alter table profile          enable row level security;
alter table workout_plan     enable row level security;
alter table workout_session  enable row level security;
alter table body_metric      enable row level security;
alter table garmin_activity  enable row level security;
alter table coach_review     enable row level security;

-- Each user sees and modifies only their own rows
create policy "own profile"         on profile          for all using (auth.uid() = user_id);
create policy "own workout_plan"    on workout_plan     for all using (auth.uid() = user_id);
create policy "own workout_session" on workout_session  for all using (auth.uid() = user_id);
create policy "own body_metric"     on body_metric      for all using (auth.uid() = user_id);
create policy "own garmin_activity" on garmin_activity  for all using (auth.uid() = user_id);
create policy "own coach_review"    on coach_review     for all using (auth.uid() = user_id);
