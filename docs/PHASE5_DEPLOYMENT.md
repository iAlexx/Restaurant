# Phase 5 — Deployment & Smoke Test

## Vercel Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | `https://alnkha.site` |

## Deployment Steps

### 1. Push to GitHub

```powershell
cd C:\Users\Master` aLEX\Desktop\Restaurant
git add .
git commit -m "Phase 5: Windows Print Agent + deployment"
git push origin main
```

### 2. Connect Vercel

1. https://vercel.com → New Project → Import Git Repository
2. Framework: Next.js (auto-detected)
3. Add environment variables above
4. Deploy

### 3. Custom Domain

1. Vercel → Project → Settings → Domains
2. Add `alnkha.site` and `www.alnkha.site`
3. Configure DNS at registrar per Vercel instructions
4. Confirm HTTPS (automatic via Vercel)

### 4. Apply Migration

```powershell
supabase db push
```

Migration: `supabase/migrations/20260708170000_print_agent_rpc.sql`

### 5. Verify QR Codes

QR codes use `NEXT_PUBLIC_SITE_URL`:
`https://alnkha.site/t/{table_token}`

Download a table QR from admin and confirm URL.

## Production Smoke Test Checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Admin login | Dashboard loads |
| 2 | Cashier login | Orders page only (+ reports) |
| 3 | Create category | Saved in admin |
| 4 | Create product | Visible on menu |
| 5 | Create table | QR downloads with alnkha.site URL |
| 6 | Dine-in order (QR) | Order created, PENDING print job |
| 7 | Delivery order | WAITING_WHATSAPP_CONFIRMATION + WhatsApp link |
| 8 | Pickup order | Same as delivery flow |
| 9 | Manual cashier order | CONFIRMED for delivery/pickup, NEW for dine-in |
| 10 | Status change | Valid transitions only |
| 11 | Cancel order | Reason required, status CANCELLED |
| 12 | Reprint | New print_jobs row, is_reprint=true |
| 13 | Daily report | Today's counts correct (Asia/Damascus) |
| 14 | Auto print | Print Agent claims and prints Arabic receipt |
| 15 | Arabic receipt | RTL text via Windows spooler |
| 16 | Duplicate submit | Same order returned (idempotent) |
| 17 | Print failure | Job FAILED, last_error on device |
| 18 | Revoked token | Agent gets 401 |

## Manual Actions Required

1. **GitHub:** Create repo and push (if not done)
2. **Vercel:** Connect repo, set env vars, deploy
3. **DNS:** Point alnkha.site and www to Vercel
4. **Supabase:** Apply `20260708170000_print_agent_rpc.sql` if not auto-applied
5. **Admin:** Generate print device token in Settings
6. **Windows laptop:** Run print-agent setup (see PHASE5_WINDOWS_SETUP.md)
7. **Windows:** Run test-print, then start agent
8. **Task Scheduler:** Register auto-start task
9. **Smoke test:** Run checklist above on production
