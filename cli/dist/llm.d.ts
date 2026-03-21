export declare function getKeyInfo(): {
    key: string;
    provider: string;
    masked: string;
} | null;
export declare function callLLM(input: string): Promise<string>;
