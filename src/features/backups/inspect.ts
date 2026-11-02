import { z } from "zod";
import { retention } from "../../config/retention.ts";
import { facebookUrl } from "../../lib/validation/schemas.ts";

export class BackupValidationError extends Error {}
export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const timestamp = z.iso.datetime({ offset: true });
const text = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => value.trim().length > 0);
const status = z.enum(["draft", "published", "archived"]);
const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const identity = { id: z.uuid(), created_at: timestamp };
const publication = {
  status,
  publication_confirmed: z.boolean(),
  display_order: z.number().int().min(0).max(999),
};
const contentSchema = z.strictObject({
  projects: z.array(
    z.strictObject({
      ...identity,
      slug,
      title: text(120),
      summary: text(300),
      description: text(10000),
      category: z.string().max(80),
      location: z.string().max(120),
      completion_date: z.iso.date().nullable(),
      status,
      featured: z.boolean(),
      comparison_enabled: z.boolean(),
      updated_at: timestamp,
    }),
  ),
  project_images: z.array(
    z.strictObject({
      ...identity,
      project_id: z.uuid(),
      path: text(300),
      alt: text(250),
      display_order: z.number().int().min(0),
      role: z.enum(["gallery", "before", "after"]),
    }),
  ),
  reviews: z.array(
    z.strictObject({
      ...identity,
      display_name: text(100),
      rating: z.number().int().min(1).max(5).nullable(),
      body: text(3000),
      source: z.enum(["website", "facebook"]),
      source_url: facebookUrl.nullable(),
      consent: z.boolean(),
      status: z.enum(["pending", "approved", "rejected"]),
    }),
  ),
  enquiries: z.array(
    z.strictObject({
      ...identity,
      name: text(100),
      contact_method: z.enum(["email", "phone"]),
      contact_details: z.string().min(3).max(320),
      description: z.string().min(10).max(5000),
      suburb: z.string().max(120),
      status: z.enum(["new", "reviewed", "closed"]),
    }),
  ),
  business_settings: z
    .array(
      z.strictObject({
        id: z.literal(1),
        about_text: text(3000),
        service_area: text(200),
        phone: text(30).refine((value) =>
          /^\+61[0-9]{9}$/.test(value.replace(/[ ()-]/g, "")),
        ),
        email: z.email().max(320),
        facebook_url: facebookUrl.max(2048),
      }),
    )
    .length(1),
  services: z.array(
    z.strictObject({
      ...identity,
      ...publication,
      name: text(120),
      slug,
      description: text(1500),
    }),
  ),
  faqs: z.array(
    z.strictObject({
      ...identity,
      ...publication,
      question: text(200),
      answer: text(3000),
    }),
  ),
});
const retentionContentSchema = contentSchema.extend({
  reviews: z.array(
    contentSchema.shape.reviews.element.extend({
      retention_started_at: timestamp.nullable(),
      retention_expires_at: timestamp.nullable(),
    }),
  ),
  enquiries: z.array(
    contentSchema.shape.enquiries.element.extend({
      closed_at: timestamp.nullable(),
      retention_expires_at: timestamp.nullable(),
    }),
  ),
});
const snapshotFields = {
  exportedAt: timestamp,
  containsPrivateCustomerData: z.literal(true),
  photoDownloadNote: text(1000),
};
const snapshotSchema = z.discriminatedUnion("schemaVersion", [
  z.strictObject({
    ...snapshotFields,
    schemaVersion: z.literal(2),
    content: contentSchema,
  }),
  z.strictObject({
    ...snapshotFields,
    schemaVersion: z.literal(3),
    content: retentionContentSchema,
  }),
]);

function checkRetentionClock(
  start: string | null,
  end: string | null,
  days: number,
  required: boolean,
) {
  if (
    required
      ? start === null ||
        end === null ||
        Date.parse(end) - Date.parse(start) !== days * 86400000
      : start !== null || end !== null
  )
    throw new BackupValidationError("Backup retention clock is inconsistent.");
}

function unique(values: readonly (string | number)[]) {
  if (new Set(values).size !== values.length)
    throw new BackupValidationError(
      "Backup contains duplicate record identifiers, slugs or photo paths.",
    );
}

// Inspect only; never rewrite data, restore records, fetch URLs or follow photo paths.
export function inspectBackup(input: unknown) {
  const parsed = snapshotSchema.safeParse(input);
  if (!parsed.success)
    throw new BackupValidationError(
      "Backup structure, version or field format is invalid.",
    );
  if (parsed.data.schemaVersion === 3) {
    for (const row of parsed.data.content.reviews)
      checkRetentionClock(
        row.retention_started_at,
        row.retention_expires_at,
        retention.unpublishedReviewDays,
        row.status !== "approved",
      );
    for (const row of parsed.data.content.enquiries)
      checkRetentionClock(
        row.closed_at,
        row.retention_expires_at,
        retention.closedEnquiryDays,
        row.status === "closed",
      );
  }
  const { content } = parsed.data;
  const counts = Object.fromEntries(
    Object.entries(content).map(([table, rows]) => [table, rows.length]),
  );
  for (const rows of Object.values(content)) unique(rows.map((row) => row.id));
  unique(content.projects.map((row) => row.slug));
  unique(content.services.map((row) => row.slug));
  unique(content.project_images.map((row) => row.path));
  const projects = new Set(content.projects.map((row) => row.id));
  for (const image of content.project_images) {
    if (!projects.has(image.project_id))
      throw new BackupValidationError(
        "Photo metadata refers to a missing project.",
      );
    const prefix = `${image.project_id}/`;
    const file = image.path.slice(prefix.length);
    if (
      !image.path.startsWith(prefix) ||
      !file.endsWith(".webp") ||
      !z.uuid().safeParse(file.slice(0, -5)).success
    )
      throw new BackupValidationError("Backup photo storage path is invalid.");
  }
  for (const row of content.reviews) {
    if (
      (row.status === "approved" && !row.consent) ||
      (row.source === "website" && row.rating === null) ||
      (row.source === "facebook" && row.source_url === null)
    )
      throw new BackupValidationError(
        "Review publication or source requirements are inconsistent.",
      );
  }
  for (const row of [...content.services, ...content.faqs]) {
    if (row.status === "published" && !row.publication_confirmed)
      throw new BackupValidationError(
        "Published content is missing owner confirmation.",
      );
  }
  return {
    schemaVersion: parsed.data.schemaVersion,
    retentionClocksIncluded: parsed.data.schemaVersion === 3,
    exportedAt: parsed.data.exportedAt,
    counts,
    photoFilesRequired: content.project_images.length,
  };
}
