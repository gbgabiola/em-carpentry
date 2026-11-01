import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import { ServiceFields, FaqFields } from "@/components/forms/ContentFields";
import { saveService, saveFaq } from "@/features/content/actions";
export default async function ContentPage() {
  const client = await requireAdmin();
  const [services, faqs] = await Promise.all([
    client
      .from("services")
      .select("*")
      .order("display_order")
      .order("created_at"),
    client.from("faqs").select("*").order("display_order").order("created_at"),
  ]);
  if (services.error || faqs.error)
    throw new Error(
      "Public content is unavailable. Apply the owner-content migration.",
    );
  return (
    <div className="page-stack">
      <h1>Services &amp; FAQs</h1>
      <p>
        Create drafts first. Publish only services the business actually offers
        and verified answers. Archive an entry to hide it without losing its
        text.
      </p>
      <section>
        <h2>Add a service</h2>
        <ActionForm action={saveService} label="Create service">
          <ServiceFields />
        </ActionForm>
      </section>
      <section>
        <h2>Manage services</h2>
        {!services.data.length && <p>No service inventory has been entered.</p>}
        {services.data.map((service) => (
          <details key={service.id} className="content-editor">
            <summary>
              {service.name} · {service.status}
            </summary>
            <ActionForm action={saveService}>
              <ServiceFields service={service} />
            </ActionForm>
          </details>
        ))}
      </section>
      <section>
        <h2>Add a question</h2>
        <ActionForm action={saveFaq} label="Create FAQ">
          <FaqFields />
        </ActionForm>
      </section>
      <section>
        <h2>Manage FAQs</h2>
        <p>
          The initial answers are drafts copied from verified site information.
          Review each before publishing.
        </p>
        {faqs.data.map((faq) => (
          <details key={faq.id} className="content-editor">
            <summary>
              {faq.question} · {faq.status}
            </summary>
            <ActionForm action={saveFaq}>
              <FaqFields faq={faq} />
            </ActionForm>
          </details>
        ))}
      </section>
    </div>
  );
}
