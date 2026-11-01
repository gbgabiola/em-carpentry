import Link from "next/link";
import Image from "next/image";
import type { PortfolioProject } from "@/features/projects/data";
export function ProjectCards({ projects }: { projects: PortfolioProject[] }) {
  return (
    <div className="project-grid">
      {projects.map((project) => (
        <article key={project.id} className="project-card">
          {project.images[0] && (
            <Link
              href={`/projects/${project.slug}`}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Image
                src={`/media/${project.images[0].id}`}
                alt=""
                width={800}
                height={600}
                className="portfolio-image"
                unoptimized
              />
            </Link>
          )}
          <p className="eyebrow">{project.category || "Completed work"}</p>
          <h2>
            <Link href={`/projects/${project.slug}`}>{project.title}</Link>
          </h2>
          <p>{project.summary}</p>
          {project.location && (
            <p className="text-sm text-muted">{project.location}</p>
          )}
        </article>
      ))}
    </div>
  );
}
