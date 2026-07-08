-- Allow anonymous (and authenticated) customers to resolve an ACTIVE table by
-- its public_token when scanning a QR code.
--
-- Root cause fixed here: fetchTableByToken() runs with the anon Supabase client,
-- but public.tables only had staff/admin SELECT policies (tables_staff_select,
-- tables_staff_all). Logged-out customers therefore always resolved to null and
-- saw the "invalid table" page. This policy mirrors the existing menu_*_read
-- pattern and is scoped to is_active = true so disabled tables stay hidden from
-- the public (and correctly fall back to the polished error page).
--
-- Additive only: no schema/column change, no change to writes (still service
-- role via API) or to staff visibility of inactive tables.

CREATE POLICY tables_public_read ON public.tables
  FOR SELECT
  USING (is_active = true);
