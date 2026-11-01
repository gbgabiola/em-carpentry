import Image from "next/image";
import { notFound } from "next/navigation";
import { getProject } from "@/features/projects/data";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ContactCta } from "@/components/sections/ContactCta";
async function findProject(slug: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  return getProject(slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await findProject(slug);
  return project
    ? createPageMetadata(
        `/projects/${project.slug}`,
        project.title,
        project.summary,
      )
    : { title: "Project not found", robots: { index: false, follow: false } };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) notFound();
  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="eyebrow">{project.category || "Completed work"}</p>
        <h1>{project.title}</h1>
        <p className="intro-copy">{project.summary}</p>
        {project.location && <p>{project.location}</p>}
        {project.completion_date && (
          <p>
            Completed:{" "}
            {new Intl.DateTimeFormat("en-AU", {
              month: "long",
              year: "numeric",
              timeZone: "Australia/Melbourne",
            }).format(new Date(`${project.completion_date}T00:00:00Z`))}
          </p>
        )}
      </header>
      <div className="prose-block preserve-lines">{project.description}</div>
      <div className="project-grid">
        {project.images.map((image) => (
          <figure key={image.id}>
            <Image
              src={`/media/${image.id}`}
              alt={image.alt}
              width={1600}
              height={1200}
              className="portfolio-image"
              unoptimized
            />
            <figcaption>
              {image.role !== "gallery" && (
                <strong>
                  {image.role === "before" ? "Before: " : "After: "}
                </strong>
              )}
              {image.alt}
            </figcaption>
          </figure>
        ))}
      </div>
      <ContactCta />
    </div>
  );
}
