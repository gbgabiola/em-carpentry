import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import type { Database } from "@/types/database";

export function createPublicClient() {
  const config = getSupabaseConfig();
  return config
    ? createClient<Database>(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;
}
export async function createSessionClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values)
            jar.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            });
        } catch {
          /* Server Components cannot set cookies; Proxy handles refresh. */
        }
      },
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
