import { test as base, expect, type Page } from "@playwright/test";
export const test = base.extend({
  page: async ({ page, baseURL }, provide) => {
    if (baseURL !== "http://127.0.0.1:3107")
      throw new Error("Browser checks require the isolated loopback fixture.");
    let tokenNumber = 0;
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== baseURL) return route.abort("blockedbyclient");
      if (url.pathname === "/api/intake/token")
        return route.fulfill({
          json: { token: `synthetic-form-token-${++tokenNumber}` },
        });
      if (
        ["/api/enquiries", "/api/reviews"].includes(url.pathname) &&
        route.request().method() === "POST"
      )
        return route.fulfill({
          status: 503,
          json: { error: "Synthetic backend unavailable." },
        });
      return route.continue();
    });
    await provide(page);
  },
});
export { expect };
export async function fillEnquiry(page: Page) {
  await expect(page.getByLabel("Your name", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Your name", { exact: true })
    .fill("Synthetic browser visitor");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("browser-fixture@example.test");
  await page
    .getByLabel("Tell us about your project", { exact: true })
    .fill("Synthetic project description for isolated browser testing.");
}
