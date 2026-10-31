import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/sections/PageIntro";
export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Contact details, service area and quotation information for EM Carpentry & Home Maintenance.",
};
const faqs = [
  {
    question: "Which areas do you serve?",
    answer:
      "Geelong, Victoria, and nearby areas. Contact the business to discuss your location.",
  },
  {
    question: "How can I request a quote?",
    answer:
      "Call, email or visit the business Facebook page using the contact page. A brief description of the work and your general suburb will help start the conversation.",
  },
  {
    question: "How long has the business operated in Australia?",
    answer:
      "EM Carpentry & Home Maintenance has operated in Australia since 2018.",
  },
  {
    question: "Can I see examples of completed work?",
    answer:
      "Approved project photos and descriptions will be added to the portfolio. In the meantime, ask the business about examples relevant to your project.",
  },
];
export default function FaqPage() {
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Good to know"
        title="A few common questions."
        description="A starting point for your enquiry. For anything specific to your project, get in touch."
      />
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
      <p>
        Have another question?{" "}
        <Link href="/contact" className="text-link">
          Contact the business.
        </Link>
      </p>
    </div>
  );
}
