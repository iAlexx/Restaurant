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

**المخرجات (بعد البناء المحلي — غير مُتتبَّعة في git):**

| الملف | المسار |
|---|---|
| **مثبّت Windows (Inno Setup)** | `print-agent-desktop\release\RestaurantPrintSetup-x64.exe` |
| وكيل محمول فقط (Phase 0) | `print-agent\release\RestaurantPrintAgent-Portable-x64.zip` |

إذا لم تجد `RestaurantPrintSetup-x64.exe`، فأنت غالباً تنظر إلى `print-agent\release\` بدلاً من `print-agent-desktop\release\`. شغّل `build-installer.ps1` لإنشاء المثبّت.

### متطلبات جهاز التطوير

- Node.js 20+ (لبناء print-agent)
- .NET 8 SDK: `winget install Microsoft.DotNet.SDK.8`
- Inno Setup 6: `winget install --id JRSoftware.InnoSetup -e`

## بيانات المستخدم (لا تُحذف عند الترقية)

`%LOCALAPPDATA%\RestaurantPrint\`
