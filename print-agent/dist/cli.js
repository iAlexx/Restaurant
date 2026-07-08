#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrintAgent } from "./agent/agent.js";
import { DEFAULT_CONFIG, getConfigPath, validateConfig, } from "./config/config.js";
import { hasDeviceToken, readDeviceToken, readPlainConfigFile, storeDeviceToken, writePlainConfigFile, } from "./config/credential-store.js";
import { createPrintProvider } from "./providers/index.js";
import { listWindowsPrinters } from "./providers/windows-spooler.js";
async function loadConfig() {
    try {
        const raw = await readPlainConfigFile();
        return validateConfig(JSON.parse(raw));
    }
    catch {
        return DEFAULT_CONFIG;
    }
}
async function cmdSetup() {
    const rl = createInterface({ input, output });
    console.log("إعداد وكيل الطباعة");
    console.log(`سيتم حفظ الإعدادات في: ${getConfigPath()}`);
    const apiBaseUrl = (await rl.question(`عنوان API [${DEFAULT_CONFIG.apiBaseUrl}]: `)) ||
        DEFAULT_CONFIG.apiBaseUrl;
    const windowsPrinterName = (await rl.question(`اسم الطابعة في Windows [${DEFAULT_CONFIG.windowsPrinterName}]: `)) || DEFAULT_CONFIG.windowsPrinterName;
    const printModeAnswer = await rl.question("وضع الطباعة (windows/lan) [windows]: ");
    const printMode = printModeAnswer.trim() === "lan" ? "lan" : "windows";
    let lanHost = "";
    let lanPort = DEFAULT_CONFIG.lanPort;
    if (printMode === "lan") {
        lanHost = (await rl.question("عنوان IP للطابعة: ")).trim();
        const portAnswer = await rl.question(`منفذ LAN [${DEFAULT_CONFIG.lanPort}]: `);
        lanPort = portAnswer ? Number(portAnswer) : DEFAULT_CONFIG.lanPort;
    }
    const pollAnswer = await rl.question(`فترة الاستطلاع بالميلي ثانية [${DEFAULT_CONFIG.pollIntervalMs}]: `);
    const pollIntervalMs = pollAnswer
        ? Number(pollAnswer)
        : DEFAULT_CONFIG.pollIntervalMs;
    const token = await rl.question("الصق رمز جهاز الطباعة من لوحة الإدارة: ");
    const config = validateConfig({
        apiBaseUrl,
        windowsPrinterName,
        printMode,
        pollIntervalMs,
        lanHost,
        lanPort,
    });
    await writePlainConfigFile(JSON.stringify(config, null, 2));
    await storeDeviceToken(token.trim());
    rl.close();
    console.log("تم حفظ الإعدادات وتخزين الرمز بشكل آمن.");
    console.log("شغّل: npm run start -- start");
}
async function cmdStart() {
    const config = await loadConfig();
    const token = await readDeviceToken();
    if (!token) {
        console.error("لم يتم العثور على رمز الجهاز. شغّل: npm run start -- setup");
        process.exit(1);
    }
    const agent = new PrintAgent(config, token);
    const shutdown = () => {
        console.log("جاري الإيقاف...");
        agent.requestShutdown();
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    await agent.start();
}
async function cmdTestPrint() {
    const config = await loadConfig();
    const provider = createPrintProvider(config);
    await provider.testPrint();
    console.log("تم إرسال صفحة الاختبار إلى الطابعة");
}
async function cmdStatus() {
    const config = await loadConfig();
    const tokenStored = await hasDeviceToken();
    const provider = createPrintProvider(config);
    const printerStatus = await provider.checkStatus();
    console.log("حالة وكيل الطباعة");
    console.log(`API: ${config.apiBaseUrl}`);
    console.log(`الوضع: ${config.printMode}`);
    console.log(`الطابعة: ${config.windowsPrinterName}`);
    console.log(`الاستطلاع: ${config.pollIntervalMs}ms`);
    console.log(`الرمز المحفوظ: ${tokenStored ? "نعم" : "لا"}`);
    console.log(`حالة الطابعة: ${printerStatus}`);
    if (process.platform === "win32") {
        try {
            const printers = await listWindowsPrinters();
            console.log("طابعات Windows:");
            for (const name of printers) {
                console.log(`  - ${name}`);
            }
        }
        catch {
            console.log("تعذر سرد الطابعات");
        }
    }
}
async function main() {
    const command = process.argv[2] ?? "help";
    switch (command) {
        case "setup":
            await cmdSetup();
            break;
        case "start":
            await cmdStart();
            break;
        case "test-print":
            await cmdTestPrint();
            break;
        case "status":
            await cmdStatus();
            break;
        default:
            console.log(`الأوامر المتاحة:
  setup       إعداد الإعدادات وحفظ الرمز
  start       تشغيل وكيل الطباعة
  test-print  طباعة صفحة اختبار
  status      عرض الحالة`);
    }
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
