-- Phase 5: Print Agent atomic job operations (service_role only)

CREATE OR REPLACE FUNCTION public.reset_stale_print_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.print_jobs
  SET
    status = 'PENDING',
    device_id = NULL,
    claimed_at = NULL,
    error_message = 'تمت استعادة مهمة طباعة عالقة'
  WHERE status = 'PRINTING'
    AND claimed_at IS NOT NULL
    AND claimed_at < now() - interval '2 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_print_job(p_device_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.print_jobs%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.print_devices
    WHERE id = p_device_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'device inactive or not found';
  END IF;

  PERFORM public.reset_stale_print_jobs();

  SELECT pj.*
  INTO v_job
  FROM public.print_jobs pj
  WHERE pj.status = 'PENDING'
  ORDER BY pj.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.print_jobs
  SET
    status = 'PRINTING',
    device_id = p_device_id,
    claimed_at = now(),
    error_message = NULL
  WHERE id = v_job.id
    AND status = 'PENDING'
  RETURNING * INTO v_job;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'job_id', v_job.id,
    'order_id', v_job.order_id,
    'is_reprint', v_job.is_reprint
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_print_job(
  p_job_id uuid,
  p_device_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated uuid;
BEGIN
  UPDATE public.print_jobs
  SET
    status = 'PRINTED',
    printed_at = now(),
    error_message = NULL
  WHERE id = p_job_id
    AND device_id = p_device_id
    AND status = 'PRINTING'
  RETURNING id INTO v_updated;

  RETURN v_updated IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_print_job(
  p_job_id uuid,
  p_device_id uuid,
  p_error_message text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated uuid;
BEGIN
  UPDATE public.print_jobs
  SET
    status = 'FAILED',
    error_message = NULLIF(p_error_message, '')
  WHERE id = p_job_id
    AND device_id = p_device_id
    AND status = 'PRINTING'
  RETURNING id INTO v_updated;

  IF v_updated IS NOT NULL THEN
    UPDATE public.print_devices
    SET last_error = NULLIF(p_error_message, '')
    WHERE id = p_device_id;
  END IF;

  RETURN v_updated IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.print_agent_heartbeat(p_device_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.print_devices
    WHERE id = p_device_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'device inactive or not found';
  END IF;

  UPDATE public.print_devices
  SET last_heartbeat_at = now()
  WHERE id = p_device_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_stale_print_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_print_job(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_print_job(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_print_job(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.print_agent_heartbeat(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.reset_stale_print_jobs() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_print_job(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_print_job(uuid, uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_print_job(uuid, uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.print_agent_heartbeat(uuid) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reset_stale_print_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_print_job(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_print_job(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_print_job(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.print_agent_heartbeat(uuid) TO service_role;
