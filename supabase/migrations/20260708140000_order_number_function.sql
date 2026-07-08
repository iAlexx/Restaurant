-- Atomic daily order number: DDMMYY-###

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Damascus')::date;
  v_seq integer;
  v_prefix text;
BEGIN
  INSERT INTO public.daily_order_counters AS c (date, last_seq)
  VALUES (v_date, 1)
  ON CONFLICT (date) DO UPDATE
  SET last_seq = c.last_seq + 1
  RETURNING last_seq INTO v_seq;

  v_prefix := to_char(v_date, 'DDMMYY');
  RETURN v_prefix || '-' || lpad(v_seq::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;
