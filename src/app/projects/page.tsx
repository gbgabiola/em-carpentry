import Link from "next/link";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageIntro } from "@/components/sections/PageIntro";
import { ContactCta } from "@/components/sections/ContactCta";
import { ProjectCards } from "@/components/projects/ProjectCards";
import { getProjects } from "@/features/projects/data";
export const metadata = createPageMetadata(
  "/projects",
  "Projects",
  "Browse published carpentry and home maintenance projects from EM Carpentry & Home Maintenance in Geelong and nearby areas.",
);
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const search = await searchParams;
  const query =
    typeof search.q === "string" ? search.q.trim().slice(0, 100) : "";
  const category =
    typeof search.category === "string"
      ? search.category.trim().slice(0, 80)
      : "";
  const page = Math.min(
    10000,
    Math.max(0, Number.parseInt(search.page || "0", 10) || 0),
  );
  const data = await getProjects({ query, category, page });
  const pageUrl = (p: number) =>
    "/projects?" +
    new URLSearchParams({ q: query, category, page: String(p) }).toString();
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="The portfolio"
        title="See the details."
        description="Completed work, the spaces behind it and the details that make a difference."
      />
      <form className="project-search" action="/projects">
        <label>
          Search projects
          <input type="search" name="q" maxLength={100} defaultValue={query} />
        </label>
        <label>
          Category
          <input
            name="category"
            maxLength={80}
            defaultValue={category}
            placeholder="All categories"
          />
        </label>
        <button type="submit" className="button button-primary">
          Search
        </button>
      </form>
      {data.unavailable ? (
        <section className="empty-panel" role="status">
          <h2>Projects are temporarily unavailable.</h2>
          <p>
            Please contact the business to discuss examples of completed work.
          </p>
        </section>
      ) : data.projects.length ? (
        <ProjectCards projects={data.projects} />
      ) : (
        <section className="empty-panel">
          <span className="placeholder-label">
            {query || category || page
              ? "No matching projects"
              : "No projects published yet"}
          </span>
          <h2>Our portfolio is taking shape.</h2>
          <p>
            Authentic project photographs and descriptions appear here only
            after approval.
          </p>
        </section>
      )}
      <nav aria-label="Project pages" className="button-row">
        {page > 0 && (
          <Link className="text-link" href={pageUrl(page - 1)}>
            Previous page
          </Link>
        )}
        {data.hasMore && (
          <Link className="text-link" href={pageUrl(page + 1)}>
            Next page
          </Link>
        )}
      </nav>
      <ContactCta />
    </div>
  );
}
