import { Socket } from "node:net";
import { buildTestReceipt, formatReceiptText } from "../receipt/format.js";
import type { PrintProvider, PrinterStatus, ReceiptPayload } from "./types.js";

export class EscPosLanProvider implements PrintProvider {
  constructor(
    private readonly host: string,
    private readonly port: number
  ) {}

  async checkStatus(): Promise<PrinterStatus> {
    if (!this.host) {
      return "offline";
    }

    return new Promise((resolve) => {
      const socket = new Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve("offline");
      }, 3000);

      socket.connect(this.port, this.host, () => {
        clearTimeout(timeout);
        socket.end();
        resolve("ready");
      });

      socket.on("error", () => {
        clearTimeout(timeout);
        resolve("offline");
      });
    });
  }

  async print(receiptPayload: ReceiptPayload): Promise<void> {
    if (!this.host) {
      throw new Error("لم يتم ضبط عنوان الطابعة الشبكية (lanHost)");
    }

    const text = formatReceiptText(receiptPayload);
    const payload = Buffer.from(text, "utf8");

    await new Promise<void>((resolve, reject) => {
      const socket = new Socket();
      const chunks: Buffer[] = [];

      socket.connect(this.port, this.host, () => {
        chunks.push(Buffer.from([0x1b, 0x40]));
        chunks.push(payload);
        chunks.push(Buffer.from([0x1d, 0x56, 0x00]));
        socket.write(Buffer.concat(chunks));
        socket.end();
      });

      socket.on("error", reject);
      socket.on("close", () => resolve());
    });
  }

  async testPrint(): Promise<void> {
    await this.print(buildTestReceipt());
  }
}
