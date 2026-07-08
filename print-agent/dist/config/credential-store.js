import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { getConfigDir } from "./config.js";
const execFileAsync = promisify(execFile);
const TOKEN_FILE = "device-token.dpapi";
const CREDENTIAL_TARGET = "RestaurantPrintAgent/DeviceToken";
function tokenFilePath() {
    return `${getConfigDir()}\\${TOKEN_FILE}`;
}
async function ensureConfigDir() {
    await mkdir(getConfigDir(), { recursive: true });
}
function isWindows() {
    return process.platform === "win32";
}
async function storeWithDpapiFile(token) {
    await ensureConfigDir();
    const script = `
$bytes = [System.Text.Encoding]::UTF8.GetBytes('${token.replace(/'/g, "''")}')
$encrypted = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($encrypted) | Set-Content -Path '${tokenFilePath().replace(/'/g, "''")}' -Encoding ASCII
`;
    await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
}
async function readWithDpapiFile() {
    try {
        const script = `
$path = '${tokenFilePath().replace(/'/g, "''")}'
if (-not (Test-Path $path)) { exit 2 }
$encrypted = [Convert]::FromBase64String((Get-Content -Path $path -Raw))
$bytes = [System.Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[System.Text.Encoding]::UTF8.GetString($bytes)
`;
        const { stdout } = await execFileAsync("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            script,
        ]);
        const token = stdout.trim();
        return token.length > 0 ? token : null;
    }
    catch (error) {
        const err = error;
        if (err.code === 2)
            return null;
        throw error;
    }
}
async function storeWithCredentialManager(token) {
    const script = `
cmdkey /generic:"${CREDENTIAL_TARGET}" /user:device /pass:"${token.replace(/"/g, '`"')}"
`;
    await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
}
async function readWithCredentialManager() {
    const script = `
$cred = cmdkey /list | Select-String -Pattern '${CREDENTIAL_TARGET}'
if (-not $cred) { exit 2 }
# cmdkey does not expose password retrieval; DPAPI file is primary store.
exit 2
`;
    try {
        await execFileAsync("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            script,
        ]);
        return null;
    }
    catch {
        return null;
    }
}
export async function storeDeviceToken(token) {
    if (!isWindows()) {
        throw new Error("تخزين الرمز آمن متاح على Windows فقط");
    }
    await storeWithDpapiFile(token);
    try {
        await storeWithCredentialManager(token);
    }
    catch {
        // DPAPI file is the primary secure store.
    }
}
export async function readDeviceToken() {
    if (!isWindows()) {
        return null;
    }
    const fromDpapi = await readWithDpapiFile();
    if (fromDpapi)
        return fromDpapi;
    return readWithCredentialManager();
}
export async function hasDeviceToken() {
    try {
        const token = await readDeviceToken();
        return Boolean(token);
    }
    catch {
        return false;
    }
}
export async function writePlainConfigFile(configJson) {
    await ensureConfigDir();
    await writeFile(`${getConfigDir()}\\config.json`, configJson, "utf8");
}
export async function readPlainConfigFile() {
    return readFile(`${getConfigDir()}\\config.json`, "utf8");
}
