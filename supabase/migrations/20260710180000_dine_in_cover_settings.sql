-- Dine-in QR entry cover: hero image + welcome message (admin-managed)

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS welcome_message text;

DROP VIEW IF EXISTS public.restaurant_settings_public;

CREATE VIEW public.restaurant_settings_public AS
SELECT
  name,
  logo_url,
  hero_image_url,
  welcome_message,
  phone,
  address,
  currency_label,
  opening_hours,
  delivery_enabled,
  pickup_enabled,
  default_delivery_fee,
  min_delivery_order
FROM public.restaurant_settings
WHERE id = 1;

GRANT SELECT ON public.restaurant_settings_public TO anon, authenticated;
