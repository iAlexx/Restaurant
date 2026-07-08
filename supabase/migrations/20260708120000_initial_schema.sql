-- Restaurant QR Ordering MVP — initial schema
-- All monetary values: INTEGER whole SYP

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER');

CREATE TYPE order_type AS ENUM ('DINE_IN', 'DELIVERY', 'PICKUP');

CREATE TYPE order_status AS ENUM (
  'NEW',
  'WAITING_WHATSAPP_CONFIRMATION',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE print_job_status AS ENUM (
  'PENDING',
  'PRINTING',
  'PRINTED',
  'FAILED'
);

-- ---------------------------------------------------------------------------
-- Helper: staff check
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'CASHIER')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role user_role NOT NULL,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- restaurant_settings (singleton)
-- ---------------------------------------------------------------------------

CREATE TABLE public.restaurant_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'مطعمي',
  logo_url text,
  phone text,
  whatsapp_phone text,
  address text,
  currency_label text NOT NULL DEFAULT 'ل.س',
  opening_hours text,
  delivery_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  default_delivery_fee integer NOT NULL DEFAULT 0 CHECK (default_delivery_fee >= 0),
  min_delivery_order integer NOT NULL DEFAULT 0 CHECK (min_delivery_order >= 0),
  receipt_header text,
  receipt_footer text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.restaurant_settings (id) VALUES (1);

-- Public view: customer-facing settings only
CREATE VIEW public.restaurant_settings_public AS
SELECT
  name,
  logo_url,
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

-- ---------------------------------------------------------------------------
-- tables (dine-in)
-- ---------------------------------------------------------------------------

CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  public_token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tables_is_active_idx ON public.tables (is_active);

-- ---------------------------------------------------------------------------
-- menu
-- ---------------------------------------------------------------------------

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX categories_active_sort_idx ON public.categories (is_active, sort_order);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  name_ar text NOT NULL,
  description_ar text,
  image_url text,
  price integer NOT NULL CHECK (price >= 0),
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_category_available_sort_idx
  ON public.products (category_id, is_available, sort_order);

CREATE TABLE public.add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  extra_price integer NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_add_ons (
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  add_on_id uuid NOT NULL REFERENCES public.add_ons (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, add_on_id)
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  order_type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'NEW',
  table_id uuid REFERENCES public.tables (id) ON DELETE SET NULL,
  table_label_snapshot text,
  customer_name text,
  customer_phone text,
  customer_address text,
  location_url text,
  pickup_time text,
  notes text,
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  delivery_fee integer NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total integer NOT NULL CHECK (total >= 0),
  cancellation_reason text,
  submit_token text NOT NULL UNIQUE,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX orders_created_at_idx ON public.orders (created_at);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  unit_price_snapshot integer NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total integer NOT NULL CHECK (line_total >= 0),
  notes text
);

CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);

CREATE TABLE public.order_item_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items (id) ON DELETE CASCADE,
  add_on_id uuid REFERENCES public.add_ons (id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  price_snapshot integer NOT NULL DEFAULT 0 CHECK (price_snapshot >= 0)
);

CREATE INDEX order_item_add_ons_order_item_id_idx
  ON public.order_item_add_ons (order_item_id);

CREATE TABLE public.daily_order_counters (
  date date PRIMARY KEY,
  last_seq integer NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- printing
-- ---------------------------------------------------------------------------

CREATE TABLE public.print_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_heartbeat_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  status print_job_status NOT NULL DEFAULT 'PENDING',
  is_reprint boolean NOT NULL DEFAULT false,
  device_id uuid REFERENCES public.print_devices (id) ON DELETE SET NULL,
  error_message text,
  claimed_at timestamptz,
  printed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX print_jobs_pending_printing_idx
  ON public.print_jobs (status, created_at)
  WHERE status IN ('PENDING', 'PRINTING');

-- ---------------------------------------------------------------------------
-- updated_at trigger for orders
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_order_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- 1) Menu read (anon + authenticated)
CREATE POLICY menu_categories_read ON public.categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY menu_products_read ON public.products
  FOR SELECT
  USING (is_available = true);

CREATE POLICY menu_add_ons_read ON public.add_ons
  FOR SELECT
  USING (is_available = true);

CREATE POLICY menu_product_add_ons_read ON public.product_add_ons
  FOR SELECT
  USING (true);

-- 2) Settings read (public view)
-- Views inherit RLS from base table; grant SELECT on view via policy on base for public columns
CREATE POLICY settings_public_read ON public.restaurant_settings
  FOR SELECT
  USING (true);

-- 3) Profiles: own row
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 4) Staff orders: read and update
CREATE POLICY orders_staff_select ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY orders_staff_update ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY order_items_staff_select ON public.order_items
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY order_item_add_ons_staff_select ON public.order_item_add_ons
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- 5) Deny public writes — no INSERT/UPDATE/DELETE policies for anon on sensitive tables.
-- Service role (API routes) bypasses RLS for writes.

-- Staff can read tables for dashboard
CREATE POLICY tables_staff_select ON public.tables
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Admin read full settings (same as public read for MVP; admin writes via API)
CREATE POLICY tables_staff_all ON public.tables
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_admin_all ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_admin_all ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY add_ons_admin_all ON public.add_ons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_add_ons_admin_all ON public.product_add_ons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY restaurant_settings_admin_update ON public.restaurant_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY print_devices_admin_all ON public.print_devices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY print_jobs_staff_select ON public.print_jobs
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Grant view access
GRANT SELECT ON public.restaurant_settings_public TO anon, authenticated;
