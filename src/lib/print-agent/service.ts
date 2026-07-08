import { createServiceClient } from "@/lib/supabase/service";
import { buildReceiptPayloadFromSnapshots } from "@/lib/print-agent/receipt";
import {
  claimResponseSchema,
  type ClaimResponse,
} from "@/lib/print-agent/types";

const STALE_PRINTING_MS = 2 * 60 * 1000;

export { STALE_PRINTING_MS };

export async function resetStalePrintJobs(): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("reset_stale_print_jobs");

  if (error) {
    throw new Error("تعذر استعادة مهام الطباعة العالقة");
  }

  return (data as number) ?? 0;
}

export async function claimPrintJob(
  deviceId: string
): Promise<ClaimResponse | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("claim_print_job", {
    p_device_id: deviceId,
  });

  if (error) {
    throw new Error("تعذر المطالبة بمهمة الطباعة");
  }

  if (!data) {
    return null;
  }

  const claim = data as {
    job_id: string;
    order_id: string;
    is_reprint: boolean;
  };

  const receipt = await buildReceiptPayloadFromSnapshots(supabase, {
    jobId: claim.job_id,
    orderId: claim.order_id,
    isReprint: claim.is_reprint,
  });

  return claimResponseSchema.parse({
    job_id: claim.job_id,
    order_id: claim.order_id,
    is_reprint: claim.is_reprint,
    receipt,
  });
}

export async function completePrintJob(
  jobId: string,
  deviceId: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("complete_print_job", {
    p_job_id: jobId,
    p_device_id: deviceId,
  });

  if (error) {
    throw new Error("تعذر تأكيد الطباعة");
  }

  return Boolean(data);
}

export async function failPrintJob(
  jobId: string,
  deviceId: string,
  errorMessage: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("fail_print_job", {
    p_job_id: jobId,
    p_device_id: deviceId,
    p_error_message: errorMessage,
  });

  if (error) {
    throw new Error("تعذر تسجيل فشل الطباعة");
  }

  return Boolean(data);
}

export async function printAgentHeartbeat(deviceId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("print_agent_heartbeat", {
    p_device_id: deviceId,
  });

  if (error) {
    throw new Error("تعذر إرسال نبضة الجهاز");
  }
}
