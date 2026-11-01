import type { Service, Faq } from "@/types/database";
export function ContentStatusFields({
  entry,
}: {
  entry?: Pick<Service, "display_order" | "status" | "publication_confirmed">;
}) {
  return (
    <>
      <label>
        Order
        <input
          name="display_order"
          type="number"
          min={0}
          max={999}
          defaultValue={entry?.display_order || 0}
          required
        />
      </label>
      <label>
        Status
        <select name="status" defaultValue={entry?.status || "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label className="checkbox-label">
        <input
          name="publication_confirmed"
          type="checkbox"
          defaultChecked={entry?.publication_confirmed}
        />
        I confirm that this information is accurate and approved for
        publication.
      </label>
    </>
  );
}
export function ServiceFields({ service }: { service?: Service }) {
  return (
    <>
      {service && <input type="hidden" name="id" value={service.id} />}
      <label>
        Offered service
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={service?.name}
        />
      </label>
      <label>
        Link anchor
        <input
          name="slug"
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          defaultValue={service?.slug}
          placeholder="approved-service-name"
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          required
          maxLength={1500}
          rows={5}
          defaultValue={service?.description}
        />
      </label>
      <ContentStatusFields entry={service} />
    </>
  );
}
export function FaqFields({ faq }: { faq?: Faq }) {
  return (
    <>
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <label>
        Question
        <input
          name="question"
          required
          maxLength={200}
          defaultValue={faq?.question}
        />
      </label>
      <label>
        Answer
        <textarea
          name="answer"
          required
          maxLength={3000}
          rows={5}
          defaultValue={faq?.answer}
        />
      </label>
      <ContentStatusFields entry={faq} />
    </>
  );
}
