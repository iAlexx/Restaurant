-- Configurable restaurant charges (taxes & fees)

CREATE TABLE public.restaurant_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  calculation_type text NOT NULL CHECK (calculation_type IN ('PERCENTAGE', 'FIXED')),
  value integer NOT NULL CHECK (value >= 0),
  is_active boolean NOT NULL DEFAULT true,
  applies_to text NOT NULL DEFAULT 'ALL' CHECK (
    applies_to IN ('ALL', 'DINE_IN', 'DELIVERY', 'PICKUP')
  ),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_charges_percentage_max CHECK (
    calculation_type <> 'PERCENTAGE' OR value <= 10000
  )
);

CREATE INDEX restaurant_charges_active_sort_idx
  ON public.restaurant_charges (is_active, sort_order);

CREATE TABLE public.order_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  charge_id uuid REFERENCES public.restaurant_charges (id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  calculation_type_snapshot text NOT NULL CHECK (
    calculation_type_snapshot IN ('PERCENTAGE', 'FIXED')
  ),
  value_snapshot integer NOT NULL CHECK (value_snapshot >= 0),
  calculated_amount integer NOT NULL CHECK (calculated_amount >= 0),
  sort_order_snapshot integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_charges_order_id_idx ON public.order_charges (order_id);

CREATE TRIGGER restaurant_charges_updated_at
  BEFORE UPDATE ON public.restaurant_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.restaurant_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY restaurant_charges_public_read ON public.restaurant_charges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY restaurant_charges_admin_all ON public.restaurant_charges
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY order_charges_staff_select ON public.order_charges
  FOR SELECT
  TO authenticated
  USING (public.is_staff());
