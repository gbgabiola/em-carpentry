export function resolveSupabaseConfig(environment: {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
}) {
  const url = environment.SUPABASE_URL?.trim();
  const key = environment.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !key) return null;
  if (!url || !key)
    throw new Error("Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
  const parsed = new URL(url);
  const local =
    parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (
    (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  )
    throw new Error("Invalid Supabase origin.");
  if (key.startsWith("sb_secret_"))
    throw new Error("Use a publishable key, never a secret key.");
  if (!key.startsWith("sb_publishable_")) {
    try {
      const payload: unknown = JSON.parse(
        Buffer.from(key.split(".")[1] || "", "base64url").toString(),
      );
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("role" in payload) ||
        payload.role !== "anon"
      )
        throw new Error();
    } catch {
      throw new Error("Use a Supabase publishable or legacy anon key.");
    }
  }
  return { url: parsed.origin, key };
}
export function getSupabaseConfig() {
  return resolveSupabaseConfig({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
}
