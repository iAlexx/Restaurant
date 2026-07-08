# Phase 5 — Windows Setup (PowerShell)

## 1. تثبيت Node.js 20

تحميل من https://nodejs.org وتثبيت LTS.

تحقق:

```powershell
node --version
npm --version
```

## 2. تثبيت Print Agent

```powershell
cd C:\Users\Master` aLEX\Desktop\Restaurant\print-agent
npm install
npm run build
```

## 3. إعداد الوكيل

```powershell
node dist/cli.js setup
```

عند الطلب:
- **API:** `https://alnkha.site`
- **Printer:** `POSPrinter POS80`
- **Mode:** `windows`
- **Poll:** `4000`
- **Token:** الصق الرمز من لوحة الإدارة (يُعرض مرة واحدة فقط)

## 4. طباعة اختبار

```powershell
node dist/cli.js test-print
```

## 5. تشغيل الوكيل

```powershell
node dist/cli.js start
```

## 6. Task Scheduler — تشغيل تلقائي عند تسجيل الدخول

```powershell
$taskName = "RestaurantPrintAgent"
$nodePath = (Get-Command node).Source
$agentDir = "C:\Users\Master aLEX\Desktop\Restaurant\print-agent"
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "dist\cli.js start" -WorkingDirectory $agentDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Restaurant Print Agent auto-start"
```

تشغيل يدوي:

```powershell
Start-ScheduledTask -TaskName "RestaurantPrintAgent"
```

إيقاف:

```powershell
Stop-ScheduledTask -TaskName "RestaurantPrintAgent"
```

## 7. التحقق

```powershell
node dist/cli.js status
```

في لوحة الإدارة → الإعدادات → أجهزة الطباعة:
- آخر نبضة يجب أن تتحدث كل بضع ثوانٍ
- عند فشل الطباعة يظهر آخر خطأ

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| رمز مرفوض 401 | أنشئ رمزاً جديداً أو تحقق من عدم إلغاء الجهاز |
| الطابعة غير جاهزة | تحقق من اسم `POSPrinter POS80` في إعدادات Windows |
| لا توجد مهام | أنشئ طلباً من القائمة أو يدوياً من الكاشير |
| مهمة عالقة PRINTING | تُستعاد تلقائياً بعد دقيقتين |
