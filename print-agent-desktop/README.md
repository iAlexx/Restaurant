# مطعم النخة — وكيل الطباعة (Windows)

## المكوّنات

| الملف | الدور |
|---|---|
| `RestaurantPrintTray.exe` | أيقونة النظام، الإعداد، المراقبة |
| `RestaurantPrintAgent.exe` | محرك الطباعة (بدون Node.js) |
| `assets/fonts/` | خطوط Cairo العربية |

## بناء المثبّت

```powershell
cd print-agent-desktop
.\build-installer.ps1
```

المخرجات:
- `print-agent-desktop\release\RestaurantPrintSetup-x64.exe`

## المتطلبات على جهاز التطوير

- Node.js 20+ (لبناء print-agent فقط)
- .NET 8 SDK
- Inno Setup 6

## بيانات المستخدم (لا تُحذف عند الترقية)

`%LOCALAPPDATA%\RestaurantPrint\`
