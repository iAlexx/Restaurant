import { PrintAgentApiClient } from "../api/client.js";
import { createPrintProvider } from "../providers/index.js";
const defaultLogger = {
    info: (message) => console.log(`[${new Date().toISOString()}] ${message}`),
    error: (message) => console.error(`[${new Date().toISOString()}] ${message}`),
};
export class PrintAgent {
    config;
    token;
    logger;
    running = false;
    printing = false;
    currentJobId = null;
    shutdownRequested = false;
    constructor(config, token, logger = defaultLogger) {
        this.config = config;
        this.token = token;
        this.logger = logger;
    }
    requestShutdown() {
        this.shutdownRequested = true;
    }
    isRunning() {
        return this.running;
    }
    async start() {
        if (this.running)
            return;
        this.running = true;
        this.shutdownRequested = false;
        const api = new PrintAgentApiClient(this.config.apiBaseUrl, this.token);
        const provider = createPrintProvider(this.config);
        this.logger.info(`بدء وكيل الطباعة — الوضع: ${this.config.printMode} — الفترة: ${this.config.pollIntervalMs}ms`);
        while (!this.shutdownRequested) {
            try {
                await api.heartbeat();
                const status = await provider.checkStatus();
                if (status !== "ready") {
                    this.logger.error("الطابعة غير جاهزة");
                }
                if (!this.printing) {
                    const claim = await api.claim();
                    if (claim) {
                        await this.processJob(api, provider, claim);
                    }
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "خطأ غير معروف في وكيل الطباعة";
                this.logger.error(message);
            }
            await sleep(this.config.pollIntervalMs);
        }
        this.running = false;
        this.logger.info("تم إيقاف وكيل الطباعة");
    }
    async processJob(api, provider, claim) {
        if (this.printing || this.currentJobId === claim.job_id) {
            return;
        }
        this.printing = true;
        this.currentJobId = claim.job_id;
        const label = claim.is_reprint ? "إعادة طباعة" : "طباعة";
        this.logger.info(`${label} — طلب ${claim.receipt.order_number}`);
        let lastError = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await provider.print(claim.receipt);
                await api.markSuccess(claim.job_id);
                this.logger.info(`تمت الطباعة بنجاح — ${claim.receipt.order_number}`);
                lastError = null;
                break;
            }
            catch (error) {
                lastError =
                    error instanceof Error ? error.message : "فشل الطباعة بدون تفاصيل";
                this.logger.error(attempt === 1
                    ? `فشل الطباعة — إعادة محاولة واحدة: ${lastError}`
                    : `فشل الطباعة النهائي: ${lastError}`);
            }
        }
        if (lastError) {
            try {
                await api.markFail(claim.job_id, lastError);
            }
            catch (failError) {
                const message = failError instanceof Error
                    ? failError.message
                    : "تعذر تسجيل فشل الطباعة";
                this.logger.error(message);
            }
        }
        this.printing = false;
        this.currentJobId = null;
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function runSinglePrintAttempt(config, token, claim) {
    const api = new PrintAgentApiClient(config.apiBaseUrl, token);
    const provider = createPrintProvider(config);
    try {
        await provider.print(claim.receipt);
        await api.markSuccess(claim.job_id);
        return "success";
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "فشل الطباعة";
        await api.markFail(claim.job_id, message);
        return "failed";
    }
}
