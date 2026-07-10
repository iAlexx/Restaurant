import { PrintAgentApiClient } from "../api/client.js";
import { markSuccessWithRetry } from "../api/ack-retry.js";
import { clearPendingAck, loadPendingAcks, savePendingAck, } from "../config/pending-ack-store.js";
import { createPrintProvider } from "../providers/index.js";
import { publishStatusSnapshot } from "../services/status-service.js";
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
    pendingAckJobId = null;
    shutdownRequested = false;
    lastHeartbeatAt = null;
    lastHeartbeatOk = false;
    lastError = null;
    lastPrintAt = null;
    lastPrintOk = null;
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
        const pending = await loadPendingAcks();
        if (pending.length > 0) {
            this.pendingAckJobId = pending[0] ?? null;
            this.logger.info(`استئناف تأكيد طباعة معلّق — مهمة ${this.pendingAckJobId}`);
        }
        const api = new PrintAgentApiClient(this.config.apiBaseUrl, this.token);
        const provider = createPrintProvider(this.config);
        this.logger.info(`بدء وكيل الطباعة — الوضع: ${this.config.printMode} — الفترة: ${this.config.pollIntervalMs}ms`);
        await this.publishStatus();
        while (!this.shutdownRequested) {
            try {
                await api.heartbeat();
                this.lastHeartbeatAt = new Date().toISOString();
                this.lastHeartbeatOk = true;
                this.lastError = null;
                const status = await provider.checkStatus();
                if (status !== "ready") {
                    this.logger.error("الطابعة غير جاهزة");
                }
                if (this.pendingAckJobId) {
                    await this.retryPendingAck(api);
                }
                else if (!this.printing) {
                    const claim = await api.claim();
                    if (claim) {
                        await this.processJob(api, provider, claim);
                    }
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "خطأ غير معروف في وكيل الطباعة";
                this.lastError = message;
                this.lastHeartbeatOk = false;
                this.logger.error(message);
            }
            await this.publishStatus();
            await sleep(this.config.pollIntervalMs);
        }
        this.running = false;
        await this.publishStatus(false);
        this.logger.info("تم إيقاف وكيل الطباعة");
    }
    async publishStatus(agentRunning = true) {
        try {
            await publishStatusSnapshot(this.config, {
                agentRunning,
                lastHeartbeatAt: this.lastHeartbeatAt,
                lastHeartbeatOk: this.lastHeartbeatOk,
                lastError: this.lastError,
                lastPrintAt: this.lastPrintAt,
                lastPrintOk: this.lastPrintOk,
            });
        }
        catch {
            // ignore status publish errors
        }
    }
    async retryPendingAck(api) {
        if (!this.pendingAckJobId)
            return;
        try {
            await markSuccessWithRetry(api, this.pendingAckJobId, this.logger);
            await clearPendingAck(this.pendingAckJobId);
            this.logger.info(`تم تأكيد الطباعة المعلّقة — مهمة ${this.pendingAckJobId}`);
            this.pendingAckJobId = null;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "فشل تأكيد الطباعة المعلّقة";
            this.logger.error(message);
        }
    }
    async processJob(api, provider, claim) {
        if (this.printing || this.currentJobId === claim.job_id) {
            return;
        }
        this.printing = true;
        this.currentJobId = claim.job_id;
        const label = claim.is_reprint ? "إعادة طباعة" : "طباعة";
        this.logger.info(`${label} — طلب ${claim.receipt.order_number}`);
        let printError = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await provider.print(claim.receipt);
                printError = null;
                break;
            }
            catch (error) {
                printError =
                    error instanceof Error ? error.message : "فشل الطباعة بدون تفاصيل";
                this.logger.error(attempt === 1
                    ? `فشل الطباعة — إعادة محاولة واحدة: ${printError}`
                    : `فشل الطباعة النهائي: ${printError}`);
            }
        }
        if (printError) {
            this.lastPrintAt = new Date().toISOString();
            this.lastPrintOk = false;
            this.lastError = printError;
            try {
                await api.markFail(claim.job_id, printError);
            }
            catch (failError) {
                const message = failError instanceof Error
                    ? failError.message
                    : "تعذر تسجيل فشل الطباعة";
                this.logger.error(message);
            }
        }
        else {
            await savePendingAck(claim.job_id);
            this.pendingAckJobId = claim.job_id;
            try {
                await markSuccessWithRetry(api, claim.job_id, this.logger);
                await clearPendingAck(claim.job_id);
                this.pendingAckJobId = null;
                this.lastPrintAt = new Date().toISOString();
                this.lastPrintOk = true;
                this.lastError = null;
                this.logger.info(`تمت الطباعة بنجاح — ${claim.receipt.order_number}`);
            }
            catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : "فشل تأكيد الطباعة بعد الطباعة الفعلية";
                this.logger.error(`${message} — لن تتم إعادة الطباعة تلقائياً؛ سيتم إعادة تأكيد المهمة`);
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
        await savePendingAck(claim.job_id);
        try {
            await markSuccessWithRetry(api, claim.job_id, {
                error: (message) => console.error(message),
            });
            await clearPendingAck(claim.job_id);
            return "success";
        }
        catch {
            return "success";
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "فشل الطباعة";
        await api.markFail(claim.job_id, message);
        return "failed";
    }
}
