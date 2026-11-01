import { z } from "zod";
const text = (max: number) =>
  z.string().trim().min(1, "This field is required.").max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");
export const idSchema = z.uuid();
export const projectSchema = z.object({
  title: text(120),
  slug: text(100).regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lower-case words separated by hyphens.",
  ),
  summary: text(300),
  description: text(10000),
  category: optionalText(80),
  location: optionalText(120),
  completion_date: z
    .union([z.literal(""), z.iso.date()])
    .transform((value) => value || null),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
});
export const imageSchema = z.object({
  project_id: idSchema,
  alt: text(250),
  display_order: z.coerce.number().int().min(0).max(999),
  role: z.enum(["gallery", "before", "after"]),
});
export const facebookUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    ["facebook.com", "www.facebook.com"].includes(url.hostname) &&
    !url.username &&
    !url.password &&
    !url.port &&
    url.pathname !== "/"
  );
}, "Use an HTTPS Facebook source link.");
export const testimonialSchema = z.object({
  display_name: text(100),
  body: text(3000),
  source_url: facebookUrl,
  consent: z.literal(true, {
    error: "Confirm permission to republish this testimonial.",
  }),
  status: z.enum(["pending", "approved", "rejected"]),
});
export const businessSchema = z.object({
  about_text: text(3000),
  service_area: text(200),
});
export const enquirySchema = z
  .object({
    name: text(100),
    contact_method: z.enum(["email", "phone"]),
    contact_details: text(320),
    description: text(5000).min(10),
    suburb: optionalText(120),
  })
  .superRefine((value, context) => {
    const valid =
      value.contact_method === "email"
        ? z.email().safeParse(value.contact_details).success
        : /^\+?[\d ()-]{6,30}$/.test(value.contact_details) &&
          value.contact_details.replace(/\D/g, "").length >= 6;
    if (!valid)
      context.addIssue({
        code: "custom",
        path: ["contact_details"],
        message:
          "Enter a valid email address or phone number for your chosen contact method.",
      });
  });
export const reviewSchema = z.object({
  display_name: text(100),
  rating: z.coerce.number().int().min(1).max(5),
  body: text(3000),
  consent: z.literal(true, { error: "Publication consent is required." }),
});
export const loginSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(256),
});
export interface ActionResult {
  error?: string;
  success?: string;
}
