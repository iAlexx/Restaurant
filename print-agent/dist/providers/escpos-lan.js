import { Socket } from "node:net";
import { buildTestReceipt, formatReceiptText } from "../receipt/format.js";
export class EscPosLanProvider {
    host;
    port;
    constructor(host, port) {
        this.host = host;
        this.port = port;
    }
    async checkStatus() {
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
    async print(receiptPayload) {
        if (!this.host) {
            throw new Error("لم يتم ضبط عنوان الطابعة الشبكية (lanHost)");
        }
        const text = formatReceiptText(receiptPayload);
        const payload = Buffer.from(text, "utf8");
        await new Promise((resolve, reject) => {
            const socket = new Socket();
            const chunks = [];
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
    async testPrint() {
        await this.print(buildTestReceipt());
    }
}
