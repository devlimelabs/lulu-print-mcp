import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  luluClientKey: z.string().min(1, 'LULU_CLIENT_KEY is required'),
  luluClientSecret: z.string().min(1, 'LULU_CLIENT_SECRET is required'),
  luluApiUrl: z.string().url().default('https://api.lulu.com'),
  luluSandboxApiUrl: z.string().url().default('https://api.sandbox.lulu.com'),
  luluAuthUrl: z.string().url().default('https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token'),
  luluSandboxAuthUrl: z.string().url().default('https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token'),
  useSandbox: z.boolean().default(false),
  debug: z.boolean().default(false),
});

export type ServerConfig = z.infer<typeof ConfigSchema>;

export const loadConfig = (): ServerConfig => {
  try {
    const config = ConfigSchema.parse({
      luluClientKey: process.env.LULU_CLIENT_KEY,
      luluClientSecret: process.env.LULU_CLIENT_SECRET,
      luluApiUrl: process.env.LULU_API_URL,
      luluSandboxApiUrl: process.env.LULU_SANDBOX_API_URL,
      luluAuthUrl: process.env.LULU_AUTH_URL,
      luluSandboxAuthUrl: process.env.LULU_SANDBOX_AUTH_URL,
      useSandbox: process.env.LULU_USE_SANDBOX === 'true',
      debug: process.env.DEBUG === 'true',
    });
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Configuration error:\n${messages.join('\n')}`);
    }
    throw error;
  }
};

export const config = loadConfig();
export default config;