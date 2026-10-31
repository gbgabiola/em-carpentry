# 0003: Use Biome for linting and formatting

Status: accepted for the public-page checkpoint, 1 November 2026.

The initial ESLint 10 configuration passed lint but bundled React/import/accessibility plugins declared incompatible peer ranges. The full audit also reported moderate minimatch findings in that development dependency graph. Downgrading to unsupported ESLint 9 or forcing a major transitive minimatch replacement would not give a clean, maintained baseline.

Use the maintained Biome linter/formatter with recommended rules and explicit Next.js and React domains. Retain strict TypeScript and the Next.js production build as separate quality gates. This changes development tooling only; Next.js App Router, React, TypeScript, Tailwind and npm remain unchanged. AGENTS.md requires linting, not a particular linter. No Biome-only rule should be treated as a substitute for browser accessibility checks or server-side security tests.

The dependency install removed the ESLint graph and reported no audit findings or peer conflicts. Run npm run lint, npm run typecheck, npm test and npm run build for this checkpoint. Run npm run format for consistent formatting.

References: [Next.js installation and linting](https://nextjs.org/docs/app/getting-started/installation), [Biome domains](https://biomejs.dev/linter/domains/).
