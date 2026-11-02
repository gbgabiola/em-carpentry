import "server-only";
import { resolveIntakeConfig } from "./config";
import { createPublicClient } from "@/lib/db/server";
import { handleSubmission, handleFormToken } from "./handler";
import type { IntakeKind } from "./contracts";
function configured() {
  try {
    const config = resolveIntakeConfig(process.env);
    const client = config ? createPublicClient() : null;
    return config && client ? { config, client } : null;
  } catch {
    return null;
  }
}
export function isIntakeAvailable() {
  return configured() !== null;
}
export function formTokenResponse(request: Request) {
  return handleFormToken(request, configured()?.config ?? null);
}
export async function submissionResponse(request: Request, kind: IntakeKind) {
  const ready = configured();
  return handleSubmission(request, kind, {
    config: ready?.config ?? null,
    submit: async (input) => {
      if (!ready) throw new Error("Intake unavailable.");
      const result = await ready.client
        .rpc("submit_website_submission", {
          p_kind: input.kind,
          p_secret: input.secret,
          p_request_id: input.requestId,
          p_rate_key: input.rateKey,
          p_data: input.data,
        })
        .abortSignal(AbortSignal.timeout(8000));
      if (
        result.error ||
        !["accepted", "duplicate", "rate_limited", "invalid"].includes(
          result.data || "",
        )
      )
        throw new Error("Submission could not be confirmed.");
      return result.data as
        | "accepted"
        | "duplicate"
        | "rate_limited"
        | "invalid";
    },
  });
}
