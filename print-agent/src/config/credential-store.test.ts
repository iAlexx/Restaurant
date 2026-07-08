import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DeviceTokenStore,
  type TokenCipher,
} from "./credential-store.js";

/**
 * Reversible fake cipher mirroring DPAPI's contract without touching Windows.
 * decrypt() throws on anything not produced by encrypt() — simulating a
 * corrupted DPAPI blob or one created by a different user account.
 */
const PREFIX = "dpapi-fake:";

const fakeCipher: TokenCipher = {
  async encrypt(plaintext: string): Promise<string> {
    return PREFIX + Buffer.from(plaintext, "utf8").toString("base64");
  },
  async decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext.startsWith(PREFIX)) {
      throw new Error("corrupted DPAPI blob");
    }
    return Buffer.from(ciphertext.slice(PREFIX.length), "base64").toString(
      "utf8"
    );
  },
};

let dir: string;
let filePath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "rpa-cred-"));
  filePath = join(dir, "device-token.dpapi");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("DeviceTokenStore", () => {
  it("round-trips a non-empty token", async () => {
    const store = new DeviceTokenStore(filePath, fakeCipher);
    await store.store("device-token-abc123");

    expect(existsSync(filePath)).toBe(true);
    const raw = await readFile(filePath, "ascii");
    expect(raw).not.toContain("device-token-abc123");

    const read = await store.read();
    expect(read).toBe("device-token-abc123");
    expect(await store.has()).toBe(true);
  });

  it("rejects an empty token and writes no file", async () => {
    const store = new DeviceTokenStore(filePath, fakeCipher);

    await expect(store.store("")).rejects.toThrow(/فارغ/);
    await expect(store.store("   ")).rejects.toThrow(/فارغ/);

    expect(existsSync(filePath)).toBe(false);
  });

  it("round-trips a token with special characters", async () => {
    const store = new DeviceTokenStore(filePath, fakeCipher);
    const tricky = `a'b"c\`d$e{f}|g \n عربي 🔐 %USERPROFILE%`;

    await store.store(tricky);
    const read = await store.read();

    expect(read).toBe(tricky.trim());
  });

  it("returns null when the credential file is missing", async () => {
    const store = new DeviceTokenStore(
      join(dir, "does-not-exist.dpapi"),
      fakeCipher
    );

    expect(await store.read()).toBeNull();
    expect(await store.has()).toBe(false);
  });

  it("throws a clear error on a corrupted DPAPI file", async () => {
    await writeFile(filePath, "not-a-valid-dpapi-blob", "ascii");
    const store = new DeviceTokenStore(filePath, fakeCipher);

    await expect(store.read()).rejects.toThrow(/تالف/);
    expect(await store.has()).toBe(false);
  });

  it("treats an empty file as no stored token", async () => {
    await writeFile(filePath, "   \n", "ascii");
    const store = new DeviceTokenStore(filePath, fakeCipher);

    expect(await store.read()).toBeNull();
  });
});
