# Repository Guidelines

## Project Structure & Module Organization

The deployable application lives in `frontend/`, a Next.js 16 App Router project. Route entry points and global styles are under `frontend/app/`; `page.tsx` assembles the home page and `layout.tsx` defines shared metadata and layout. Reusable React components live in `frontend/components/`. Storefront-specific sections, hooks, and data are grouped in `frontend/components/storefront/`. Static images and icons belong in `frontend/public/` and are referenced from the site root (for example, `/AFE-Eggs.png`). Use the `@/` alias for imports rooted at `frontend/`.

## Build, Test, and Development Commands

Run application commands from `frontend/`:

- `npm ci` installs the exact versions recorded in `package-lock.json`.
- `npm run dev` starts the local development server at `http://localhost:3000`.
- `npm run lint` checks TypeScript and React code with ESLint and Next.js Core Web Vitals rules.
- `npm run build` creates a production build and catches type or route compilation errors.
- `npm run start` serves the completed production build.

Before changing framework behavior, read `frontend/AGENTS.md` and the relevant bundled Next.js documentation in `frontend/node_modules/next/dist/docs/`.

## Coding Style & Naming Conventions

Write strict TypeScript and functional React components. Follow the existing two-space indentation, double quotes, semicolons, and trailing commas in multiline constructs. Name component files in kebab-case (`back-to-top-button.tsx`), exported components in PascalCase, hooks with a `use-` filename and `useX` function, and constants in `UPPER_SNAKE_CASE`. Keep route files server-rendered by default; add `"use client"` only when browser APIs, event handlers, or React state require it. Prefer small section components and colocated storefront helpers over expanding the top-level page.

## Testing Guidelines

No automated test framework or coverage threshold is currently configured. For every change, run `npm run lint` and `npm run build`, then manually verify affected layouts and interactions in `npm run dev`, including mobile and desktop widths. If tests are introduced, colocate them as `*.test.ts` or `*.test.tsx` and add the corresponding script to `frontend/package.json`.

## Commit & Pull Request Guidelines

Recent history uses concise, imperative Conventional Commit prefixes such as `feat:` and `refactor:`. Continue that pattern; use `fix:`, `docs:`, or `chore:` when appropriate and keep each commit focused. Pull requests should explain the user-facing change, list validation performed, link any related issue, and include before/after screenshots for visual updates. Call out new environment variables, dependencies, or deployment considerations explicitly.
