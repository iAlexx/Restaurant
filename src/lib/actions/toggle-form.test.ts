import { describe, expect, it } from "vitest";
import { parseToggleForm } from "@/lib/actions/toggle-form";

const VALID_ID = "3f0c2c8a-2c2b-4d1a-9c3e-8d7b6a5f4e3d";

function formOf(entries: Record<string, string | undefined>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) fd.set(key, value);
  }
  return fd;
}

describe("parseToggleForm", () => {
  it("parses a valid id with next=true", () => {
    const result = parseToggleForm(formOf({ id: VALID_ID, next: "true" }));
    expect(result).toEqual({ id: VALID_ID, next: true });
  });

  it("treats next=false as false", () => {
    const result = parseToggleForm(formOf({ id: VALID_ID, next: "false" }));
    expect(result).toEqual({ id: VALID_ID, next: false });
  });

  it("treats a missing next value as false", () => {
    const result = parseToggleForm(formOf({ id: VALID_ID }));
    expect(result).toEqual({ id: VALID_ID, next: false });
  });

  it("treats any non-'true' next value as false", () => {
    const result = parseToggleForm(formOf({ id: VALID_ID, next: "1" }));
    expect(result).toEqual({ id: VALID_ID, next: false });
  });

  it("returns null when id is missing", () => {
    expect(parseToggleForm(formOf({ next: "true" }))).toBeNull();
  });

  it("returns null when id is not a uuid", () => {
    expect(parseToggleForm(formOf({ id: "not-a-uuid", next: "true" }))).toBeNull();
  });

  it("returns null for an empty id", () => {
    expect(parseToggleForm(formOf({ id: "", next: "true" }))).toBeNull();
  });
});
