import { describe, expect, it } from "vitest";
import { isAdmin } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "secret1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
  });

  it("returns false for CASHIER", () => {
    expect(isAdmin("CASHIER")).toBe(false);
  });
});
