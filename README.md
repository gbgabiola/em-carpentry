# EM Carpentry & Home Maintenance

Local project scaffold based on AGENTS.md. Next.js App Router, React, strict TypeScript and Tailwind CSS. This is an initialisation checkpoint, not the complete business website.

## Requirements and quick start

Use Node.js 24 LTS and npm 11 (see .nvmrc and package.json). From this directory:

```sh
nvm use # if using nvm; install Node 24 first if needed
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. In WSL, run these commands inside Linux with a Linux Node installation; do not mix Windows and Linux node_modules.

## Quality checks

```sh
npm run lint
npm run typecheck
npm run build
# Or run all three:
npm run check
```

npm start serves the production build. Typecheck generates Next.js route types before running TypeScript. No test runner is installed yet: add meaningful validation, permission and workflow tests when those features exist.

## Current scope

- Minimal responsive home page, shared header/footer and direct telephone, email and business Facebook links.
- Central verified business information and navigation in src/config/.
- Warm light-theme tokens in src/app/globals.css; final logo-derived colours and persistent theme switching are future work.
- ESLint flat configuration, Tailwind PostCSS integration, strict TypeScript and @/* imports.
- Search indexing disabled for the unfinished scaffold.

Only implemented routes appear in navigation. Public pages, project management, secure admin authentication, quotation forms, reviews, database/storage and theme switching remain to be built. No private submissions are collected or persisted. The supplied logo is referenced in AGENTS.md but is not in this checkout.

## Structure

- src/app/: App Router layout, starter home page, global styles and robots directives.
- src/components/layout/: shared page shell.
- src/config/: verified business details and implemented navigation.
- public/: approved public assets when available.
- docs/: architectural decisions, deployment gates and owner content guide.

Follow the target structure in AGENTS.md as features are implemented. Empty features/, lib/, types/, test/ and asset directories are deliberately deferred.

## Configuration and launch

.env.example documents the reserved SITE_URL setting. It is not consumed yet; canonical URLs, sitemap and Open Graph metadata should be implemented once the public origin is approved. No backend provider, hosting account, email provider or domain is configured. Never commit .env.local or privileged credentials.

See [deployment](docs/deployment.md), [initial decision](docs/decisions/0001-project-foundation.md) and [owner content guide](docs/content-guide.md). Hosting and backend eligibility, current free-tier limits and Australian privacy implications must be researched before provider selection. Production deployment requires explicit authorisation.

## Initial validation notes

Lint, route type generation, strict TypeScript and the production build passed. npm ci --dry-run --ignore-scripts also succeeded. No automated test suite exists at this configuration-only checkpoint.

The initial full npm audit reports 15 moderate development-tool findings through minimatch in the ESLint dependency graph; npm audit --omit=dev reports zero vulnerabilities. Do not use npm audit fix --force: its proposed ESLint downgrade breaks this configuration. Recheck upstream updates during maintenance. ESLint 10 is accepted by eslint-config-next and passes lint, but bundled import, React and accessibility plugins still declare ESLint 9 peer ranges, so npm emits peer warnings during installation.
