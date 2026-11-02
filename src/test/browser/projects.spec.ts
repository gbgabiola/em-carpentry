import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

test("portfolio search and pagination preserve the search and category", async ({
  page,
}) => {
  await page.goto("/projects");
  await page
    .getByLabel("Search projects", { exact: true })
    .fill("Synthetic project");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(12);
  await expect(
    page.getByRole("link", { name: "Synthetic project 01", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Synthetic project 13", exact: true }),
  ).toHaveCount(0);
  const next = page.getByRole("link", { name: "Next page", exact: true });
  await next.click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.getByLabel("Search projects", { exact: true })).toHaveValue(
    "Synthetic project",
  );
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Synthetic project 13", exact: true }),
  ).toBeVisible();
  await expect(next).toHaveCount(0);
  await page.getByRole("link", { name: "Previous page", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(12);

  await page.getByLabel("Category", { exact: true }).fill("Synthetic outdoor");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(5);
  await expect(
    page.getByRole("link", { name: "Synthetic project 09", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Synthetic project 01", exact: true }),
  ).toHaveCount(0);
  await expect(next).toHaveCount(0);
  await page
    .getByLabel("Search projects", { exact: true })
    .fill("No matching synthetic entry");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByText("No matching projects", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(0);
});

test("project details load private media through the app and compare photos by keyboard", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects?q=Synthetic");
  await page
    .getByRole("link", { name: "Synthetic project 01", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects\/synthetic-project-01$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Synthetic project 01",
  );
  await expect(page.getByText("Completed: January 2026")).toBeVisible();
  const slider = page.getByRole("slider");
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    "50% before photo visible",
  );
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    "51% before photo visible",
  );
  await expect(page.locator(".comparison-overlay")).toHaveCSS(
    "clip-path",
    "inset(0px 49% 0px 0px)",
  );
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveValue("99");
  await expect(page.locator("figure")).toHaveCount(2);
  await expect(
    page.getByRole("img", {
      name: "Synthetic before image for Synthetic project 01",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Synthetic after image for Synthetic project 01",
      exact: true,
    }),
  ).toBeVisible();
  const photos = page.locator("main img");
  await expect
    .poll(() =>
      photos.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node instanceof HTMLImageElement &&
            node.complete &&
            node.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: /Dark mode/ }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`synthetic-project-${theme}.png`),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("incomplete comparisons retain the gallery and missing projects return 404", async ({
  page,
}) => {
  await page.goto("/projects/synthetic-project-13");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Synthetic project 13",
  );
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.locator("figure")).toHaveCount(1);
  const response = await page.goto("/projects/synthetic-missing");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
    /Synthetic project/,
  );
});
