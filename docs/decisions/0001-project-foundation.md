# 0001: Local project foundation

Status: accepted for local scaffolding only.

The initial directory contained AGENTS.md and no application, package manager lockfile or Git repository. There were no existing conventions conflicting with the proposed frontend stack.

Use Next.js App Router, React, strict TypeScript, Tailwind CSS with its PostCSS plugin and npm with a committed lockfile. Use Server Components by default. Use system fonts to avoid build-time font downloads. No additional form, UI, database, authentication or testing dependencies are needed at this checkpoint.

Use the existing project directory as the application root. Add real feature directories as needed rather than duplicating a nested em-carpentry directory or tracking empty folders. Keep the unfinished scaffold out of search indexing.

Backend, image storage, email delivery, hosting and domain remain undecided. Before backend implementation, compare current commercial-use eligibility, quotas, storage and egress, email capabilities, inactivity/deletion policies, Australian privacy/data location implications and export/migration options. Do not assume a hobby plan permits business use or a free tier is unlimited.

References checked during initialisation:

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)

Dependency patch versions are recorded in package-lock.json. Review updates and security advisories as part of future maintenance.

Update: the public-page checkpoint replaces ESLint with Biome; see decision 0003. Provider research is in decision 0002; provisioning and backend implementation remain gated.
