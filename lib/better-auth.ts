import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export function createStarfallAuth(requestUrl: string) {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  if (!env.BETTER_AUTH_API_KEY) throw new Error("Better Auth secret is unavailable");

  return betterAuth({
    appName: "Starfall Idle",
    baseURL: env.BETTER_AUTH_URL || new URL(requestUrl).origin,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_API_KEY,
    database: drizzleAdapter(drizzle(env.DB, { schema }), {
      provider: "sqlite",
      schema,
    }),
    account: {
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
      },
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
  });
}
