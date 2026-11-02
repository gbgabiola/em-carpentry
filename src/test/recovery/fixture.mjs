import sharp from "sharp";

export const recoveryTables = [
  "projects",
  "project_images",
  "reviews",
  "enquiries",
  "business_settings",
  "services",
  "faqs",
];
export const fixtureId = (number) =>
  `70000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
export const sourceOwner = fixtureId(9001);
export const replacementOwner = fixtureId(9002);
export const outsider = fixtureId(9003);

export async function createRecoveryFixture(now) {
  const day = 86400000;
  // Include sub-millisecond precision to detect accidental JS Date round-tripping.
  const at = (days) =>
    new Date(now + days * day).toISOString().replace(/(\.\d{3})Z$/, "$1456Z");
  const created = at(-110);
  const identity = (number) => ({ id: fixtureId(number), created_at: created });
  const projects = ["published", "draft", "archived"].map((status, index) => ({
    ...identity(index + 1),
    slug: `synthetic-recovery-${status}`,
    title: `Synthetic ${status} project`,
    summary: "Synthetic recovery rehearsal entry.",
    description: "Synthetic content only; not a real business project.",
    category: "",
    location: "",
    completion_date: null,
    status,
    featured: status === "published",
    comparison_enabled: false,
    updated_at: created,
  }));
  const images = projects.map((project, index) => ({
    ...identity(index + 21),
    project_id: project.id,
    // The downloaded image-record filename deliberately differs from its object path.
    path: `${project.id}/${fixtureId(index + 101)}.webp`,
    alt: "Synthetic colour-block recovery fixture",
    display_order: 0,
    role: "gallery",
  }));
  const review = (number, status, consent, start, end) => ({
    ...identity(number),
    display_name: "SYNTHETIC-RECOVERY-REVIEWER",
    rating: 4,
    body: "Synthetic recovery feedback, not a real customer testimonial.",
    source: "website",
    source_url: null,
    status,
    consent,
    retention_started_at: start,
    retention_expires_at: end,
  });
  const enquiry = (number, status, closed, end) => ({
    ...identity(number),
    name: "SYNTHETIC-RECOVERY-CUSTOMER",
    contact_method: "email",
    contact_details: "recovery-fixture@example.test",
    description:
      "Synthetic private enquiry used only in the offline rehearsal.",
    suburb: "",
    status,
    closed_at: closed,
    retention_expires_at: end,
  });
  const content = {
    projects,
    project_images: images,
    reviews: [
      review(41, "approved", true, null, null),
      review(42, "pending", true, at(-20), at(10)),
      review(43, "rejected", false, at(-20), at(10)),
      review(44, "pending", true, at(-31), at(-1)),
    ],
    enquiries: [
      enquiry(51, "new", null, null),
      enquiry(52, "closed", at(-80), at(10)),
      enquiry(53, "closed", at(-90), at(0)),
    ],
    business_settings: [
      {
        id: 1,
        about_text: "Synthetic recovery business fixture.",
        service_area: "Synthetic test area",
        phone: "+61000000000",
        email: "synthetic-business@example.test",
        facebook_url: "https://www.facebook.com/synthetic-recovery-fixture",
      },
    ],
    services: ["published", "draft"].map((status, index) => ({
      ...identity(index + 61),
      name: `Synthetic ${status} service`,
      slug: `synthetic-service-${status}`,
      description: "Synthetic service fixture.",
      display_order: index,
      status,
      publication_confirmed: status === "published",
    })),
    faqs: ["published", "draft"].map((status, index) => ({
      ...identity(index + 71),
      question: `Synthetic ${status} question?`,
      answer: "Synthetic recovery answer.",
      display_order: index,
      status,
      publication_confirmed: status === "published",
    })),
  };
  const photos = new Map();
  for (const [index, image] of images.entries()) {
    photos.set(
      image.path,
      await sharp({
        create: {
          width: 32,
          height: 24,
          channels: 3,
          background: ["#70523a", "#c6a466", "#f0eadf"][index],
        },
      })
        .webp()
        .toBuffer(),
    );
  }
  return { content, photos };
}
