# Windows Print Agent

وكيل طباعة خفيف لنظام طلبات المطعم — يعمل على Windows laptop للكاشير.

## المتطلبات

- Node.js 20+
- Windows 10/11
- طابعة: `POSPrinter POS80` (أو اسم الطابعة المضبوط في Windows)
- رمز جهاز من لوحة الإدارة → الإعدادات → أجهزة الطباعة

## التثبيت

```powershell
cd print-agent
npm install
npm run build
```

## الأوامر

```powershell
# إعداد أول مرة (يحفظ config.json + الرمز بشكل آمن)
node dist/cli.js setup

# طباعة اختبار
node dist/cli.js test-print

# عرض الحالة
node dist/cli.js status

# تشغيل الوكيل
node dist/cli.js start
```

## الإعداد المحلي

**ملف الإعدادات (غير حساس):**
`%USERPROFILE%\.restaurant-print\config.json`

```json
{
  "apiBaseUrl": "https://alnkha.site",
  "windowsPrinterName": "POSPrinter POS80",
  "printMode": "windows",
  "pollIntervalMs": 4000,
  "lanHost": "",
  "lanPort": 9100
}
```

**رمز الجهاز:** يُخزَّن مشفّراً عبر Windows DPAPI في:
`%USERPROFILE%\.restaurant-print\device-token.dpapi`

لا يُخزَّن الرمز الخام في `config.json`.

## أوضاع الطباعة

| الوضع | الوصف |
|-------|--------|
| `windows` | الطباعة عبر Windows spooler (الافتراضي — عربي مُختبر) |
| `lan` | ESC/POS عبر TCP منفذ 9100 (احتياطي — معطّل افتراضياً) |

## التشغيل التلقائي عند تسجيل الدخول

راجع `docs/PHASE5_WINDOWS_SETUP.md` لأوامر PowerShell و Task Scheduler.
