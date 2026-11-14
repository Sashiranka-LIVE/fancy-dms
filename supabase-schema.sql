-- Run once in a NEW Supabase project's SQL Editor as the project owner.
-- The private singleton table permits exactly one approved shop owner.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.shop_owner (
 singleton boolean primary key default true check (singleton),
 user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table private.shop_owner enable row level security;
revoke all on private.shop_owner from public, anon, authenticated;
create or replace function public.is_shop_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from private.shop_owner where user_id = (select auth.uid())); $$;
revoke all on function public.is_shop_admin() from public;
grant execute on function public.is_shop_admin() to anon, authenticated;

create table if not exists public.products (
 id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
 brand text not null check(length(btrim(brand)) between 1 and 80),
 name text not null check(length(btrim(name)) between 1 and 120),
 category text not null check(category in ('Skincare','Haircare','Body care','Beauty supplements')),
 price numeric(12,2) check(price > 0 and price <= 10000000),
 image text not null check(length(image) between 1 and 1024),
 description text not null check(length(btrim(description)) between 1 and 180),
 details text not null check(length(btrim(details)) between 1 and 1600),
 shot text check(shot in ('0% 0%','50% 0%','100% 0%','0% 100%','50% 100%','100% 100%')),
 cutout boolean not null default true,
 visible boolean not null default false,
 sort_order integer not null default 0 check(sort_order between 0 and 99999),
 version integer not null default 1 check(version > 0),
 updated_at timestamptz not null default now(),
 check(shot is null or cutout = false)
);
alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert(id,brand,name,category,price,image,description,details,shot,cutout,visible,sort_order) on public.products to authenticated;
grant update(brand,name,category,price,image,description,details,shot,cutout,visible,sort_order) on public.products to authenticated;
-- Product deletion is owner-only and requires explicit confirmation in the manager.
grant delete on public.products to authenticated;
drop policy if exists "Visible products or owner" on public.products;
create policy "Visible products or owner" on public.products for select to anon, authenticated using (visible or (select public.is_shop_admin()));
drop policy if exists "Owner inserts products" on public.products;
create policy "Owner inserts products" on public.products for insert to authenticated with check ((select public.is_shop_admin()));
drop policy if exists "Owner updates products" on public.products;
create policy "Owner updates products" on public.products for update to authenticated using ((select public.is_shop_admin())) with check ((select public.is_shop_admin()));

create or replace function private.bump_product_version() returns trigger
language plpgsql set search_path = '' as $$
begin
 new.version := old.version + 1;
 new.updated_at := now();
 return new;
end; $$;
revoke all on function private.bump_product_version() from public, anon, authenticated;
drop trigger if exists product_version on public.products;
create trigger product_version before update on public.products for each row execute function private.bump_product_version();
create index if not exists products_display_order on public.products(visible,sort_order,id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/png','image/webp'];
-- Public bucket files are visible by URL. Never upload private documents here.
-- Replacements use new filenames; no overwrite/delete permissions are granted.
drop policy if exists "Owner uploads product images" on storage.objects;
create policy "Owner uploads product images" on storage.objects for insert to authenticated
with check (bucket_id='product-images' and (select public.is_shop_admin()) and name ~ '^[a-f0-9-]+\.(png|webp)$');
commit;
