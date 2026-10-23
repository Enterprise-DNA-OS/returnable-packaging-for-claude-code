create schema packaging;
revoke all on schema packaging from public;
create function packaging.touch() returns trigger language plpgsql as $$
begin new.updated_at=clock_timestamp(); return new; end $$;
create function packaging.immutable() returns trigger language plpgsql as $$
begin raise exception 'Ledger records are immutable; record a reversal or a new observation'; end $$;
create table packaging.locations (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''),
 name text not null check(btrim(name)<>''), kind text not null default 'unknown' check(kind in ('internal','partner','system','unknown')),
 owner text, country text check(country in ('NZ','AU','other')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index location_code_ci on packaging.locations(lower(code));
create table packaging.items (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''),
 food_contact boolean default null, suitability_ref text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index item_code_ci on packaging.items(lower(code));
create table packaging.movements (
 id uuid primary key default gen_random_uuid(), reference text not null unique check(btrim(reference)<>''),
 item_id uuid not null references packaging.items, from_id uuid not null references packaging.locations,
 to_id uuid not null references packaging.locations, quantity integer not null check(quantity>0), moved_on date not null,
 due_on date, evidence_ref text, note text not null default '', actor text not null check(btrim(actor)<>''),
 reversal_of uuid unique references packaging.movements,
 source_key text unique, source_payload jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(from_id<>to_id), check(due_on is null or due_on>=moved_on)
);
create unique index movement_reference_ci on packaging.movements(lower(reference));
create table packaging.allocations (
 id uuid primary key default gen_random_uuid(), issue_id uuid not null references packaging.movements,
 return_id uuid not null references packaging.movements, quantity integer not null check(quantity>0),
 actor text not null check(btrim(actor)<>''), void_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(issue_id<>return_id),
 check(void_reason is null or btrim(void_reason)<>'')
);
create table packaging.counts (
 id uuid primary key default gen_random_uuid(), location_id uuid not null references packaging.locations,
 item_id uuid not null references packaging.items, counted_on date not null, quantity integer not null check(quantity>=0),
 ledger_at_count bigint not null, evidence_ref text not null check(btrim(evidence_ref)<>''), actor text not null check(btrim(actor)<>''),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table packaging.disputes (
 id uuid primary key default gen_random_uuid(), movement_id uuid not null references packaging.movements,
 title text not null check(btrim(title)<>''), owner text not null check(btrim(owner)<>''), due_on date not null,
 status text not null default 'open' check(status in ('open','closed')), resolution text,
 actor text not null check(btrim(actor)<>''), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='open' or (resolution is not null and btrim(resolution)<>''))
);
create table packaging.inspections (
 id uuid primary key default gen_random_uuid(), location_id uuid not null references packaging.locations,
 item_id uuid not null references packaging.items, checked_on date not null,
 result text not null check(result in ('clean','damaged','quarantine')), evidence_ref text not null check(btrim(evidence_ref)<>''),
 actor text not null check(btrim(actor)<>''), note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table packaging.activity (
 id uuid primary key default gen_random_uuid(), action text not null, actor text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table packaging.import_batches (
 id uuid primary key default gen_random_uuid(), file_hash text not null, actor text not null, added integer not null, unchanged integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function packaging.guard_movement() returns trigger language plpgsql as $$
declare orig packaging.movements; begin
 if new.moved_on>current_date then raise exception 'Future movements are not posted stock'; end if;
 if new.reversal_of is not null then
  select * into orig from packaging.movements where id=new.reversal_of for update;
  if orig.reversal_of is not null then raise exception 'Cannot reverse a reversal'; end if;
  if new.item_id<>orig.item_id or new.from_id<>orig.to_id or new.to_id<>orig.from_id or new.quantity<>orig.quantity or new.moved_on<orig.moved_on then raise exception 'Reversal must exactly offset the original'; end if;
  if exists(select 1 from packaging.allocations where (issue_id=orig.id or return_id=orig.id) and void_reason is null) then raise exception 'Unmatch active return allocations before reversal'; end if;
 end if;
 return new; end $$;
create trigger validate_movement before insert on packaging.movements for each row execute function packaging.guard_movement();
create function packaging.guard_allocation() returns trigger language plpgsql as $$
declare i packaging.movements; r packaging.movements; used_i bigint; used_r bigint;
begin
 if tg_op='UPDATE' then
  if new.issue_id<>old.issue_id or new.return_id<>old.return_id or new.quantity<>old.quantity or old.void_reason is not null or new.void_reason is null then raise exception 'Only voiding an active allocation is allowed'; end if;
  return new;
 end if;
 perform id from packaging.movements where id in (new.issue_id,new.return_id) order by id for update;
 select * into i from packaging.movements where id=new.issue_id;
 select * into r from packaging.movements where id=new.return_id;
 if i.item_id<>r.item_id or i.from_id<>r.to_id or i.to_id<>r.from_id or r.moved_on<i.moved_on or i.reversal_of is not null or r.reversal_of is not null then raise exception 'Return must match item and reverse the issue route after issue date'; end if;
 if exists(select 1 from packaging.movements where reversal_of in (i.id,r.id)) then raise exception 'Reversed movements cannot be allocated'; end if;
 if not exists(select 1 from packaging.locations where id=i.from_id and kind='internal') or not exists(select 1 from packaging.locations where id=i.to_id and kind='partner') then raise exception 'Match returns only to internal-to-partner issues'; end if;
 select coalesce(sum(quantity),0) into used_i from packaging.allocations where issue_id=i.id and void_reason is null;
 select coalesce(sum(quantity),0) into used_r from packaging.allocations where return_id=r.id and void_reason is null;
 if used_i+new.quantity>i.quantity or used_r+new.quantity>r.quantity then raise exception 'Return allocation exceeds available quantity'; end if;
 return new; end $$;
create trigger no_delete before delete on packaging.allocations for each row execute function packaging.immutable();
create trigger validate_allocation before insert or update on packaging.allocations for each row execute function packaging.guard_allocation();
do $$ declare t text; begin
 foreach t in array array['locations','items','movements','allocations','counts','disputes','inspections','activity','import_batches'] loop
  execute format('create trigger touch before update on packaging.%I for each row execute function packaging.touch()',t);
 end loop;
 foreach t in array array['movements','counts','inspections','activity','import_batches'] loop
  execute format('create trigger immutable before update or delete on packaging.%I for each row execute function packaging.immutable()',t);
 end loop;
end $$;
create view packaging.entries as
 select id movement_id,item_id,to_id location_id,quantity::bigint quantity,moved_on from packaging.movements
 union all select id,item_id,from_id,-quantity::bigint,moved_on from packaging.movements;
create view packaging.balances as
 select l.id location_id,l.code location,l.name,l.kind,l.owner,i.id item_id,i.code item,i.food_contact,
 sum(e.quantity)::bigint quantity,max(e.moved_on) last_movement
 from packaging.entries e join packaging.locations l on l.id=e.location_id join packaging.items i on i.id=e.item_id
 group by l.id,i.id;
create view packaging.returns_due as
 select m.id,m.reference,l.code partner,l.owner,i.code item,m.moved_on,m.due_on,m.quantity issued,
 coalesce(a.quantity,0)::bigint returned,(m.quantity-coalesce(a.quantity,0))::bigint outstanding,
 case when m.due_on is null then 'no due date' when m.due_on<current_date then 'overdue' else 'scheduled' end state
 from packaging.movements m join packaging.locations l on l.id=m.to_id join packaging.locations f on f.id=m.from_id
 join packaging.items i on i.id=m.item_id
 left join lateral(select sum(quantity) quantity from packaging.allocations where issue_id=m.id and void_reason is null) a on true
 where f.kind='internal' and l.kind='partner' and m.reversal_of is null
 and not exists(select 1 from packaging.movements where reversal_of=m.id) and m.quantity>coalesce(a.quantity,0);
create view packaging.reconciliations as
 select c.id,l.code location,i.code item,c.counted_on,c.quantity counted,c.ledger_at_count,
 coalesce(e.quantity,0)::bigint ledger_now_for_date,(c.quantity-coalesce(e.quantity,0))::bigint variance,
 c.ledger_at_count<>coalesce(e.quantity,0) backdated_change,c.evidence_ref,c.actor
 from packaging.counts c join packaging.locations l on l.id=c.location_id join packaging.items i on i.id=c.item_id
 left join lateral(select sum(quantity) quantity from packaging.entries where location_id=c.location_id and item_id=c.item_id and moved_on<=c.counted_on) e on true;
create view packaging.hygiene as
 select b.location,b.item,b.quantity,l.country,p.checked_on,p.result,p.evidence_ref,
 case when nullif(btrim(i.suitability_ref),'') is null then 'suitability evidence missing'
 when p.id is null then 'inspection missing' when p.result<>'clean' then p.result
 when p.checked_on<current_date-30 then 'inspection stale' else 'recorded clean' end state
 from packaging.balances b join packaging.items i on i.id=b.item_id join packaging.locations l on l.id=b.location_id
 left join lateral(select * from packaging.inspections where location_id=b.location_id and item_id=b.item_id order by checked_on desc,created_at desc,id limit 1) p on true
 where b.food_contact and b.kind='internal' and b.quantity>0;
create view packaging.compliance as
 select 'MOV-01' rule,reference record,'Missing movement evidence' finding,'Internal traceability policy; supports NZ IRD / AU ATO record retention' basis
 from packaging.movements where nullif(btrim(evidence_ref),'') is null
 union all select 'ITEM-01',code,'Food-contact classification missing','Internal classification policy' from packaging.items where food_contact is null
 union all select 'LOC-01',code,'Classify location and assign owner','Internal accountability policy' from packaging.locations where kind<>'system' and (kind='unknown' or nullif(btrim(owner),'') is null or country is null)
 union all select 'BAL-01',location||' / '||item,'Negative balance: '||quantity,'Internal reconciliation policy' from packaging.balances where kind<>'system' and quantity<0
 union all select 'FOOD-01',location||' / '||item,state,case when country='AU' then 'FSANZ 3.2.2 clause 9; local evidence check' when country='NZ' then 'MPI food packaging guidance; local evidence check' else 'Local packaging suitability policy' end from packaging.hygiene where state<>'recorded clean'
 union all select 'CNT-01',location||' / '||item,'Count variance or backdated ledger change','Internal count reconciliation policy' from packaging.reconciliations where variance<>0 or backdated_change;
revoke all on all tables in schema packaging from public;
revoke all on all functions in schema packaging from public;
