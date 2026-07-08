export declare function tokenFilePath(): string;
/**
 * Reversible transform between a plaintext token and its stored (base64) form.
 * The default implementation uses Windows DPAPI (CurrentUser scope).
 */
export interface TokenCipher {
    encrypt(plaintext: string): Promise<string>;
    decrypt(ciphertext: string): Promise<string>;
}
export declare function createDpapiCipher(): TokenCipher;
export declare class DeviceTokenStore {
    private readonly filePath;
    private readonly cipher;
    constructor(filePath: string, cipher: TokenCipher);
    store(token: string): Promise<void>;
    read(): Promise<string | null>;
    has(): Promise<boolean>;
}
export declare function storeDeviceToken(token: string): Promise<void>;
export declare function readDeviceToken(): Promise<string | null>;
export declare function hasDeviceToken(): Promise<boolean>;
export declare function writePlainConfigFile(configJson: string): Promise<void>;
export declare function readPlainConfigFile(): Promise<string>;
