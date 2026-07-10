import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { ensureConfigDir, getConfigDir, getConfigPath } from "../paths.js";

const execFileAsync = promisify(execFile);

const TOKEN_FILE = "device-token.dpapi";

export function tokenFilePath(): string {
  return join(getConfigDir(), TOKEN_FILE);
}

function isWindows(): boolean {
  return process.platform === "win32";
}

/**
 * Reversible transform between a plaintext token and its stored (base64) form.
 * The default implementation uses Windows DPAPI (CurrentUser scope).
 */
export interface TokenCipher {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

const DPAPI_ENCRYPT_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$plain = $env:RPA_TOKEN_PLAINTEXT
if ([string]::IsNullOrEmpty($plain)) { throw 'empty token' }
$bytes = [System.Text.Encoding]::UTF8.GetBytes($plain)
$enc = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($enc)
`;

const DPAPI_DECRYPT_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$b64 = $env:RPA_TOKEN_CIPHERTEXT
$enc = [Convert]::FromBase64String($b64)
$bytes = [System.Security.Cryptography.ProtectedData]::Unprotect($enc, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[System.Text.Encoding]::UTF8.GetString($bytes)
`;

export function createDpapiCipher(): TokenCipher {
  return {
    async encrypt(plaintext: string): Promise<string> {
      const { stdout } = await execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", DPAPI_ENCRYPT_SCRIPT],
        { env: { ...process.env, RPA_TOKEN_PLAINTEXT: plaintext } }
      );
      const encoded = stdout.trim();
      if (!encoded) {
        throw new Error("تعذر تشفير رمز الجهاز عبر DPAPI");
      }
      return encoded;
    },

    async decrypt(ciphertext: string): Promise<string> {
      const { stdout } = await execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", DPAPI_DECRYPT_SCRIPT],
        { env: { ...process.env, RPA_TOKEN_CIPHERTEXT: ciphertext } }
      );
      return stdout.replace(/\r?\n$/, "");
    },
  };
}

interface ErrnoLike {
  code?: string;
}

export class DeviceTokenStore {
  constructor(
    private readonly filePath: string,
    private readonly cipher: TokenCipher
  ) {}

  async store(token: string): Promise<void> {
    const trimmed = token?.trim() ?? "";
    if (trimmed.length === 0) {
      throw new Error("رمز الجهاز فارغ — لن يتم حفظ أي ملف");
    }

    await ensureConfigDir();
    const ciphertext = await this.cipher.encrypt(trimmed);
    await writeFile(this.filePath, ciphertext, "ascii");
  }

  async read(): Promise<string | null> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "ascii");
    } catch (error) {
      if ((error as ErrnoLike).code === "ENOENT") {
        return null;
      }
      throw error;
    }

    const ciphertext = raw.trim();
    if (ciphertext.length === 0) {
      return null;
    }

    try {
      const token = (await this.cipher.decrypt(ciphertext)).trim();
      return token.length > 0 ? token : null;
    } catch {
      throw new Error(
        "تعذر فك تشفير رمز الجهاز — الملف تالف أو أُنشئ بحساب مستخدم مختلف. أعد الإعداد."
      );
    }
  }

  async has(): Promise<boolean> {
    try {
      return Boolean(await this.read());
    } catch {
      return false;
    }
  }
}

function defaultStore(): DeviceTokenStore {
  return new DeviceTokenStore(tokenFilePath(), createDpapiCipher());
}

export async function storeDeviceToken(token: string): Promise<void> {
  const trimmed = token?.trim() ?? "";
  if (trimmed.length === 0) {
    throw new Error("رمز الجهاز فارغ — لن يتم حفظ أي ملف");
  }
  if (!isWindows()) {
    throw new Error("تخزين الرمز آمن متاح على Windows فقط");
  }

  await defaultStore().store(trimmed);
}

export async function readDeviceToken(): Promise<string | null> {
  if (!isWindows()) {
    return null;
  }
  return defaultStore().read();
}

export async function hasDeviceToken(): Promise<boolean> {
  if (!isWindows()) {
    return false;
  }
  return defaultStore().has();
}

export async function writePlainConfigFile(configJson: string): Promise<void> {
  await ensureConfigDir();
  await writeFile(getConfigPath(), configJson, "utf8");
}

export async function readPlainConfigFile(): Promise<string> {
  return readFile(getConfigPath(), "utf8");
}
