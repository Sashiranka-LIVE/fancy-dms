-- DMS Fancy Shop: enable owner-only product deletion and add Celimax Retinal Shot.
-- Run once in Supabase SQL Editor after the matching site image has deployed.
begin;
grant delete on public.products to authenticated;
drop policy if exists "Owner deletes products" on public.products;
create policy "Owner deletes products" on public.products
 for delete to authenticated using ((select public.is_shop_admin()));
insert into public.products (id,brand,name,category,price,image,description,details,cutout,visible,sort_order)
values ('celimax-retinal-shot','Celimax','Retinal Shot Tightening Booster','Skincare',6000,'assets/celimax-retinal-shot-clean.webp','Retinal Shot Tightening Booster · 20 g · Free delivery','Celimax Retinal Shot Tightening Booster, 20 g. LKR 6,000 with free delivery.',true,true,14)
on conflict (id) do nothing;
commit;
select id,brand,name,price,description,visible from public.products where id='celimax-retinal-shot';
