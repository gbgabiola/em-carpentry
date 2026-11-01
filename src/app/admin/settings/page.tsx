import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import { saveBusiness } from "@/features/business/actions";
export default async function AdminSettingsPage() {
  const client = await requireAdmin();
  const settings = await client
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (settings.error) throw new Error("Business settings unavailable");
  return (
    <div className="page-stack">
      <h1>Business information</h1>
      <p>
        Publish only verified claims. Core telephone, email, name and Facebook
        links remain in the verified site configuration.
      </p>
      <ActionForm action={saveBusiness}>
        <label>
          About the business
          <textarea
            name="about_text"
            rows={8}
            required
            maxLength={3000}
            defaultValue={settings.data.about_text}
          />
        </label>
        <label>
          Service area
          <input
            name="service_area"
            required
            maxLength={200}
            defaultValue={settings.data.service_area}
          />
        </label>
      </ActionForm>
    </div>
  );
}
