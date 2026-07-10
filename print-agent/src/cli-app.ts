import { writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrintAgent } from "./agent/agent.js";
import { buildTestReceipt } from "./receipt/format.js";
import { renderReceiptPng } from "./receipt/render.js";
import {
  DEFAULT_CONFIG,
  getConfigPath,
  validateConfig,
  type AgentConfig,
} from "./config/config.js";
import {
  hasDeviceToken,
  readDeviceToken,
  readPlainConfigFile,
  storeDeviceToken,
  writePlainConfigFile,
} from "./config/credential-store.js";
import { createPrintProvider } from "./providers/index.js";
import { listWindowsPrinters } from "./providers/windows-spooler.js";
import { createFileLogger } from "./logging/file-logger.js";
import {
  collectStatusSnapshot,
} from "./services/status-service.js";
async function loadConfig(): Promise<AgentConfig> {
  try {
    const raw = await readPlainConfigFile();
    return validateConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function cmdSetup(): Promise<void> {
  const rl = createInterface({ input, output });

  console.log("إعداد وكيل الطباعة");
  console.log(`سيتم حفظ الإعدادات في: ${getConfigPath()}`);

  const apiBaseUrl =
    (await rl.question(`عنوان API [${DEFAULT_CONFIG.apiBaseUrl}]: `)) ||
    DEFAULT_CONFIG.apiBaseUrl;

  const windowsPrinterName =
    (await rl.question(
      `اسم الطابعة في Windows [${DEFAULT_CONFIG.windowsPrinterName}]: `
    )) || DEFAULT_CONFIG.windowsPrinterName;

  const printModeAnswer = await rl.question(
    "وضع الطباعة (windows/lan) [windows]: "
  );
  const printMode =
    printModeAnswer.trim() === "lan" ? "lan" : ("windows" as const);

  let lanHost = "";
  let lanPort = DEFAULT_CONFIG.lanPort;
  if (printMode === "lan") {
    lanHost = (await rl.question("عنوان IP للطابعة: ")).trim();
    const portAnswer = await rl.question(`منفذ LAN [${DEFAULT_CONFIG.lanPort}]: `);
    lanPort = portAnswer ? Number(portAnswer) : DEFAULT_CONFIG.lanPort;
  }

  const pollAnswer = await rl.question(
    `فترة الاستطلاع بالميلي ثانية [${DEFAULT_CONFIG.pollIntervalMs}]: `
  );
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
  console.log("شغّل: RestaurantPrintAgent.exe start");
}

async function cmdConfigure(): Promise<void> {
  const configPath = process.argv[3];
  const token = process.env.RPA_SETUP_TOKEN?.trim() ?? "";

  if (!configPath) {
    throw new Error("Usage: configure <config.json path>");
  }
  if (!token) {
    throw new Error("RPA_SETUP_TOKEN environment variable is required");
  }

  const raw = await readFile(configPath, "utf8");
  const config = validateConfig(JSON.parse(raw));
  await writePlainConfigFile(JSON.stringify(config, null, 2));
  await storeDeviceToken(token);
}

async function cmdStatusJson(): Promise<void> {
  const config = await loadConfig();
  const snapshot = await collectStatusSnapshot(config, {
    agentRunning: false,
  });
  process.stdout.write(JSON.stringify(snapshot));
}

async function cmdStart(): Promise<void> {
  const config = await loadConfig();
  const token = await readDeviceToken();

  if (!token) {
    throw new Error("لم يتم العثور على رمز الجهاز. شغّل: RestaurantPrintAgent.exe setup");
  }

  const logger = createFileLogger(process.env.RPA_SHOW_CONSOLE === "1");
  const agent = new PrintAgent(config, token, logger);
  const shutdown = () => {
    agent.requestShutdown();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await agent.start();
}

async function cmdTestPrint(): Promise<void> {
  const config = await loadConfig();
  const provider = createPrintProvider(config);
  await provider.testPrint();
  console.log(
    `تم إرسال صفحة اختبار 80mm (عرض ${config.receiptWidthPx}px) إلى الطابعة`
  );
}

async function cmdRenderSample(): Promise<void> {
  const config = await loadConfig();
  const outPath = process.argv[3] ?? "receipt-sample.png";
  const png = renderReceiptPng(buildTestReceipt(), config.receiptWidthPx);
  await writeFile(outPath, png);
  console.log(
    `تم إنشاء معاينة الإيصال (${config.receiptWidthPx}px): ${outPath}`
  );
}

async function cmdStatus(): Promise<void> {
  const config = await loadConfig();
  const tokenStored = await hasDeviceToken();
  const provider = createPrintProvider(config);
  const printerStatus = await provider.checkStatus();

  console.log("حالة وكيل الطباعة");
  console.log(`API: ${config.apiBaseUrl}`);
  console.log(`الوضع: ${config.printMode}`);
  console.log(`الطابعة: ${config.windowsPrinterName}`);
  console.log(`عرض الإيصال: ${config.receiptWidthPx}px`);
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
    } catch {
      console.log("تعذر سرد الطابعات");
    }
  }
}

export async function runCli(commandArg?: string): Promise<void> {
  const command = commandArg ?? process.argv[2] ?? "help";

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
    case "render-sample":
      await cmdRenderSample();
      break;
    case "status":
      await cmdStatus();
      break;
    case "status-json":
      await cmdStatusJson();
      break;
    case "configure":
      await cmdConfigure();
      break;
    default:
      console.log(`الأوامر المتاحة:
  setup          إعداد الإعدادات وحفظ الرمز
  configure      إعداد غير تفاعلي (يتطلب RPA_SETUP_TOKEN)
  start          تشغيل وكيل الطباعة
  test-print     طباعة صفحة اختبار 80mm (صورة)
  render-sample  إنشاء معاينة PNG للإيصال بدون طباعة [المسار]
  status         عرض الحالة
  status-json    عرض الحالة بصيغة JSON`);  }
}
