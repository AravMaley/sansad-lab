-- Prefix search: every word typed matches the start of a word in the question,
-- so "vande" finds "Vande Bharat" and "neet" finds "NEET-UG".
create or replace function prefix_query(p text)
returns tsquery language sql immutable as $$
  select case when count(*) = 0 then null
              else to_tsquery('english', string_agg(w || ':*', ' & ')) end
  from (
    select regexp_replace(lower(t), '[^a-z0-9]', '', 'g') as w
    from regexp_split_to_table(coalesce(p, ''), '\s+') as t
  ) words
  where w <> ''
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

create or replace function search_questions(p_q text, p_limit int, p_offset int)
returns table (item jsonb, total bigint) language sql stable security invoker as $$
  select feed_row(q), count(*) over () from questions q
  where q.fts @@ prefix_query(p_q)
  order by q.date desc, q.ques_no desc
  limit least(p_limit, 50) offset p_offset
$$;

grant execute on function prefix_query(text) to service_role;
revoke execute on function prefix_query(text) from public, anon, authenticated;
