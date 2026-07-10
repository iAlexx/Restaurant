import type { PrintAgentApiClient } from "../api/client.js";

export interface AckRetryLogger {
  error(message: string): void;
}

/** Bounded backoff delays for success acknowledgement (5 attempts total). */
export const ACK_RETRY_DELAYS_MS = [0, 1_000, 2_000, 4_000, 8_000] as const;

export async function markSuccessWithRetry(
  api: PrintAgentApiClient,
  jobId: string,
  logger: AckRetryLogger
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < ACK_RETRY_DELAYS_MS.length; attempt++) {
    const delay = ACK_RETRY_DELAYS_MS[attempt];
    if (delay > 0) {
      await sleep(delay);
    }

    try {
      await api.markSuccess(jobId);
      return;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("فشل تأكيد الطباعة بدون تفاصيل");
      logger.error(
        `فشل تأكيد الطباعة — محاولة ${attempt + 1}/${ACK_RETRY_DELAYS_MS.length}: ${lastError.message}`
      );
    }
  }

  throw lastError ?? new Error("فشل تأكيد الطباعة");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
