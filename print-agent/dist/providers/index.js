import { EscPosLanProvider } from "./escpos-lan.js";
import { WindowsSpoolerProvider } from "./windows-spooler.js";
export function createPrintProvider(config) {
    if (config.printMode === "lan") {
        if (!config.lanHost) {
            throw new Error("وضع LAN مفعّل لكن lanHost غير مضبوط");
        }
        return new EscPosLanProvider(config.lanHost, config.lanPort);
    }
    return new WindowsSpoolerProvider(config.windowsPrinterName);
}
