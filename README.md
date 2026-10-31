# EM Carpentry & Home Maintenance

Public-page development checkpoint based on AGENTS.md. Next.js App Router, React, strict TypeScript and Tailwind CSS, with Biome for linting and formatting.

## Run locally

Use Node.js 24 LTS and npm 11. In WSL, use Linux Node and keep node_modules inside the Linux filesystem.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Production preview: npm run build followed by npm start.

## Quality checks

```sh
npm run check
npm test
npm audit
```

check runs lint, route type generation/strict TypeScript and production build. Tests use Node’s built-in runner against the production build; run check first. They start and stop a local server automatically, test public navigation/contact/error journeys and check text-token contrast in both themes. Run npm run format to format source. Browser QA is separate; HTTP tests cannot verify interactive theme persistence or responsive appearance.

## Implemented

- Home, About, Services, Projects, Reviews, Contact, FAQ and preview Privacy pages, each with metadata; friendly 404.
- Responsive shared navigation/footer and the supplied logo in an optimised, proportion-preserving WebP.
- Ivory/walnut/gold design tokens and keyboard focus/skip navigation.
- Persistent dark mode using em-theme in browser localStorage. Light is the default; saved choice is applied before paint. Blocked storage does not disable switching. Preference changes sync between tabs.
- Direct phone, email and business Facebook links. No unverified Messenger deep link.
- Honest empty states for unapproved service inventory, project content and reviews.
- Incomplete content remains noindex, with robots disallowing crawling.

## Configuration and structure

Verified business data and navigation live in src/config/. Layout components live in src/components/layout/ and shared page sections in src/components/sections/. Routes live in src/app/. Theme tokens live in src/app/globals.css. src/test/ holds production-route and contrast checks. Add domain-specific features/ and lib/ directories when real backend functionality needs them.

.env.example reserves SITE_URL for the approved public origin. It is not consumed yet; canonical URLs, sitemap, structured data and Open Graph metadata are deferred to the SEO/launch checkpoint. Never commit credentials or customer data.

## Still pending

Owner-approved services, projects/photos and publication rights; authenticated owner management; database/storage; server-validated enquiry/review forms, moderation and rate limiting; project filters/details/before-after views; launch SEO and privacy review; deployment and final handover. The privacy page describes the current preview only. No website submissions are collected or stored.

See [provider comparison](docs/decisions/0002-provider-comparison.md), [lint decision](docs/decisions/0003-lint-toolchain.md), [deployment](docs/deployment.md), and [owner content guide](docs/content-guide.md). No provider has been provisioned, no paid service selected and no production deployment made.

## Checkpoint verification

A clean npm ci, lint, strict typecheck, production build, all 13 production-route/contrast checks, full npm audit (zero findings) and npm ls --all passed on 1 November 2026. Browser automation could not initialise because the local UI runtime failed before opening a browser. Visual checks at phone/tablet/desktop widths, keyboard operation, FAQ interaction and saved-theme reload behaviour still need browser verification. No performance score or full WCAG conformance is claimed.
