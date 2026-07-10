-- Add optional category image for customer menu tiles
alter table public.categories
  add column if not exists image_url text;

comment on column public.categories.image_url is 'Public URL for category tile image in customer menu';
