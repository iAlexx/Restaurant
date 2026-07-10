-- Structured opening hours (replaces free-text opening_hours as source of truth)

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS weekly_opening_hours jsonb NOT NULL DEFAULT '{
    "saturday":  [{ "open": "10:00", "close": "23:00" }],
    "sunday":    [{ "open": "10:00", "close": "23:00" }],
    "monday":    [{ "open": "10:00", "close": "23:00" }],
    "tuesday":   [{ "open": "10:00", "close": "23:00" }],
    "wednesday": [{ "open": "10:00", "close": "23:00" }],
    "thursday":  [{ "open": "10:00", "close": "23:00" }],
    "friday":    []
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS is_temporarily_closed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS temporary_closure_message text,
  ADD COLUMN IF NOT EXISTS manual_hours_override text
    CHECK (manual_hours_override IS NULL OR manual_hours_override IN ('open', 'closed')),
  ADD COLUMN IF NOT EXISTS manual_hours_override_until timestamptz;

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
  delivery_enabled,
  pickup_enabled,
  default_delivery_fee,
  min_delivery_order,
  weekly_opening_hours,
  is_temporarily_closed,
  temporary_closure_message,
  manual_hours_override,
  manual_hours_override_until
FROM public.restaurant_settings
WHERE id = 1;

GRANT SELECT ON public.restaurant_settings_public TO anon, authenticated;
