insert into packaging.locations(id,code,name,kind,owner,country) values
('10000000-0000-4000-8000-000000000001','ORIGIN','Opening balance source','system',null,'NZ'),
('10000000-0000-4000-8000-000000000002','DEPOT','Harbour depot','internal','Mara','NZ'),
('10000000-0000-4000-8000-000000000003','BAY','Bay Produce','partner','Jules','NZ'),
('10000000-0000-4000-8000-000000000004','RIVER','River Foods','partner','Alex','AU'),
('10000000-0000-4000-8000-000000000005','WEST','West depot','internal','Ari','AU') on conflict do nothing;
insert into packaging.items(id,code,name,food_contact,suitability_ref) values
('20000000-0000-4000-8000-000000000001','PALLET','Standard pallet',false,null),
('20000000-0000-4000-8000-000000000002','CRATE','Reusable food crate',true,'SPEC-CRATE-01') on conflict do nothing;
insert into packaging.movements(id,reference,item_id,from_id,to_id,quantity,moved_on,due_on,evidence_ref,actor) values
('30000000-0000-4000-8000-000000000001','OPEN-PALLET','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',500,current_date-80,null,'OPEN-COUNT-P','Demo operator'),
('30000000-0000-4000-8000-000000000002','OPEN-CRATE','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',300,current_date-80,null,'OPEN-COUNT-C','Demo operator'),
('30000000-0000-4000-8000-000000000003','ISSUE-101','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003',120,current_date-30,current_date-16,'DOCKET-101','Demo operator'),
('30000000-0000-4000-8000-000000000004','RETURN-101','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002',40,current_date-10,null,'DOCKET-RET-101','Demo operator'),
('30000000-0000-4000-8000-000000000005','ISSUE-102','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004',100,current_date-20,current_date-6,null,'Demo operator'),
('30000000-0000-4000-8000-000000000006','ISSUE-103','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004',50,current_date-2,current_date+12,'DOCKET-103','Demo operator'),
('30000000-0000-4000-8000-000000000007','TRANSFER-WEST','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005',60,current_date-12,null,'TRANSFER-01','Demo operator') on conflict do nothing;
insert into packaging.allocations(id,issue_id,return_id,quantity,actor)
select '40000000-0000-4000-8000-000000000001'::uuid,'30000000-0000-4000-8000-000000000003'::uuid,'30000000-0000-4000-8000-000000000004'::uuid,40,'Demo operator'
where not exists(select 1 from packaging.allocations where id='40000000-0000-4000-8000-000000000001');
insert into packaging.counts(id,location_id,item_id,counted_on,quantity,ledger_at_count,evidence_ref,actor) values
('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001',current_date-1,76,80,'BAY-COUNT-01','Demo operator') on conflict do nothing;
insert into packaging.disputes(id,movement_id,title,owner,due_on,actor) values
('60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003','Four pallets not on partner count','Jules',current_date-3,'Demo operator') on conflict do nothing;
insert into packaging.inspections(id,location_id,item_id,checked_on,result,evidence_ref,actor,note) values
('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',current_date-45,'clean','WASH-OLD','Demo operator','Stale inspection to exercise attention'),
('70000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002',current_date-1,'quarantine','HOLD-01','Demo operator','Damaged rims awaiting physical review') on conflict do nothing;
