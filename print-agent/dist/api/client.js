import { claimResponseSchema, } from "../providers/types.js";
export class PrintAgentApiClient {
    apiBaseUrl;
    deviceToken;
    constructor(apiBaseUrl, deviceToken) {
        this.apiBaseUrl = apiBaseUrl;
        this.deviceToken = deviceToken;
    }
    headers() {
        return {
            Authorization: `Bearer ${this.deviceToken}`,
            "Content-Type": "application/json",
        };
    }
    url(path) {
        return `${this.apiBaseUrl.replace(/\/$/, "")}${path}`;
    }
    async heartbeat() {
        const res = await fetch(this.url("/api/print-agent/heartbeat"), {
            method: "POST",
            headers: this.headers(),
        });
        if (res.status === 401) {
            throw new Error("رمز الجهاز مرفوض أو ملغى");
        }
        if (!res.ok) {
            throw new Error(`فشل نبضة الجهاز: ${res.status}`);
        }
    }
    async claim() {
        const res = await fetch(this.url("/api/print-agent/claim"), {
            method: "POST",
            headers: this.headers(),
        });
        if (res.status === 401) {
            throw new Error("رمز الجهاز مرفوض أو ملغى");
        }
        if (!res.ok) {
            throw new Error(`فشل المطالبة بمهمة الطباعة: ${res.status}`);
        }
        const data = (await res.json());
        if (!data.job)
            return null;
        return claimResponseSchema.parse(data.job);
    }
    async markSuccess(jobId) {
        const res = await fetch(this.url(`/api/print-agent/${jobId}/success`), {
            method: "POST",
            headers: this.headers(),
        });
        if (res.status === 401) {
            throw new Error("رمز الجهاز مرفوض أو ملغى");
        }
        if (!res.ok) {
            throw new Error(`فشل تأكيد الطباعة: ${res.status}`);
        }
    }
    async markFail(jobId, errorMessage) {
        const res = await fetch(this.url(`/api/print-agent/${jobId}/fail`), {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify({ error_message: errorMessage }),
        });
        if (res.status === 401) {
            throw new Error("رمز الجهاز مرفوض أو ملغى");
        }
        if (!res.ok) {
            throw new Error(`فشل تسجيل فشل الطباعة: ${res.status}`);
        }
    }
}
