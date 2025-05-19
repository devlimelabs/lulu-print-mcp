import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    luluClientKey: z.ZodString;
    luluClientSecret: z.ZodString;
    luluApiUrl: z.ZodDefault<z.ZodString>;
    luluSandboxApiUrl: z.ZodDefault<z.ZodString>;
    luluAuthUrl: z.ZodDefault<z.ZodString>;
    luluSandboxAuthUrl: z.ZodDefault<z.ZodString>;
    useSandbox: z.ZodDefault<z.ZodBoolean>;
    debug: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    luluClientKey: string;
    luluClientSecret: string;
    luluApiUrl: string;
    luluSandboxApiUrl: string;
    luluAuthUrl: string;
    luluSandboxAuthUrl: string;
    useSandbox: boolean;
    debug: boolean;
}, {
    luluClientKey: string;
    luluClientSecret: string;
    luluApiUrl?: string | undefined;
    luluSandboxApiUrl?: string | undefined;
    luluAuthUrl?: string | undefined;
    luluSandboxAuthUrl?: string | undefined;
    useSandbox?: boolean | undefined;
    debug?: boolean | undefined;
}>;
export type ServerConfig = z.infer<typeof ConfigSchema>;
export declare const loadConfig: () => ServerConfig;
export declare const config: {
    luluClientKey: string;
    luluClientSecret: string;
    luluApiUrl: string;
    luluSandboxApiUrl: string;
    luluAuthUrl: string;
    luluSandboxAuthUrl: string;
    useSandbox: boolean;
    debug: boolean;
};
export default config;
