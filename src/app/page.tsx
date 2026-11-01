import { getServices } from "@/features/content/data";
import { getProjects } from "@/features/projects/data";
import { ProjectCards } from "@/components/projects/ProjectCards";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { BusinessStructuredData } from "@/components/sections/BusinessStructuredData";
import Image from "next/image";
import Link from "next/link";
import { ContactCta } from "@/components/sections/ContactCta";

export const metadata = createPageMetadata(
  "/",
  siteConfig.name,
  siteConfig.description,
);

export default async function HomePage() {
  const [featured, services] = await Promise.all([
    getProjects({ featured: true }),
    getServices(),
  ]);
  return (
    <div className="page-stack">
      <BusinessStructuredData />
      <section className="home-hero" aria-labelledby="home-heading">
        <div>
          <p className="eyebrow">Geelong &amp; nearby areas · Since 2018</p>
          <h1 id="home-heading">
            EM Carpentry
            <span className="hero-secondary">&amp; Home Maintenance</span>
          </h1>
          <p className="intro-copy">
            Neat workmanship. Attention to detail. A willingness to go the extra
            mile.
          </p>
          <p className="hero-description">
            Carpentry and home maintenance for homeowners, landlords, businesses
            and contractors. Operating in Australia since 2018.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/contact">
              Discuss your project <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/about">
              Meet the business
            </Link>
          </div>
        </div>
        <div className="hero-brand">
          <Image
            src="/images/brand/em-logo.webp"
            alt="EM Carpentry & Home Maintenance logo in gold on a dark brown background"
            width={800}
            height={800}
            sizes="(max-width: 760px) 90vw, 42vw"
            preload
          />
          <p>Carpentry &amp; home maintenance · Geelong, Victoria</p>
        </div>
      </section>
      <section className="editorial-section" aria-labelledby="approach-heading">
        <p className="eyebrow">Our approach</p>
        <div>
          <h2 id="approach-heading">Care in the details.</h2>
          <p className="section-copy">
            The business is built around neat workmanship and attention to
            detail, with a willingness to go the extra mile. Tell us about your
            space and the work you have in mind.
          </p>
          <Link className="text-link" href="/services">
            Discuss the work you need <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      {services.services.length > 0 && (
        <section aria-labelledby="services-heading">
          <p className="eyebrow">How we can help</p>
          <h2 id="services-heading">Services for your space.</h2>
          <div className="project-grid">
            {services.services.slice(0, 3).map((service) => (
              <article key={service.id} className="empty-panel">
                <h3>
                  <Link href={`/services#${service.slug}`}>{service.name}</Link>
                </h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <section
        className="portfolio-preview"
        aria-labelledby="portfolio-heading"
      >
        <div>
          <p className="eyebrow">Portfolio</p>
          <h2 id="portfolio-heading">A closer look at the work.</h2>
        </div>
        {featured.projects.length ? (
          <ProjectCards projects={featured.projects} />
        ) : (
          <div className="empty-panel">
            <span className="placeholder-label">Portfolio coming soon</span>
            <p>
              Completed projects and approved photos will be added here. Contact
              the business to discuss examples relevant to your project.
            </p>
            <Link className="text-link" href="/projects">
              Visit the portfolio <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>
      <ContactCta />
    </div>
  );
}
