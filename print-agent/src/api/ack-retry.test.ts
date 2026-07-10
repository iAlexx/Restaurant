import { describe, expect, it, vi } from "vitest";
import {
  ACK_RETRY_DELAYS_MS,
  markSuccessWithRetry,
} from "./ack-retry.js";
import type { PrintAgentApiClient } from "../src/api/client.js";

describe("markSuccessWithRetry", () => {
  it("succeeds on first acknowledgement", async () => {
    const markSuccess = vi.fn().mockResolvedValue(undefined);
    const api = { markSuccess } as unknown as PrintAgentApiClient;
    const errors: string[] = [];

    await markSuccessWithRetry(api, "job-1", {
      error: (message) => errors.push(message),
    });

    expect(markSuccess).toHaveBeenCalledTimes(1);
    expect(errors).toHaveLength(0);
  });

  it("retries acknowledgement with bounded backoff then succeeds", async () => {
    const markSuccess = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    const api = { markSuccess } as unknown as PrintAgentApiClient;

    await markSuccessWithRetry(api, "job-1", { error: () => {} });

    expect(markSuccess).toHaveBeenCalledTimes(3);
    expect(ACK_RETRY_DELAYS_MS).toHaveLength(5);
  });

  it("does not reprint when acknowledgement keeps failing", async () => {
    vi.useFakeTimers();
    const markSuccess = vi.fn().mockRejectedValue(new Error("server down"));
    const api = { markSuccess } as unknown as PrintAgentApiClient;

    const promise = markSuccessWithRetry(api, "job-1", { error: () => {} });
    const expectation = expect(promise).rejects.toThrow("server down");
    await vi.runAllTimersAsync();
    await expectation;
    expect(markSuccess).toHaveBeenCalledTimes(ACK_RETRY_DELAYS_MS.length);
    vi.useRealTimers();
  });
});
