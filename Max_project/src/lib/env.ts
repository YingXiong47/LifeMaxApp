import { z } from "zod";

function optionalString() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().min(1).optional()
  );
}

function optionalUrl() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().url().optional()
  );
}

const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString(),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString()
});

const serverEnvSchema = clientEnvSchema.extend({
  CLERK_SECRET_KEY: optionalString(),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(),
  SUPABASE_URL: optionalUrl(),
  SUPABASE_ANON_KEY: optionalString(),
  INNGEST_EVENT_KEY: optionalString(),
  INNGEST_SIGNING_KEY: optionalString(),
  OPENAI_API_KEY: optionalString(),
  LIFEMAX_AGENT_BACKEND: z.enum(["legacy", "builder", "openai"]).optional()
});

const parsedClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

const parsedServerEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  LIFEMAX_AGENT_BACKEND: process.env.LIFEMAX_AGENT_BACKEND as "legacy" | "builder" | "openai" | undefined
});

export const clientEnv = {
  clerkPublishableKey: parsedClientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  supabaseUrl: parsedClientEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: parsedClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

export const serverEnv = {
  ...clientEnv,
  clerkSecretKey: parsedServerEnv.CLERK_SECRET_KEY,
  supabaseUrl: parsedServerEnv.NEXT_PUBLIC_SUPABASE_URL ?? parsedServerEnv.SUPABASE_URL,
  supabaseAnonKey: parsedServerEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? parsedServerEnv.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: parsedServerEnv.SUPABASE_SERVICE_ROLE_KEY,
  inngestEventKey: parsedServerEnv.INNGEST_EVENT_KEY,
  inngestSigningKey: parsedServerEnv.INNGEST_SIGNING_KEY,
  openAiApiKey: parsedServerEnv.OPENAI_API_KEY,
  agentBackend: parsedServerEnv.LIFEMAX_AGENT_BACKEND ?? "legacy"
};

export const readiness = {
  clerk:
    Boolean(clientEnv.clerkPublishableKey) &&
    Boolean(serverEnv.clerkSecretKey),
  supabase: Boolean(serverEnv.supabaseUrl) && Boolean(serverEnv.supabaseAnonKey),
  supabaseAdmin: Boolean(serverEnv.supabaseUrl) && Boolean(serverEnv.supabaseServiceRoleKey),
  inngest: Boolean(serverEnv.inngestEventKey),
  openai: Boolean(serverEnv.openAiApiKey)
} as const;
