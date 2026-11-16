-- Sansad Lab database. Run once in the Supabase SQL editor.
-- Nothing is readable or writable by the public. Only server-side code holds
-- the service key: the nightly ingestion (GitHub Actions) and the read API
-- (Vercel functions). The browser never talks to Supabase directly.

create table if not exists members (
  mpsno        int primary key,
  name         text not null,
  party        text,
  party_short  text,
  state        text,
  constituency text,
  photo_url    text,
  terms        int,
  status       text
);

create table if not exists questions (
  id               text primary key,
  lok_no           int not null,
  ques_no          int not null,
  type             text,
  date             date,
  session_no       int,
  ministry         text,
  subject          text,
  members_text     text,
  doc_url          text,
  pdf_url          text,
  question_text    text,
  answer_text      text,
  question_excerpt text,
  answer_excerpt   text,
  topics           text[] not null default '{}',
  ingested_at      timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(question_text, '') || ' ' || coalesce(answer_text, ''))
  ) stored
);
create index if not exists questions_date_idx   on questions (date desc);
create index if not exists questions_topics_idx on questions using gin (topics);
create index if not exists questions_fts_idx    on questions using gin (fts);
create index if not exists questions_ingested_idx on questions (ingested_at);

create table if not exists question_members (
  question_id text references questions (id) on delete cascade,
  mpsno       int  references members (mpsno) on delete cascade,
  primary key (question_id, mpsno)
);
create index if not exists question_members_mp_idx on question_members (mpsno);

create table if not exists sessions (
  lok_no     int,
  session_no int,
  start_date date,
  end_date   date,
  primary key (lok_no, session_no)
);

create table if not exists meta (
  key   text primary key,
  value text
);

alter table members          enable row level security;
alter table questions        enable row level security;
alter table question_members enable row level security;
alter table sessions         enable row level security;
alter table meta             enable row level security;

-- Close the public (anon) role completely. With no policies and no grants,
-- row-level security denies everything to anon. Supabase's default privileges
-- can grant anon access to new tables, so revoke those too.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Prefix search: "vande" finds "Vande Bharat", "neet" finds "NEET-UG".
create or replace function prefix_query(p text)
returns tsquery language sql immutable as $
  select case when count(*) = 0 then null
              else to_tsquery('english', string_agg(w || ':*', ' & ')) end
  from (
    select regexp_replace(lower(t), '[^a-z0-9]', '', 'g') as w
    from regexp_split_to_table(coalesce(p, ''), '\s+') as t
  ) words
  where w <> ''
$;

-- Feed rows share one shape: the question plus who asked it, plus a total.
create or replace function feed_row(q questions)
returns jsonb language sql stable security invoker as $$
  select jsonb_build_object(
    'id', q.id, 'date', q.date, 'type', q.type, 'ministry', q.ministry, 'subject', q.subject,
    'questionExcerpt', q.question_excerpt, 'answerExcerpt', q.answer_excerpt,
    'docUrl', q.doc_url, 'pdfUrl', q.pdf_url,
    'askedBy', coalesce((
      select jsonb_agg(jsonb_build_object('mpsno', m.mpsno, 'name', m.name, 'party', m.party_short) order by m.name)
      from question_members qm join members m on m.mpsno = qm.mpsno where qm.question_id = q.id
    ), '[]'::jsonb)
  )
$$;

create or replace function mp_feed(p_mpsno int, p_ministry text, p_q text, p_limit int, p_offset int)
returns table (item jsonb, total bigint) language sql stable security invoker as $$
  with hits as (
    select q.* from questions q
    join question_members qm on qm.question_id = q.id and qm.mpsno = p_mpsno
    where (p_ministry is null or q.ministry = p_ministry)
      and (p_q is null or q.fts @@ prefix_query(p_q))
  )
  select feed_row(h), count(*) over () from hits h
  order by h.date desc, h.ques_no desc
  limit least(p_limit, 50) offset p_offset
$$;

create or replace function mp_ministry_counts(p_mpsno int)
returns table (ministry text, n bigint) language sql stable security invoker as $$
  select q.ministry, count(*) from questions q
  join question_members qm on qm.question_id = q.id and qm.mpsno = p_mpsno
  group by q.ministry order by count(*) desc
$$;

create or replace function topic_feed(p_slug text, p_limit int, p_offset int)
returns table (item jsonb, total bigint) language sql stable security invoker as $$
  select feed_row(q), count(*) over () from questions q
  where p_slug = any (q.topics)
  order by q.date desc, q.ques_no desc
  limit least(p_limit, 50) offset p_offset
$$;

create or replace function topic_breakdown(p_slug text)
returns table (kind text, name text, n bigint) language sql stable security invoker as $$
  with asked as (
    select m.* from questions q
    join question_members qm on qm.question_id = q.id
    join members m on m.mpsno = qm.mpsno
    where p_slug = any (q.topics)
  )
  (select 'state', state, count(*) from asked group by state order by count(*) desc limit 10)
  union all
  (select 'party', party_short, count(*) from asked group by party_short order by count(*) desc limit 10)
$$;

create or replace function search_questions(p_q text, p_limit int, p_offset int)
returns table (item jsonb, total bigint) language sql stable security invoker as $$
  select feed_row(q), count(*) over () from questions q
  where q.fts @@ prefix_query(p_q)
  order by q.date desc, q.ques_no desc
  limit least(p_limit, 50) offset p_offset
$$;

create or replace function since_counts(p_mpsnos int[], p_slugs text[], p_since timestamptz)
returns table (kind text, key text, n bigint) language sql stable security invoker as $$
  select 'mp', qm.mpsno::text, count(*) from questions q
  join question_members qm on qm.question_id = q.id
  where qm.mpsno = any (p_mpsnos) and q.ingested_at > p_since
  group by qm.mpsno
  union all
  select 'topic', t, count(*) from questions q, unnest(q.topics) t
  where t = any (p_slugs) and q.ingested_at > p_since
  group by t
$$;

-- Server-side access. With "Automatically expose new tables" off, Supabase does
-- not grant its service role anything either, so grant it here. Only code
-- holding the service key (GitHub Actions, Vercel functions) uses this role.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
