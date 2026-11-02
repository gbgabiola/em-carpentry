export interface IntakeConfig {
  secret: string;
  origin: string;
  platform: "netlify" | "local";
}
export interface IntakeEnvironment {
  INTAKE_ENABLED?: string;
  INTAKE_SECRET?: string;
  INTAKE_ORIGIN?: string;
  INTAKE_PLATFORM?: string;
  NODE_ENV?: string;
}
export function resolveIntakeConfig(
  environment: IntakeEnvironment,
): IntakeConfig | null {
  const flag = environment.INTAKE_ENABLED || "false";
  if (flag === "false") return null;
  if (flag !== "true") throw new Error("INTAKE_ENABLED must be true or false.");
  if (!/^[a-f0-9]{64}$/.test(environment.INTAKE_SECRET || ""))
    throw new Error("Configure a private 32-byte intake credential.");
  const url = new URL(environment.INTAKE_ORIGIN || "");
  const local =
    environment.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (!local &&
      (url.port ||
        !url.hostname.includes(".") ||
        /^\d+(\.\d+){3}$/.test(url.hostname)))
  )
    throw new Error("Configure an exact approved intake origin.");
  const platform = environment.INTAKE_PLATFORM;
  if (platform !== "netlify" && !(platform === "local" && local))
    throw new Error("Configure the trusted intake platform.");
  return {
    secret: environment.INTAKE_SECRET as string,
    origin: url.origin,
    platform,
  };
}
