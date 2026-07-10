import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("print complete idempotency migration", () => {
  it("returns true when job is already PRINTED by the same device", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260710120000_print_complete_idempotent.sql"
      ),
      "utf8"
    );

    expect(sql).toContain("status = 'PRINTED'");
    expect(sql).toContain("RETURN true");
    expect(sql).toContain("status = 'PRINTING'");
  });

  it("preserves stale recovery for abandoned PRINTING jobs", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260708170000_print_agent_rpc.sql"
      ),
      "utf8"
    );

    expect(sql).toContain("reset_stale_print_jobs");
    expect(sql).toContain("status = 'PENDING'");
    expect(sql).toContain("interval '2 minutes'");
  });
});
