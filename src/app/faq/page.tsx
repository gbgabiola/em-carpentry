import Link from "next/link";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { getFaqs } from "@/features/content/data";
export const metadata = createPageMetadata(
  "/faq",
  "Frequently asked questions",
  "Contact details, service area and quotation information for EM Carpentry & Home Maintenance.",
);
export default async function FaqPage() {
  const data = await getFaqs();
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Good to know"
        title="A few common questions."
        description="A starting point for your enquiry. For anything specific to your project, get in touch."
      />
      {data.unavailable && (
        <p role="status">
          Updated answers are temporarily unavailable. Please contact the
          business to confirm the information you need.
        </p>
      )}
      {data.faqs.length ? (
        <div className="faq-list">
          {data.faqs.map((faq) => (
            <details key={faq.id}>
              <summary>{faq.question}</summary>
              <p className="preserve-lines">{faq.answer}</p>
            </details>
          ))}
        </div>
      ) : !data.unavailable ? (
        <p>
          Answers are being reviewed. Please contact the business with your
          question.
        </p>
      ) : null}
      <p>
        Have another question?{" "}
        <Link href="/contact" className="text-link">
          Contact the business.
        </Link>
      </p>
    </div>
  );
}
