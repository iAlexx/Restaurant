# Restaurant QR Ordering System

Arabic RTL QR ordering MVP for one restaurant branch.

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind)
- Supabase (PostgreSQL, Auth, Storage)

## Setup

1. Copy `.env.example` to `.env.local` and fill Supabase credentials.
2. Install dependencies:

```bash
npm install
```

3. Apply database migration in Supabase SQL Editor or via CLI:

```bash
supabase db push
```

Apply migrations:
- `supabase/migrations/20260708120000_initial_schema.sql`
- `supabase/migrations/20260708130000_storage_menu_bucket.sql`

4. Create staff users in Supabase Auth, then insert profiles:

```sql
INSERT INTO public.profiles (id, role, display_name)
VALUES
  ('<admin-user-uuid>', 'ADMIN', 'المدير'),
  ('<cashier-user-uuid>', 'CASHIER', 'الكاشير');
```

5. Run development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run test` — unit tests
- `npm run lint` — ESLint

## Phase 1 (complete)

- Next.js RTL shell, auth, dashboard layout, full DB schema + RLS

## Phase 2 (complete)

- Categories, add-ons, products CRUD (admin)
- Product image upload to Supabase Storage (`menu` bucket)
- Tables CRUD with secure tokens + QR PNG download
- Restaurant settings (integer SYP fees, currency label, toggles)
- Print device token generate/revoke (for Windows Print Agent, Phase 5)

## Phase 3 (complete)

- Public dine-in menu `/t/[token]` with table validation
- Public external ordering `/order` (delivery + pickup)
- Customer cart, checkout, integer SYP display
- `POST /api/orders` with server validation, snapshots, idempotency
- Order number generation via `next_order_number()` RPC
- PENDING print job on each order
- WhatsApp deep-link success flow for delivery/pickup
- Rate limiting on order creation

Apply migration: `supabase/migrations/20260708140000_order_number_function.sql`

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is server-only (image upload, print agent API later).
- Never embed service role key in Windows Print Agent distributable; use device tokens.
