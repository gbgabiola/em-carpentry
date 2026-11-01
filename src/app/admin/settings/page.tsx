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
        Publish only verified business information. Contact links update across
        the site. The business name and original logo remain in the verified
        brand configuration.
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
        <label>
          Australian business telephone
          <input
            name="phone"
            type="tel"
            required
            maxLength={30}
            defaultValue={settings.data.phone}
            placeholder="+61 497 175 163"
          />
        </label>
        <label>
          Business email
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            defaultValue={settings.data.email}
          />
        </label>
        <label>
          Business Facebook page
          <input
            name="facebook_url"
            type="url"
            required
            maxLength={2048}
            defaultValue={settings.data.facebook_url}
          />
          <small>Use the business page, not a personal profile.</small>
        </label>
      </ActionForm>
    </div>
  );
}
