begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'rls-a@ideabin.test'),
  ('22222222-2222-4222-8222-222222222222', 'rls-b@ideabin.test');

insert into public.ideas (id, owner_id, title, raw_input) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'A private idea', 'raw-a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'B private idea', 'raw-b');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select count(*) from public.ideas where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)$$,
  array[1::bigint],
  'User A sees only one fixture idea'
);

select results_eq(
  $$select count(*) from public.ideas where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid$$,
  array[1::bigint],
  'User A sees own idea'
);

select results_eq(
  $$select count(*) from public.ideas where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid$$,
  array[0::bigint],
  'User A cannot see User B idea'
);

select lives_ok(
  $$insert into public.ideas (title, raw_input) values ('owner default', 'raw')$$,
  'Authenticated insert defaults owner_id to auth.uid()'
);

select throws_ok(
  $$insert into public.ideas (owner_id, title, raw_input) values ('22222222-2222-4222-8222-222222222222', 'forged', 'raw')$$,
  '42501',
  'new row violates row-level security policy for table "ideas"',
  'User A cannot forge User B ownership'
);

select throws_ok(
  $$update public.ideas set raw_input = 'tampered' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid$$,
  'P0001',
  'raw_input is immutable',
  'Original raw input is immutable even to owner'
);

select throws_ok(
  $$insert into public.idea_relationships (source_idea_id, target_idea_id, relationship_type) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','forged')$$,
  '23503',
  null,
  'Cross-owner relationship cannot satisfy owner-scoped FK'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select results_eq(
  $$with changed as (update public.ideas set title = 'tampered' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid returning 1) select count(*) from changed$$,
  array[0::bigint],
  'User B cannot update User A idea'
);

reset role;

select ok(
  not has_table_privilege('authenticated', 'public.idea_versions', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.evaluations', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.ai_runs', 'UPDATE'),
  'Historical tables are append-only at privilege layer'
);

select * from finish();
rollback;
