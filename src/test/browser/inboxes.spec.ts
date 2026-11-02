import AxeBuilder from "@axe-core/playwright";
import { syntheticSession } from "./owner-session";
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

async function signInToFixture(page: Page, owner = true) {
  await page.context().addCookies([
    {
      name: "sb-127-auth-token",
      value:
        "base64-" +
        Buffer.from(JSON.stringify(syntheticSession(owner))).toString(
          "base64url",
        ),
      url: "http://127.0.0.1:3107",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);
}
test("owner enquiry filters reset pagination and navigation preserves the selected status", async ({
  page,
}) => {
  await signInToFixture(page);
  await page.goto("/admin/enquiries?status=new");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Private enquiries",
  );
  await expect(page.locator("article")).toHaveCount(20);
  await expect(page.getByText(/Received:/).first()).toContainText(
    "Melbourne time",
  );
  await page.getByRole("link", { name: "Next page", exact: true }).click();
  await expect(page).toHaveURL(/status=new&page=2/);
  await expect(page.locator("article")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Next page", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Filter by status", { exact: true })
    .selectOption("closed");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(
    page.getByLabel("Filter by status", { exact: true }),
  ).toHaveValue("closed");
  await expect(page.locator("article")).toHaveCount(2);
  await expect(page.getByText("Page 1 ·", { exact: false })).toBeVisible();
  await expect(page.getByText(/Deletion deadline:/)).toHaveCount(2);
});
test("owner review moderation shows ratings and attribution with bounded pages", async ({
  page,
}, testInfo) => {
  await signInToFixture(page);
  await page.goto("/admin/reviews?status=pending");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Reviews & testimonials",
  );
  await expect(page.locator("article")).toHaveCount(20);
  await expect(
    page.getByText("Rating: 4 out of 5", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("No star rating supplied", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("link", {
        name: "View original Facebook feedback (opens in a new tab)",
      })
      .first(),
  ).toHaveAttribute("href", /facebook\.com\/EMscarpentryworks/);
  await page.getByRole("link", { name: "Next page", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("link", { name: "First page", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(20);
  await page
    .getByLabel("Filter by status", { exact: true })
    .selectOption("approved");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(2);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("synthetic-owner-reviews.png"),
    fullPage: true,
  });
});
test("a signed-in non-owner cannot access filtered private inboxes", async ({
  page,
}) => {
  await signInToFixture(page, false);
  for (const path of [
    "/admin/enquiries?status=new&page=2",
    "/admin/reviews?status=pending",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?notice=denied$/);
    await expect(page.locator("article")).toHaveCount(0);
    await expect(
      page.getByText("synthetic-visitor@example.test", { exact: true }),
    ).toHaveCount(0);
  }
});
