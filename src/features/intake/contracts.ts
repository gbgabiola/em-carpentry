import { z } from "zod";
import { enquirySchema, reviewSchema } from "../../lib/validation/schemas.ts";
export const intakeKindSchema = z.enum(["enquiry", "review"]);
export type IntakeKind = z.infer<typeof intakeKindSchema>;
export type IntakeResult =
  | "accepted"
  | "duplicate"
  | "rate_limited"
  | "invalid";
export const intakeEnvelopeSchema = z.strictObject({
  token: z.string().min(1).max(300),
  website: z.string().max(200).default(""),
  data: z.unknown(),
});
export function validateSubmission(kind: IntakeKind, input: unknown) {
  const result =
    kind === "enquiry"
      ? enquirySchema.strict().safeParse(input)
      : reviewSchema.strict().safeParse(input);
  if (result.success) return { success: true as const, data: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      /^[a-z_]+$/.test(field) &&
      !Object.hasOwn(fieldErrors, field)
    )
      fieldErrors[field] = issue.message;
  }
  return { success: false as const, fieldErrors };
}
