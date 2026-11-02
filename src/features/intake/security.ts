import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { IntakeConfig } from "./config.ts";
import type { IntakeKind } from "./contracts.ts";
export const MIN_FORM_AGE_MS = 3000;
export const MAX_FORM_AGE_MS = 30 * 60 * 1000;
export function getNetworkKey(headers: Headers, config: IntakeConfig) {
  const address =
    config.platform === "local"
      ? "127.0.0.1"
      : headers.get("x-nf-client-connection-ip")?.trim();
  if (!address || !isIP(address))
    throw new Error("Trusted network identity unavailable.");
  return createHmac("sha256", config.secret)
    .update(`network:${address.toLowerCase()}`)
    .digest("hex");
}
function signature(body: string, networkKey: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${body}.${networkKey}`)
    .digest("hex");
}
export function issueFormToken(
  kind: IntakeKind,
  networkKey: string,
  secret: string,
  now = Date.now(),
) {
  const body = ["v1", kind, now, randomUUID()].join(".");
  return `${body}.${signature(body, networkKey, secret)}`;
}
export function verifyFormToken(
  token: string,
  kind: IntakeKind,
  networkKey: string,
  secret: string,
  now = Date.now(),
) {
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [version, tokenKind, at, nonce, proof] = parts;
  if (
    version !== "v1" ||
    tokenKind !== kind ||
    !/^\d{13}$/.test(at) ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      nonce,
    ) ||
    !/^[a-f0-9]{64}$/.test(proof)
  )
    return null;
  const age = now - Number(at);
  if (age < MIN_FORM_AGE_MS || age > MAX_FORM_AGE_MS) return null;
  const expected = signature(parts.slice(0, 4).join("."), networkKey, secret);
  return timingSafeEqual(
    Buffer.from(proof, "hex"),
    Buffer.from(expected, "hex"),
  )
    ? nonce
    : null;
}
