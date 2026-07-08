import type { AgentConfig } from "../config/config.js";
import { PrintAgentApiClient } from "../api/client.js";
import { createPrintProvider } from "../providers/index.js";
import type { ClaimResponse } from "../providers/types.js";

export interface AgentLogger {
  info(message: string): void;
  error(message: string): void;
}

const defaultLogger: AgentLogger = {
  info: (message) => console.log(`[${new Date().toISOString()}] ${message}`),
  error: (message) => console.error(`[${new Date().toISOString()}] ${message}`),
};

export class PrintAgent {
  private running = false;
  private printing = false;
  private currentJobId: string | null = null;
  private shutdownRequested = false;

  constructor(
    private readonly config: AgentConfig,
    private readonly token: string,
    private readonly logger: AgentLogger = defaultLogger
  ) {}

  requestShutdown(): void {
    this.shutdownRequested = true;
  }

  isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.shutdownRequested = false;

    const api = new PrintAgentApiClient(this.config.apiBaseUrl, this.token);
    const provider = createPrintProvider(this.config);

    this.logger.info(
      `بدء وكيل الطباعة — الوضع: ${this.config.printMode} — الفترة: ${this.config.pollIntervalMs}ms`
    );

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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطأ غير معروف في وكيل الطباعة";
        this.logger.error(message);
      }

      await sleep(this.config.pollIntervalMs);
    }

    this.running = false;
    this.logger.info("تم إيقاف وكيل الطباعة");
  }

  private async processJob(
    api: PrintAgentApiClient,
    provider: ReturnType<typeof createPrintProvider>,
    claim: ClaimResponse
  ): Promise<void> {
    if (this.printing || this.currentJobId === claim.job_id) {
      return;
    }

    this.printing = true;
    this.currentJobId = claim.job_id;

    const label = claim.is_reprint ? "إعادة طباعة" : "طباعة";
    this.logger.info(`${label} — طلب ${claim.receipt.order_number}`);

    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await provider.print(claim.receipt);
        await api.markSuccess(claim.job_id);
        this.logger.info(`تمت الطباعة بنجاح — ${claim.receipt.order_number}`);
        lastError = null;
        break;
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "فشل الطباعة بدون تفاصيل";
        this.logger.error(
          attempt === 1
            ? `فشل الطباعة — إعادة محاولة واحدة: ${lastError}`
            : `فشل الطباعة النهائي: ${lastError}`
        );
      }
    }

    if (lastError) {
      try {
        await api.markFail(claim.job_id, lastError);
      } catch (failError) {
        const message =
          failError instanceof Error
            ? failError.message
            : "تعذر تسجيل فشل الطباعة";
        this.logger.error(message);
      }
    }

    this.printing = false;
    this.currentJobId = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSinglePrintAttempt(
  config: AgentConfig,
  token: string,
  claim: ClaimResponse
): Promise<"success" | "failed"> {
  const api = new PrintAgentApiClient(config.apiBaseUrl, token);
  const provider = createPrintProvider(config);

  try {
    await provider.print(claim.receipt);
    await api.markSuccess(claim.job_id);
    return "success";
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل الطباعة";
    await api.markFail(claim.job_id, message);
    return "failed";
  }
}
