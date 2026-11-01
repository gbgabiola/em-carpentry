import type { Project } from "@/types/database";
export function ProjectFields({ project }: { project?: Project }) {
  return (
    <>
      {project && <input type="hidden" name="id" value={project.id} />}
      <label>
        Title
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={project?.title}
        />
      </label>
      <label>
        URL slug
        <input
          name="slug"
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="project-name"
          defaultValue={project?.slug}
        />
        <small>
          Lower-case words separated by hyphens; changing a published slug
          changes its address.
        </small>
      </label>
      <label>
        Summary
        <textarea
          name="summary"
          required
          maxLength={300}
          defaultValue={project?.summary}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          required
          maxLength={10000}
          rows={8}
          defaultValue={project?.description}
        />
      </label>
      <label>
        Category
        <input
          name="category"
          maxLength={80}
          defaultValue={project?.category}
        />
      </label>
      <label>
        General location (optional)
        <input
          name="location"
          maxLength={120}
          defaultValue={project?.location}
        />
        <small>Use a suburb, not a private street address.</small>
      </label>
      <label>
        Completion date (optional)
        <input
          name="completion_date"
          type="date"
          defaultValue={project?.completion_date || ""}
        />
      </label>
      <label>
        Publication status
        <select name="status" defaultValue={project?.status || "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label className="checkbox-label">
        <input
          name="featured"
          type="checkbox"
          defaultChecked={project?.featured}
        />
        Feature on Home
      </label>
      <label className="checkbox-label">
        <input
          name="comparison_enabled"
          type="checkbox"
          defaultChecked={project?.comparison_enabled}
        />
        Enable a before-and-after comparison. Use exactly one Before and one
        After photo with matching viewpoint and framing.
      </label>
    </>
  );
}
