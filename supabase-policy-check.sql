-- Run AFTER supabase-schema.sql and creating private.shop_owner.
-- All fixtures are rolled back. A failed assertion aborts this transaction.
begin;
select set_config('dms.test_owner', coalesce((select user_id::text from private.shop_owner), ''), true);
do $$ begin
 if current_setting('dms.test_owner') = '' then raise exception 'Create your shop owner first'; end if;
end $$;
insert into public.products(id,brand,name,category,price,image,description,details,visible)
values ('policy-test-visible','Test','Visible','Skincare',100,'assets/test.png','Test','Test',true),
 ('policy-test-hidden','Test','Hidden','Skincare',null,'assets/test.png','Test','Test',false);
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 if not exists(select 1 from public.products where id='policy-test-visible') then raise exception 'Public read failed'; end if;
 if exists(select 1 from public.products where id='policy-test-hidden') then raise exception 'Hidden product leaked'; end if;
 begin
  insert into public.products(id,brand,name,category,image,description,details) values ('policy-test-anon','Test','Bad','Skincare','assets/test.png','Test','Test');
  raise exception 'Anonymous insert was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
do $$ declare affected integer; begin
 if public.is_shop_admin() then raise exception 'Unapproved user is an admin'; end if;
 if exists(select 1 from public.products where id='policy-test-hidden') then raise exception 'Hidden product leaked to non-owner'; end if;
 update public.products set name='Bad' where id='policy-test-visible';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Non-owner update was allowed'; end if;
 begin
  insert into public.products(id,brand,name,category,image,description,details) values ('policy-test-nonowner','Test','Bad','Skincare','assets/test.png','Test','Test');
  raise exception 'Non-owner insert was allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into private.shop_owner(singleton,user_id) values(true,'00000000-0000-0000-0000-000000000000');
  raise exception 'Self-promotion was allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('dms.test_owner'),true);
do $$ declare affected integer; begin
 if not public.is_shop_admin() then raise exception 'Owner was rejected'; end if;
 if not exists(select 1 from public.products where id='policy-test-hidden') then raise exception 'Owner cannot read hidden product'; end if;
 update public.products set name='Owner edit' where id='policy-test-hidden' and version=1;
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'Owner update failed'; end if;
 if not exists(select 1 from public.products where id='policy-test-hidden' and version=2) then raise exception 'Version did not advance'; end if;
 update public.products set name='Stale edit' where id='policy-test-hidden' and version=1;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Stale update was allowed'; end if;
 delete from public.products where id='policy-test-hidden';
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'Owner delete failed'; end if;
end $$;
reset role;
rollback;
select 'PASS: public reads, hidden visibility, owner-only writes, self-promotion denial and stale-update protection and owner deletion' as result;
