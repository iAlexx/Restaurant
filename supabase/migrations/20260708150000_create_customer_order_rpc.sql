-- Atomic customer order creation (service_role only)
-- All inserts run in one transaction; any failure rolls back everything.

CREATE OR REPLACE FUNCTION public.create_customer_order(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.orders%ROWTYPE;
  v_submit_token text := p_payload ->> 'submit_token';
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_add_on jsonb;
  v_order_item_id uuid;
BEGIN
  IF v_submit_token IS NULL OR length(v_submit_token) < 10 THEN
    RAISE EXCEPTION 'invalid submit_token';
  END IF;

  -- Idempotency: return existing order if submit_token already used
  SELECT * INTO v_existing
  FROM public.orders
  WHERE submit_token = v_submit_token;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_existing.id,
      'order_number', v_existing.order_number,
      'order_type', v_existing.order_type,
      'status', v_existing.status,
      'subtotal', v_existing.subtotal,
      'delivery_fee', v_existing.delivery_fee,
      'total', v_existing.total,
      'existing', true
    );
  END IF;

  v_order_number := public.next_order_number();

  INSERT INTO public.orders (
    order_number,
    order_type,
    status,
    table_id,
    table_label_snapshot,
    customer_name,
    customer_phone,
    customer_address,
    location_url,
    pickup_time,
    notes,
    subtotal,
    delivery_fee,
    total,
    submit_token
  ) VALUES (
    v_order_number,
    (p_payload ->> 'order_type')::public.order_type,
    (p_payload ->> 'status')::public.order_status,
    NULLIF(p_payload ->> 'table_id', '')::uuid,
    NULLIF(p_payload ->> 'table_label_snapshot', ''),
    NULLIF(p_payload ->> 'customer_name', ''),
    NULLIF(p_payload ->> 'customer_phone', ''),
    NULLIF(p_payload ->> 'customer_address', ''),
    NULLIF(p_payload ->> 'location_url', ''),
    NULLIF(p_payload ->> 'pickup_time', ''),
    NULLIF(p_payload ->> 'notes', ''),
    (p_payload ->> 'subtotal')::integer,
    (p_payload ->> 'delivery_fee')::integer,
    (p_payload ->> 'total')::integer,
    v_submit_token
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload -> 'items', '[]'::jsonb))
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_snapshot,
      quantity,
      line_total,
      notes
    ) VALUES (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name_snapshot',
      (v_item ->> 'unit_price_snapshot')::integer,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'line_total')::integer,
      NULLIF(v_item ->> 'notes', '')
    )
    RETURNING id INTO v_order_item_id;

    IF v_item ? 'add_ons' AND jsonb_array_length(v_item -> 'add_ons') > 0 THEN
      FOR v_add_on IN
        SELECT value FROM jsonb_array_elements(v_item -> 'add_ons')
      LOOP
        INSERT INTO public.order_item_add_ons (
          order_item_id,
          add_on_id,
          name_snapshot,
          price_snapshot
        ) VALUES (
          v_order_item_id,
          NULLIF(v_add_on ->> 'add_on_id', '')::uuid,
          v_add_on ->> 'name_snapshot',
          (v_add_on ->> 'price_snapshot')::integer
        );
      END LOOP;
    END IF;
  END LOOP;

  INSERT INTO public.print_jobs (order_id, status, is_reprint)
  VALUES (v_order_id, 'PENDING', false);

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'order_type', p_payload ->> 'order_type',
    'status', p_payload ->> 'status',
    'subtotal', (p_payload ->> 'subtotal')::integer,
    'delivery_fee', (p_payload ->> 'delivery_fee')::integer,
    'total', (p_payload ->> 'total')::integer,
    'existing', false
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent duplicate submit_token: return the order that won the race
    SELECT * INTO v_existing
    FROM public.orders
    WHERE submit_token = v_submit_token;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'id', v_existing.id,
        'order_number', v_existing.order_number,
        'order_type', v_existing.order_type,
        'status', v_existing.status,
        'subtotal', v_existing.subtotal,
        'delivery_fee', v_existing.delivery_fee,
        'total', v_existing.total,
        'existing', true
      );
    END IF;

    RAISE;
END;
$$;

-- Only service_role may call this RPC (Next.js server path)
REVOKE ALL ON FUNCTION public.create_customer_order(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_customer_order(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.create_customer_order(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order(jsonb) TO service_role;
