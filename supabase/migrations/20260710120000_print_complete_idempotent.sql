-- Idempotent print job completion: safe to acknowledge success more than once.

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
  IF EXISTS (
    SELECT 1
    FROM public.print_jobs
    WHERE id = p_job_id
      AND device_id = p_device_id
      AND status = 'PRINTED'
  ) THEN
    RETURN true;
  END IF;

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

REVOKE ALL ON FUNCTION public.complete_print_job(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_print_job(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_print_job(uuid, uuid) TO service_role;
