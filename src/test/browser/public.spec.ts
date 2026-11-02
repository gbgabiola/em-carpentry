import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
const routes = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/reviews",
  "/contact",
  "/faq",
  "/privacy",
];
for (const route of routes) {
  test(`responsive accessible public page ${route}`, async ({
    page,
  }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-AU");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    if (route === "/contact")
      await expect(page.getByLabel("Your name", { exact: true })).toBeEnabled();
    if (route === "/reviews")
      await expect(
        page.getByLabel("Your rating", { exact: true }),
      ).toBeEnabled();
    for (const dark of [false, true]) {
      const toggle = page.getByRole("button", { name: /Dark mode/ });
      if ((await toggle.getAttribute("aria-pressed")) !== String(dark))
        await toggle.click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        dark ? "dark" : "light",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        result.violations.map((violation) => ({
          id: violation.id,
          targets: violation.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
      if (["/", "/contact", "/reviews"].includes(route))
        await page.screenshot({
          path: testInfo.outputPath(
            (route.slice(1) || "home") +
              "-" +
              (dark ? "dark" : "light") +
              ".png",
          ),
          fullPage: true,
        });
    }
    expect(runtimeErrors).toEqual([]);
  });
}
test("theme choice persists and keyboard navigation reaches main content", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.getByRole("main")).toBeFocused();
  const toggle = page.getByRole("button", { name: /Dark mode/ });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: /Dark mode/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Let’s talk about your project.",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("layouts reflow from 320px phone to desktop and at enlarged text", async ({
  page,
}, testInfo) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/contact");
    await expect(page.getByLabel("Your name", { exact: true })).toBeEnabled();
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    const overflow = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      elements: [...document.querySelectorAll("body *")]
        .filter(
          (element) =>
            element.getBoundingClientRect().right > window.innerWidth + 1,
        )
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
        }))
        .slice(0, 5),
    }));
    expect(
      overflow.page,
      JSON.stringify({ width, ...overflow }),
    ).toBeLessThanOrEqual(width);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (width === 320)
      await page.screenshot({
        path: testInfo.outputPath("contact-320px-enlarged-text.png"),
      });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  }
});
test("protected pages redirect to sign-in without exposing owner content", async ({
  page,
}) => {
  await page.goto("/admin/enquiries");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in.");
});

test("provider outages keep the portfolio fallback and contact navigation usable", async ({
  page,
}) => {
  await page.goto("/projects?q=synthetic-outage");
  await expect(
    page.getByRole("heading", {
      name: "Projects are temporarily unavailable.",
    }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
});

test("saved theme is restored when an early theme attribute is lost", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("em-theme", "dark");
    const observer = new MutationObserver(() => {
      if (document.documentElement?.hasAttribute("data-theme")) {
        document.documentElement.removeAttribute("data-theme");
        observer.disconnect();
      }
    });
    observer.observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  });
  await page.goto("/contact");
  await expect(page.getByLabel("Your name", { exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Dark mode/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("theme controls still work when browser storage is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Synthetic blocked storage", "SecurityError");
      },
    });
  });
  await page.goto("/contact");
  await expect(page.getByLabel("Your name", { exact: true })).toBeEnabled();
  const toggle = page.getByRole("button", { name: /Dark mode/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("privacy notice follows runtime intake availability after a backend-free build", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(
    page.getByText("Online enquiry and review submissions are enabled.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Online enquiry and review submissions are currently switched off.",
      { exact: false },
    ),
  ).toHaveCount(0);
});
