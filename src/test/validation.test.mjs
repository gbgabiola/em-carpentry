import assert from "node:assert/strict";
import { test } from "node:test";
import {
  projectSchema,
  enquirySchema,
  reviewSchema,
  testimonialSchema,
  facebookUrl,
} from "../lib/validation/schemas.ts";
import { resolveSupabaseConfig } from "../lib/db/config.ts";
const project = {
  title: "Work",
  slug: "work",
  summary: "Summary",
  description: "Description",
  category: "",
  location: "",
  completion_date: "",
  status: "draft",
  featured: false,
};
test("project validation rejects malformed slugs, dates, states and excessive text", () => {
  assert.ok(projectSchema.safeParse(project).success);
  for (const change of [
    { slug: "../admin" },
    { slug: "Work Name" },
    { completion_date: "2026-02-30" },
    { status: "hidden" },
    { title: "x".repeat(121) },
  ])
    assert.equal(
      projectSchema.safeParse({ ...project, ...change }).success,
      false,
    );
});
test("enquiries require appropriate contact details and limit personal data", () => {
  const value = {
    name: "Customer",
    contact_method: "email",
    contact_details: "customer@example.test",
    description: "Repair enquiry",
    suburb: "",
  };
  assert.ok(enquirySchema.safeParse(value).success);
  assert.equal(
    enquirySchema.safeParse({ ...value, contact_details: "not email" }).success,
    false,
  );
  assert.ok(
    enquirySchema.safeParse({
      ...value,
      contact_method: "phone",
      contact_details: "+61 497 175 163",
    }).success,
  );
  assert.equal(
    enquirySchema.safeParse({
      ...value,
      contact_method: "phone",
      contact_details: "abc123",
    }).success,
    false,
  );
});
test("reviews require consent, valid rating and bounded feedback", () => {
  const value = {
    display_name: "Reviewer",
    rating: 5,
    body: "Feedback",
    consent: true,
  };
  assert.ok(reviewSchema.safeParse(value).success);
  for (const change of [
    { consent: false },
    { rating: 0 },
    { rating: 6 },
    { body: "x".repeat(3001) },
  ])
    assert.equal(
      reviewSchema.safeParse({ ...value, ...change }).success,
      false,
    );
});
test("Facebook curation rejects unsafe or unrelated links and missing permission", () => {
  for (const link of [
    "javascript:alert(1)",
    "https://facebook.com.evil.test/post",
    "https://evil.test",
    "https://facebook.com/",
    "https://user@facebook.com/post",
  ])
    assert.equal(facebookUrl.safeParse(link).success, false);
  assert.ok(
    testimonialSchema.safeParse({
      display_name: "Reviewer",
      body: "Feedback",
      source_url: "https://www.facebook.com/EMscarpentryworks",
      consent: true,
      status: "pending",
    }).success,
  );
  assert.equal(
    testimonialSchema.safeParse({
      display_name: "Reviewer",
      body: "Feedback",
      source_url: "https://www.facebook.com/EMscarpentryworks",
      consent: false,
      status: "approved",
    }).success,
    false,
  );
});
test("backend configuration fails closed and rejects privileged keys", () => {
  assert.equal(resolveSupabaseConfig({}), null);
  assert.throws(() =>
    resolveSupabaseConfig({ SUPABASE_URL: "https://project.supabase.co" }),
  );
  assert.throws(() =>
    resolveSupabaseConfig({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_secret_example",
    }),
  );
  const key = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  assert.throws(() =>
    resolveSupabaseConfig({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: key,
    }),
  );
  assert.ok(
    resolveSupabaseConfig({
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    }),
  );
});
