import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { buildTestReceipt } from "../receipt/format.js";
import { renderReceiptPng } from "../receipt/render.js";
const execFileAsync = promisify(execFile);
// Prints an image at full printable width with zero margins via the Windows
// spooler (System.Drawing.Printing). The driver's end-of-document behavior
// keeps auto-cut working. Printer name + image path are passed through the
// environment to avoid any string interpolation issues.
const PRINT_IMAGE_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$printerName = $env:RPA_PRINTER_NAME
$imgPath = $env:RPA_IMAGE_PATH
$img = [System.Drawing.Image]::FromFile($imgPath)
try {
  $doc = New-Object System.Drawing.Printing.PrintDocument
  $doc.PrinterSettings.PrinterName = $printerName
  if (-not $doc.PrinterSettings.IsValid) { throw "printer not valid: $printerName" }
  $doc.DocumentName = 'Receipt'
  $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
  $doc.OriginAtMargins = $true
  $handler = {
    param($sender, $e)
    $areaW = $e.PageSettings.PrintableArea.Width
    if ($areaW -le 0) { $areaW = $e.MarginBounds.Width }
    if ($areaW -le 0) { $areaW = $e.PageBounds.Width }
    $scale = $areaW / $img.Width
    $targetW = [int]$areaW
    $targetH = [int][math]::Round($img.Height * $scale)
    $e.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $e.Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $rect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH
    $e.Graphics.DrawImage($img, $rect)
    $e.HasMorePages = $false
  }
  $doc.add_PrintPage($handler)
  $doc.Print()
} finally {
  $img.Dispose()
}
`;
export class WindowsSpoolerProvider {
    printerName;
    receiptWidthPx;
    constructor(printerName, receiptWidthPx = 576) {
        this.printerName = printerName;
        this.receiptWidthPx = receiptWidthPx;
    }
    async checkStatus() {
        if (process.platform !== "win32") {
            return "error";
        }
        try {
            const script = `Get-Printer -Name $env:RPA_PRINTER_NAME | Select-Object -ExpandProperty PrinterStatus`;
            await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { env: { ...process.env, RPA_PRINTER_NAME: this.printerName } });
            return "ready";
        }
        catch {
            return "offline";
        }
    }
    async print(receiptPayload) {
        const png = renderReceiptPng(receiptPayload, this.receiptWidthPx);
        await this.printImage(png);
    }
    async testPrint() {
        await this.print(buildTestReceipt());
    }
    async printImage(png) {
        if (process.platform !== "win32") {
            throw new Error("طباعة Windows متاحة على Windows فقط");
        }
        const dir = await mkdtemp(join(tmpdir(), "restaurant-print-"));
        const imagePath = join(dir, "receipt.png");
        try {
            await writeFile(imagePath, png);
            await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", PRINT_IMAGE_SCRIPT], {
                env: {
                    ...process.env,
                    RPA_PRINTER_NAME: this.printerName,
                    RPA_IMAGE_PATH: imagePath,
                },
            });
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
