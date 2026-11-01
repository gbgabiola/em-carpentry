import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { ActionForm } from "@/components/forms/ActionForm";
import { ProjectFields } from "@/components/projects/ProjectFields";
import { saveProject } from "@/features/projects/actions";
export default async function AdminProjectsPage() {
  const client = await requireAdmin();
  const result = await client
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (result.error) throw new Error("Projects unavailable");
  return (
    <div className="page-stack">
      <h1>Projects</h1>
      <ul className="record-list">
        {result.data.map((project) => (
          <li key={project.id}>
            <strong>{project.title}</strong>
            <span>{project.status}</span>
            <Link className="text-link" href={`/admin/projects/${project.id}`}>
              Edit and manage photos
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <h2>Create a project</h2>
        <p>Start with a draft. Add approved photos before publishing.</p>
        <ActionForm action={saveProject} label="Create project">
          <ProjectFields />
        </ActionForm>
      </section>
    </div>
  );
}
