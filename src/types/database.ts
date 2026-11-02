export type ContentStatus = "draft" | "published" | "archived";
export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  status: ContentStatus;
  publication_confirmed: boolean;
  created_at: string;
};
export type Faq = {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  status: ContentStatus;
  publication_confirmed: boolean;
  created_at: string;
};
export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  completion_date: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  comparison_enabled: boolean;
  created_at: string;
  updated_at: string;
};
export type ProjectImage = {
  id: string;
  project_id: string;
  path: string;
  alt: string;
  display_order: number;
  role: "gallery" | "before" | "after";
  created_at: string;
};
export type Review = {
  id: string;
  display_name: string;
  rating: number | null;
  body: string;
  source: "website" | "facebook";
  source_url: string | null;
  consent: boolean;
  status: "pending" | "approved" | "rejected";
  retention_started_at: string | null;
  retention_expires_at: string | null;
  created_at: string;
};
export type Enquiry = {
  id: string;
  name: string;
  contact_method: "email" | "phone";
  contact_details: string;
  description: string;
  suburb: string;
  status: "new" | "reviewed" | "closed";
  closed_at: string | null;
  retention_expires_at: string | null;
  created_at: string;
};
export type BusinessSettings = {
  id: number;
  about_text: string;
  service_area: string;
  phone: string;
  email: string;
  facebook_url: string;
};
type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};
export interface Database {
  public: {
    Tables: {
      services: Table<Service>;
      faqs: Table<Faq>;
      projects: Table<Project>;
      project_images: Table<ProjectImage>;
      reviews: Table<Review>;
      enquiries: Table<Enquiry>;
      business_settings: Table<BusinessSettings>;
    };
    Views: { [_ in never]: never };
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
