export declare function storeDeviceToken(token: string): Promise<void>;
export declare function readDeviceToken(): Promise<string | null>;
export declare function hasDeviceToken(): Promise<boolean>;
export declare function writePlainConfigFile(configJson: string): Promise<void>;
export declare function readPlainConfigFile(): Promise<string>;
