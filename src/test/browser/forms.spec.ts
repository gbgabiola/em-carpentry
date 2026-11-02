import AxeBuilder from "@axe-core/playwright";
import { test, expect, fillEnquiry } from "./fixtures";
test("client errors identify and focus the first invalid enquiry field", async ({
  page,
}) => {
  await page.goto("/contact");
  const name = page.getByLabel("Your name", { exact: true });
  await expect(name).toBeEnabled();
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Please check the highlighted fields." }),
  ).toBeVisible();
});
test("pending enquiry disables duplicate sends and success is announced", async ({
  page,
}) => {
  let complete: () => void = () => {};
  const ready = new Promise<void>((resolve) => {
    complete = resolve;
  });
  let requests = 0;
  await page.route("**/api/enquiries", async (route) => {
    requests++;
    const input = route.request().postDataJSON();
    expect(input.data.contact_method).toBe("email");
    expect(input.data.contact_details).toBe("browser-fixture@example.test");
    await ready;
    await route.fulfill({
      status: 201,
      json: { success: "Synthetic enquiry received." },
    });
  });
  await page.goto("/contact");
  await fillEnquiry(page);
  try {
    await page
      .getByRole("button", { name: "Send enquiry", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Sending…", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Enter");
    expect(requests).toBe(1);
  } finally {
    complete();
  }
  const status = page
    .getByRole("status")
    .filter({ hasText: "Synthetic enquiry received." });
  await expect(status).toBeVisible();
  await expect(status).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeDisabled();
  expect(requests).toBe(1);
});
test("an uncertain response preserves the request identity and entered details", async ({
  page,
}) => {
  const submissions: unknown[] = [];
  await page.route("**/api/enquiries", async (route) => {
    submissions.push(route.request().postDataJSON());
    if (submissions.length === 1) return route.abort("failed");
    return route.fulfill({
      status: 200,
      json: { success: "Synthetic retry confirmed." },
    });
  });
  await page.goto("/contact");
  await fillEnquiry(page);
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "We could not confirm the submission." }),
  ).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Synthetic browser visitor",
  );
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Synthetic retry confirmed." }),
  ).toBeVisible();
  expect(submissions).toHaveLength(2);
  expect(submissions[0]).toEqual(submissions[1]);
});
test("expired form checks refresh without clearing entered information", async ({
  page,
}) => {
  const tokens: string[] = [];
  await page.route("**/api/enquiries", async (route) => {
    tokens.push(route.request().postDataJSON().token);
    if (tokens.length === 1)
      return route.fulfill({
        status: 400,
        json: { error: "Synthetic form check expired.", refreshToken: true },
      });
    return route.fulfill({
      status: 201,
      json: { success: "Synthetic refreshed enquiry received." },
    });
  });
  await page.goto("/contact");
  await fillEnquiry(page);
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await page
    .getByRole("button", { name: "Refresh form check", exact: true })
    .click();
  await expect(page.getByLabel("Your name", { exact: true })).toBeEnabled();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Synthetic browser visitor",
  );
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Synthetic refreshed enquiry received." }),
  ).toBeVisible();
  expect(tokens).toHaveLength(2);
  expect(tokens[0]).not.toBe(tokens[1]);
});
test("reviews require publication consent and submit a numeric rating", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/reviews", async (route) => {
    requests++;
    const input = route.request().postDataJSON();
    expect(input.data.rating).toBe(5);
    expect(input.data.consent).toBe(true);
    expect(input.data).not.toHaveProperty("status");
    await route.fulfill({
      status: 201,
      json: { success: "Synthetic feedback awaits moderation." },
    });
  });
  await page.goto("/reviews");
  await expect(page.getByLabel("Your rating", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Name to display with your review", { exact: true })
    .fill("Synthetic reviewer");
  await page.getByLabel("Your rating", { exact: true }).selectOption("5");
  await page
    .getByLabel("Your feedback", { exact: true })
    .fill("Synthetic feedback, not a customer testimonial.");
  await page
    .getByRole("button", { name: "Submit feedback", exact: true })
    .click();
  await expect(page.getByRole("checkbox")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(requests).toBe(0);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Submit feedback", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Synthetic feedback awaits moderation." }),
  ).toBeVisible();
  expect(requests).toBe(1);
});
test("form-check failures keep direct contact options usable", async ({
  page,
}) => {
  await page.route("**/api/intake/token?*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Synthetic unavailable security check." },
    }),
  );
  await page.goto("/contact");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "The form is temporarily unavailable." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeDisabled();
  const contacts = page.getByRole("region", { name: "Get in touch" });
  await expect(contacts.locator('a[href="tel:+61497175163"]')).toBeVisible();
  await expect(
    contacts.locator('a[href="mailto:emcarpentry.maintenance@gmail.com"]'),
  ).toBeVisible();
});

test("submission limits preserve entered details and allow direct follow-up", async ({
  page,
}) => {
  await page.route("**/api/enquiries", (route) =>
    route.fulfill({
      status: 429,
      json: {
        error:
          "Synthetic submission limit reached. Please contact the business directly.",
      },
    }),
  );
  await page.goto("/contact");
  await fillEnquiry(page);
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Synthetic submission limit reached." }),
  ).toBeFocused();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Synthetic browser visitor",
  );
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeEnabled();
});
test("server validation errors focus the affected field after rendering", async ({
  page,
}) => {
  await page.route("**/api/enquiries", (route) =>
    route.fulfill({
      status: 422,
      json: {
        error: "Please check the highlighted fields.",
        fieldErrors: { contact_details: "Synthetic contact validation error." },
      },
    }),
  );
  await page.goto("/contact");
  await fillEnquiry(page);
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  const contact = page.getByLabel("Email address", { exact: true });
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("Synthetic contact validation error.", { exact: true }),
  ).toBeVisible();
});
