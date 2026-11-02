import type { IntakeConfig } from "./config.ts";
import {
  intakeEnvelopeSchema,
  intakeKindSchema,
  validateSubmission,
  type IntakeKind,
  type IntakeResult,
} from "./contracts.ts";
import { getNetworkKey, issueFormToken, verifyFormToken } from "./security.ts";
export const MAX_INTAKE_BYTES = 32768;
export interface GatewayInput {
  kind: IntakeKind;
  secret: string;
  requestId: string;
  rateKey: string;
  data: Record<string, unknown>;
}
export interface IntakeDependencies {
  config: IntakeConfig | null;
  submit: (input: GatewayInput) => Promise<IntakeResult>;
  now?: () => number;
}
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
function response(
  body: Record<string, unknown>,
  status: number,
  extra?: Record<string, string>,
) {
  return Response.json(body, { status, headers: { ...headers, ...extra } });
}
function permitted(
  request: Request,
  config: IntakeConfig,
  requireOrigin: boolean,
) {
  const origin = request.headers.get("origin");
  return (
    ((!requireOrigin && !origin) || origin === config.origin) &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
async function readBoundedJson(request: Request) {
  const declared = request.headers.get("content-length");
  if (
    declared &&
    (!/^\d+$/.test(declared) || Number(declared) > MAX_INTAKE_BYTES)
  )
    return { tooLarge: true as const };
  if (!request.body) return { invalid: true as const };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_INTAKE_BYTES) {
        await reader.cancel();
        return { tooLarge: true as const };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return {
      data: JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      ) as unknown,
    };
  } catch {
    return { invalid: true as const };
  }
}
export function handleFormToken(
  request: Request,
  config: IntakeConfig | null,
  now = Date.now(),
) {
  if (!config)
    return response(
      {
        error:
          "Online forms are not enabled. Please contact the business directly.",
      },
      503,
    );
  if (!permitted(request, config, false))
    return response({ error: "Open the form on this website." }, 403);
  const kind = intakeKindSchema.safeParse(
    new URL(request.url).searchParams.get("kind"),
  );
  if (!kind.success) return response({ error: "Invalid form." }, 400);
  try {
    const key = getNetworkKey(request.headers, config);
    return response(
      { token: issueFormToken(kind.data, key, config.secret, now) },
      200,
    );
  } catch {
    return response(
      {
        error:
          "The form is temporarily unavailable. Please contact the business directly.",
      },
      503,
    );
  }
}
export async function handleSubmission(
  request: Request,
  kind: IntakeKind,
  deps: IntakeDependencies,
) {
  const { config } = deps;
  if (!config)
    return response(
      {
        error:
          "Online submissions remain disabled while secure intake and retention checks are completed. Please contact the business directly.",
      },
      503,
    );
  if (!permitted(request, config, true))
    return response({ error: "Submit the form from this website." }, 403);
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    return response(
      { error: "Use the website form to submit your request." },
      415,
    );
  const body = await readBoundedJson(request);
  if ("tooLarge" in body)
    return response(
      {
        error:
          "The submission is too large. Shorten the text; attachments are not supported.",
      },
      413,
    );
  if (!("data" in body))
    return response({ error: "The submission could not be read." }, 400);
  const envelope = intakeEnvelopeSchema.safeParse(body.data);
  if (!envelope.success || envelope.data.website.trim())
    return response(
      {
        error:
          "The form could not be accepted. Check the fields and try again.",
      },
      400,
    );
  let networkKey: string;
  try {
    networkKey = getNetworkKey(request.headers, config);
  } catch {
    return response(
      {
        error:
          "The form is temporarily unavailable. Please contact the business directly.",
      },
      503,
    );
  }
  const requestId = verifyFormToken(
    envelope.data.token,
    kind,
    networkKey,
    config.secret,
    deps.now?.() ?? Date.now(),
  );
  if (!requestId)
    return response(
      {
        error:
          "The form check expired or could not be verified. Wait a few seconds, or refresh the form check and try again.",
        refreshToken: true,
      },
      400,
    );
  const parsed = validateSubmission(kind, envelope.data.data);
  if (!parsed.success)
    return response(
      {
        error: "Please check the highlighted fields.",
        fieldErrors: parsed.fieldErrors,
      },
      422,
    );
  try {
    const result = await deps.submit({
      kind,
      secret: config.secret,
      requestId,
      rateKey: networkKey,
      data: parsed.data,
    });
    if (result === "rate_limited")
      return response(
        {
          error:
            "The form has reached its submission limit. Please try later or contact the business directly.",
        },
        429,
        { "Retry-After": "3600" },
      );
    if (result === "invalid")
      return response(
        {
          error:
            "This form was already used with different details. Refresh the form check before submitting.",
          refreshToken: true,
        },
        409,
      );
    if (result !== "accepted" && result !== "duplicate")
      throw new Error("Unexpected gateway response.");
    return response(
      {
        success:
          kind === "enquiry"
            ? "Your enquiry has been received. The business owner will respond personally."
            : "Your feedback has been received and will be reviewed before publication.",
      },
      result === "accepted" ? 201 : 200,
    );
  } catch {
    // A timeout can occur after a save. Preserve the token so retries deduplicate.
    return response(
      {
        error:
          "We could not confirm the submission. Retry this form with the same details, or contact the business directly.",
      },
      503,
    );
  }
}
