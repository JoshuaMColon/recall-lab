-- Recall Lab: study data in its own `study` schema. Every learner table is owner-only (RLS),
-- rows cascade away with the auth user (so the hourly guest cleanup removes /demo data too).
create schema if not exists study;
revoke all on schema study from public, anon;
grant usage on schema study to authenticated, service_role;

create table study.courses (
  code text primary key check (code ~ '^[A-Z][0-9]{3}$'),
  title text not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table study.objectives (
  id text primary key,
  course_code text not null references study.courses (code) on delete cascade,
  code text not null,
  competency text not null,
  title text not null,
  summary text not null,
  weight integer not null check (weight between 0 and 100),
  position integer not null,
  unique (course_code, code)
);

create table study.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_code text not null default 'D335' references study.courses (code),
  objective_id text not null references study.objectives (id),
  question_id text not null check (char_length(question_id) between 1 and 80),
  qtype text not null check (qtype in ('mcq', 'output', 'bug', 'code')),
  correct boolean not null,
  score real not null check (score between 0 and 1),
  mode text not null check (mode in ('practice', 'review', 'mock')),
  session_id uuid,
  elapsed_ms integer not null default 0 check (elapsed_ms between 0 and 86400000),
  created_at timestamptz not null default now()
);
create index attempts_user_time on study.attempts (user_id, created_at desc);
create index attempts_objective on study.attempts (objective_id);

-- SM-2 spaced-repetition state, one row per learner per question.
create table study.review_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null check (char_length(question_id) between 1 and 80),
  objective_id text not null references study.objectives (id),
  ease real not null check (ease between 1.3 and 5),
  interval_days real not null check (interval_days >= 0),
  reps integer not null default 0,
  lapses integer not null default 0,
  due timestamptz not null,
  last_correct boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index review_state_objective on study.review_state (objective_id);

create table study.mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_code text not null default 'D335' references study.courses (code),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  time_limit_min integer not null check (time_limit_min between 1 and 240),
  total integer not null check (total between 1 and 200),
  correct integer not null check (correct between 0 and total),
  by_objective jsonb not null default '{}'::jsonb check (pg_column_size(by_objective) < 8000),
  created_at timestamptz not null default now()
);
create index mock_sessions_user on study.mock_sessions (user_id, finished_at desc);

-- AI-generated questions are cached per learner and reused instead of calling the model again.
create table study.ai_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objective_id text not null references study.objectives (id),
  qtype text not null check (qtype in ('mcq', 'output', 'bug', 'code')),
  payload jsonb not null check (pg_column_size(payload) < 16000),
  model text,
  created_at timestamptz not null default now()
);
create index ai_questions_user on study.ai_questions (user_id, objective_id);
create index ai_questions_objective on study.ai_questions (objective_id);

-- Cached AI hints / mistake explanations, keyed by question and (for explanations) the wrong answer.
create table study.ai_notes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null check (char_length(question_id) between 1 and 80),
  kind text not null check (kind in ('explain', 'hint')),
  answer_hash text not null default '' check (char_length(answer_hash) <= 64),
  content text not null check (char_length(content) <= 6000),
  created_at timestamptz not null default now(),
  primary key (user_id, question_id, kind, answer_hash)
);

-- Usage counters for the AI quota. No policies: only the SECURITY DEFINER functions touch them.
create table study.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  calls integer not null default 0,
  last_call_at timestamptz,
  primary key (user_id, day)
);
create table study.ai_usage_global (
  day date primary key,
  calls integer not null default 0
);

alter table study.courses enable row level security;
alter table study.objectives enable row level security;
alter table study.attempts enable row level security;
alter table study.review_state enable row level security;
alter table study.mock_sessions enable row level security;
alter table study.ai_questions enable row level security;
alter table study.ai_notes enable row level security;
alter table study.ai_usage enable row level security;
alter table study.ai_usage_global enable row level security;

create policy "courses are readable" on study.courses for select to authenticated using (true);
create policy "objectives are readable" on study.objectives for select to authenticated using (true);
create policy "own attempts" on study.attempts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own review state" on study.review_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own mock sessions" on study.mock_sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own ai questions" on study.ai_questions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own ai notes" on study.ai_notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on study.courses, study.objectives to authenticated;
grant select, insert, update, delete on study.attempts, study.review_state, study.mock_sessions, study.ai_questions, study.ai_notes to authenticated;
grant all on all tables in schema study to service_role;

-- The `study` schema is not in the Data API's exposed schemas (a dashboard setting), so, like
-- XPlan and the weather app, it is reached through thin security_invoker views in public:
-- the caller's RLS on study.* applies and the views add no privileges.
create view public.study_courses with (security_invoker = true) as select code, title, summary from study.courses;
create view public.study_objectives with (security_invoker = true) as
  select id, course_code, code, competency, title, summary, weight, position from study.objectives;
create view public.study_attempts with (security_invoker = true) as
  select id, user_id, course_code, objective_id, question_id, qtype, correct, score, mode, session_id, elapsed_ms, created_at from study.attempts;
create view public.study_review_state with (security_invoker = true) as
  select user_id, question_id, objective_id, ease, interval_days, reps, lapses, due, last_correct, updated_at from study.review_state;
create view public.study_mock_sessions with (security_invoker = true) as
  select id, user_id, course_code, started_at, finished_at, time_limit_min, total, correct, by_objective, created_at from study.mock_sessions;
create view public.study_ai_questions with (security_invoker = true) as
  select id, user_id, objective_id, qtype, payload, model, created_at from study.ai_questions;
create view public.study_ai_notes with (security_invoker = true) as
  select user_id, question_id, kind, answer_hash, content, created_at from study.ai_notes;

revoke all on public.study_courses, public.study_objectives, public.study_attempts, public.study_review_state,
  public.study_mock_sessions, public.study_ai_questions, public.study_ai_notes from public, anon;
grant select on public.study_courses, public.study_objectives to authenticated;
grant select, insert, update, delete on public.study_attempts, public.study_review_state, public.study_mock_sessions,
  public.study_ai_questions, public.study_ai_notes to authenticated;
grant all on public.study_courses, public.study_objectives, public.study_attempts, public.study_review_state,
  public.study_mock_sessions, public.study_ai_questions, public.study_ai_notes to service_role;

-- AI quota. Daily caps (UTC days): guests 3 calls, accounts 20, everyone together 150, and at
-- most one call every 4 seconds per learner. Keeps usage far inside the AI Gateway free credit.
create or replace function study.ai_limits(guest boolean)
returns table (user_cap integer, global_cap integer)
language sql immutable set search_path = '' as $$
  select case when guest then 3 else 20 end, 150
$$;

create or replace function public.study_ai_quota()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  guest boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  today date := (now() at time zone 'utc')::date;
  lim record;
  used integer;
  g integer;
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into lim from study.ai_limits(guest);
  select coalesce((select calls from study.ai_usage where user_id = uid and day = today), 0) into used;
  select coalesce((select calls from study.ai_usage_global where day = today), 0) into g;
  return jsonb_build_object('guest', guest, 'user_cap', lim.user_cap, 'user_used', used,
    'global_cap', lim.global_cap, 'global_used', g,
    'remaining', greatest(0, least(lim.user_cap - used, lim.global_cap - g)));
end $$;

create or replace function public.study_ai_consume(kind text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  guest boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  today date := (now() at time zone 'utc')::date;
  lim record;
  used integer;
  last_at timestamptz;
  g integer;
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if kind is null or kind not in ('generate', 'explain', 'hint') then
    raise exception 'Unknown AI action' using errcode = '22023';
  end if;
  select * into lim from study.ai_limits(guest);

  insert into study.ai_usage_global (day) values (today) on conflict (day) do nothing;
  select calls into g from study.ai_usage_global where day = today for update;
  insert into study.ai_usage (user_id, day) values (uid, today) on conflict (user_id, day) do nothing;
  select calls, last_call_at into used, last_at from study.ai_usage where user_id = uid and day = today for update;

  if g >= lim.global_cap then
    return jsonb_build_object('allowed', false, 'reason', 'global', 'remaining', 0);
  end if;
  if used >= lim.user_cap then
    return jsonb_build_object('allowed', false, 'reason', 'user', 'guest', guest, 'remaining', 0);
  end if;
  if last_at is not null and last_at > now() - interval '4 seconds' then
    return jsonb_build_object('allowed', false, 'reason', 'burst', 'remaining', lim.user_cap - used);
  end if;

  update study.ai_usage set calls = calls + 1, last_call_at = now() where user_id = uid and day = today;
  update study.ai_usage_global set calls = calls + 1 where day = today;
  return jsonb_build_object('allowed', true, 'remaining', least(lim.user_cap - used - 1, lim.global_cap - g - 1));
end $$;

revoke all on function study.ai_limits(boolean) from public, anon;
revoke all on function public.study_ai_quota() from public, anon;
revoke all on function public.study_ai_consume(text) from public, anon;
grant execute on function study.ai_limits(boolean) to authenticated, service_role;
grant execute on function public.study_ai_quota() to authenticated, service_role;
grant execute on function public.study_ai_consume(text) to authenticated, service_role;

-- Old usage counters are not needed after a week.
create or replace function study.prune_ai_usage()
returns void language sql security definer set search_path = '' as $$
  delete from study.ai_usage where day < (now() at time zone 'utc')::date - 7;
  delete from study.ai_usage_global where day < (now() at time zone 'utc')::date - 30;
$$;
revoke all on function study.prune_ai_usage() from public, anon, authenticated;
select cron.schedule('study-prune-ai-usage', '41 4 * * *', 'select study.prune_ai_usage()');

insert into study.courses (code, title, summary) values ('D335', 'Introduction to Programming in Python', 'Writing small Python scripts: data, control flow, functions, collections, errors, modules and files.');
insert into study.objectives (id, course_code, code, competency, title, summary, weight, position) values
  ('D335.01', 'D335', '01', 'A', 'Variables, expressions & operators', 'Assign and update variables; evaluate arithmetic with + - * / // % ** and precedence; use augmented assignment.', 8, 1),
  ('D335.02', 'D335', '02', 'A', 'Input, output & type conversion', 'Read text with input(), convert with int(), float() and str(), and format output with print options and f-strings.', 10, 2),
  ('D335.03', 'D335', '03', 'A', 'Branching & Boolean logic', 'Write if / elif / else chains; combine conditions with and, or, not; reason about comparisons and truthiness.', 10, 3),
  ('D335.04', 'D335', '04', 'A', 'Loops', 'Repeat work with for over range() and sequences, and with while; use break, continue, accumulators and nested loops.', 12, 4),
  ('D335.05', 'D335', '05', 'A', 'Functions', 'Define functions with parameters, defaults and return values; tell return from print; understand local vs global scope.', 12, 5),
  ('D335.06', 'D335', '06', 'A', 'Strings', 'Index and slice strings, use common string methods, and remember that strings are immutable.', 10, 6),
  ('D335.07', 'D335', '07', 'A', 'Lists & tuples', 'Create, index, slice and change lists; use list methods and comprehensions; know when to use an immutable tuple.', 10, 7),
  ('D335.08', 'D335', '08', 'A', 'Dictionaries & sets', 'Store and look up key-value pairs, iterate with items(), use get() and membership tests, and de-duplicate with sets.', 8, 8),
  ('D335.09', 'D335', '09', 'A', 'Exceptions & debugging', 'Read tracebacks, recognise common runtime errors, and handle them with try / except / else / finally and raise.', 6, 9),
  ('D335.10', 'D335', '10', 'B', 'Modules & libraries', 'Import modules in different ways and use standard-library modules such as math, random, datetime and string; know what __name__ == ''__main__'' does.', 8, 10),
  ('D335.11', 'D335', '11', 'B', 'Files', 'Open files in the right mode, read and write text, close files automatically with with, and process CSV-style rows.', 6, 11);
