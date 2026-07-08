import { execFile, spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { buildTestReceipt, formatReceiptText } from "../receipt/format.js";
const execFileAsync = promisify(execFile);
export class WindowsSpoolerProvider {
    printerName;
    constructor(printerName) {
        this.printerName = printerName;
    }
    async checkStatus() {
        if (process.platform !== "win32") {
            return "error";
        }
        try {
            const script = `Get-Printer -Name '${this.printerName.replace(/'/g, "''")}' | Select-Object -ExpandProperty PrinterStatus`;
            await execFileAsync("powershell.exe", [
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script,
            ]);
            return "ready";
        }
        catch {
            return "offline";
        }
    }
    async print(receiptPayload) {
        const text = formatReceiptText(receiptPayload);
        await this.printRawText(text);
    }
    async testPrint() {
        await this.print(buildTestReceipt());
    }
    async printRawText(text) {
        if (process.platform !== "win32") {
            throw new Error("طباعة Windows متاحة على Windows فقط");
        }
        const dir = await mkdtemp(join(tmpdir(), "restaurant-print-"));
        const filePath = join(dir, "receipt.txt");
        try {
            const bom = "\uFEFF";
            await writeFile(filePath, bom + text, "utf8");
            const script = `
$printer = '${this.printerName.replace(/'/g, "''")}'
$path = '${filePath.replace(/'/g, "''")}'
Get-Content -LiteralPath $path -Encoding UTF8 | Out-Printer -Name $printer
`;
            await execFileAsync("powershell.exe", [
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script,
            ]);
        }
        finally {
            await rm(dir, { recursive: true, force: true });
        }
    }
}
export async function listWindowsPrinters() {
    if (process.platform !== "win32")
        return [];
    const { stdout } = await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-Printer | Select-Object -ExpandProperty Name",
    ]);
    return stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}
export function spawnDetachedAgent() {
    if (process.platform !== "win32")
        return;
    const child = spawn(process.execPath, [process.argv[1], "start"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
    });
    child.unref();
}
