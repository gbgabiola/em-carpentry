import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { idSchema } from "@/lib/validation/schemas";
import { ActionForm } from "@/components/forms/ActionForm";
import { ProjectFields } from "@/components/projects/ProjectFields";
import {
  saveProject,
  uploadImage,
  removeImage,
  updateImage,
} from "@/features/projects/actions";
export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const client = await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const project = await client
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (project.error) notFound();
  const images = await client
    .from("project_images")
    .select("*")
    .eq("project_id", id)
    .order("display_order");
  if (images.error) throw new Error("Photos unavailable");
  return (
    <div className="page-stack">
      <h1>Edit project</h1>
      <ActionForm action={saveProject}>
        <ProjectFields project={project.data} />
      </ActionForm>
      <section>
        <h2>Photos</h2>
        <p>
          Uploads are converted to WebP and location metadata is stripped. Only
          published projects expose their images to visitors. Archive the
          project to hide all photos.
        </p>
        <div className="project-grid">
          {images.data.map((image) => (
            <div className="empty-panel" key={image.id}>
              <Image
                src={`/media/${image.id}`}
                alt={image.alt}
                width={600}
                height={400}
                unoptimized
                className="portfolio-image"
              />
              <p>
                {image.alt} · {image.role} · Order {image.display_order}
              </p>
              <p>
                <a
                  className="text-link"
                  href={`/media/${image.id}`}
                  download={`${image.id}.webp`}
                >
                  Download photo for backup
                </a>
              </p>
              <ActionForm action={updateImage} label="Save photo details">
                <input type="hidden" name="id" value={image.id} />
                <input type="hidden" name="project_id" value={id} />
                <label>
                  Image description
                  <input
                    name="alt"
                    required
                    maxLength={250}
                    defaultValue={image.alt}
                  />
                </label>
                <label>
                  Order
                  <input
                    name="display_order"
                    type="number"
                    min={0}
                    max={999}
                    required
                    defaultValue={image.display_order}
                  />
                </label>
                <label>
                  Role
                  <select name="role" defaultValue={image.role}>
                    <option value="gallery">Gallery</option>
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>
                </label>
              </ActionForm>
              <ActionForm action={removeImage} label="Remove photo permanently">
                <input type="hidden" name="id" value={image.id} />
              </ActionForm>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Add a photo</h2>
        <ActionForm action={uploadImage} label="Upload photo">
          <input type="hidden" name="project_id" value={id} />
          <label>
            Photo (JPEG, PNG or WebP, up to 5 MB)
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label>
            Image description
            <input name="alt" required maxLength={250} />
          </label>
          <label>
            Order
            <input
              name="display_order"
              type="number"
              min={0}
              max={999}
              defaultValue={0}
              required
            />
          </label>
          <label>
            Role
            <select name="role">
              <option value="gallery">Gallery</option>
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="rights" required />I have permission to
            publish this photo and any identifying details.
          </label>
        </ActionForm>
      </section>
    </div>
  );
}
