import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section aria-labelledby="home-heading" className="max-w-3xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Website in preparation</p>
        <h1 id="home-heading" className="text-4xl font-semibold leading-tight sm:text-6xl">{siteConfig.name}</h1>
        <p className="text-lg text-muted">{siteConfig.description}</p>
        <p>Neat workmanship, attention to detail and a willingness to go the extra mile.</p>
        <p className="text-sm text-muted">Project photos and approved service information will be added as the website takes shape.</p>
      </section>
      <section id="contact" aria-labelledby="contact-heading" className="rounded-2xl border border-line bg-surface p-6 sm:p-10">
        <h2 id="contact-heading" className="text-2xl font-semibold">Discuss your project</h2>
        <p className="mt-3 text-muted">Contact the business directly to discuss your needs or request a quote.</p>
        <ul className="mt-6 flex flex-wrap gap-5">
          <li><a href={siteConfig.contact.phoneHref}>Call {siteConfig.contact.phone}</a></li>
          <li><a href={siteConfig.contact.emailHref}>Email us</a></li>
          <li><a href={siteConfig.contact.facebookHref}>Visit our Facebook page</a></li>
        </ul>
      </section>
    </div>
  );
}
