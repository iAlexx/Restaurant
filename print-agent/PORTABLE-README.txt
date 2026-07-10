مطعم النخة — وكيل الطباعة المحمول (اختبار Phase 0)
=================================================

المحتويات:
- RestaurantPrintAgent.exe
- assets/fonts/Cairo-Regular.woff
- assets/fonts/Cairo-Bold.woff

لا يحتاج تثبيت Node.js أو npm أو ملفات المصدر.

الإعداد لأول مرة
-----------------
1. ثبّت تعريف طابعة Xprinter POS80 في Windows.
2. انسخ هذا المجلد إلى موقع دائم، مثال:
   C:\RestaurantPrintAgent\
3. افتح PowerShell أو CMD داخل المجلد.
4. شغّل:
   RestaurantPrintAgent.exe setup
5. أدخل:
   - عنوان API: https://alnkha.site
   - اسم الطابعة: POSPrinter POS80
   - رمز الجهاز من لوحة الإدارة
6. اختبر الطباعة:
   RestaurantPrintAgent.exe test-print
7. شغّل الوكيل في الخلفية:
   RestaurantPrintAgent.exe start

يتم حفظ الإعدادات في:
%LOCALAPPDATA%\RestaurantPrint\

الأوامر المفيدة
---------------
status         عرض الحالة
test-print     طباعة اختبار عربية
start          تشغيل الوكيل (بدون نافذة مرئية في وضع الإنتاج)

ملاحظات
-------
- يجب أن تبقى مجلد assets بجانب الملف التنفيذي.
- لا تشارك رمز الجهاز.
- عند التحديث لاحقاً، استبدل الملف التنفيذي فقط واحتفظ بمجلد
  %LOCALAPPDATA%\RestaurantPrint\
