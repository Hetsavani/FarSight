# AGENTS.md — FarSight

Instructions for AI coding agents working in this repository. See `PRODUCT.md` for what the product is, and `DESIGN.md` for how the interface must look.

The nested `frontend/AGENTS.md` (Lovable history rule + demo-UI conventions) still applies inside `frontend/`. If it conflicts with this file, follow the narrower frontend rule for frontend-only edits and this file everywhere else.

## Project structure and boundaries

- `frontend/` holds **all current product code**: a TanStack Start + TanStack Router app (React 19, Vite 8, TypeScript, Tailwind CSS v4, Radix/shadcn UI). Details: `frontend/README.md`, `frontend/package.json`.
- `backend/` is a **placeholder**. It contains only a README stating future services may live there. There is no backend runtime, framework, endpoint, database, or dependency to extend yet.
- There is no shared package and no API contract. Do not invent one. Today:
  - Frontend-only shared code lives where it already lives: `frontend/src/lib/` (utilities), `frontend/src/data/` (reference markup + demo lead data), `frontend/src/components/` (shared UI), `frontend/src/hooks/` (hooks).
  - Validation is `zod` in the frontend only. There is no backend validation boundary yet.
  - Tests live beside source as `frontend/src/**/*.test.tsx` and run with Vitest (`frontend/vitest.config.ts`).
- Communication direction: **frontend → backend**. The frontend may call backend server functions / HTTP endpoints once they exist. A future backend must never import from `frontend/`.
- Cross-boundary changes (once a backend exists): define or update the contract first (route, shape, validation, errors), implement the backend side, then wire the frontend caller. Keep each side independently testable. Until a backend exists, do not scaffold one speculatively — build it only when the task requires it.

## Mandatory working principles

- Read the relevant code before changing it (`src/routes/`, `src/components/radar/screen.tsx`, `src/data/*`, `src/styles.css`).
- Make small, focused, incremental changes. One behavior per change.
- Prefer the simplest solution that solves the actual problem.
- Avoid overengineering, unnecessary abstractions, premature microservices, and speculative features.
- Preserve existing working behavior. All ten routes render today; keep them rendering.
- Reuse existing dependencies, components, patterns, and utilities (Radix/shadcn primitives, `cn()`, `RadarScreen`, `pageHead`, existing tokens).
- Do not replace TanStack Start / Router / Tailwind or introduce another framework without explicit justification and approval.
- Do not rebuild existing screens because a different implementation is preferred. See `DESIGN.md`.
- Do not silently change product scope or design decisions. See `PRODUCT.md`.

## Security and configuration

- There are currently **no `.env` files, no environment variables, and no API keys** in the repo (verified: no `VITE_*` usage, no server keys). Keep it that way until an integration task explicitly requires one.
- When keys are introduced: keep secrets and private API keys on the server (TanStack Start server functions / future `backend/`). Never expose them through client-side env vars or frontend bundles.
- Validate untrusted inputs at backend boundaries (with `zod` or equivalent) once a backend exists.
- Handle errors without exposing secrets, stack traces, or sensitive information. The repo already has an SSR error wrapper (`frontend/src/server.ts`, `start.ts`, `lib/error-*`); preserve it.
- Respect third-party terms, quotas, rate limits, and access restrictions. Never bypass authentication, usage limits, or access controls.
- Do not introduce paid services without explicit approval.
- Do not commit `.env` files, credentials, tokens, or personal data.

## Product-specific engineering rules

These are standing product principles, not claims that the features exist (most do not yet — see `PRODUCT.md`).

- Prioritize features that help users discover and evaluate genuine opportunities.
- Distinguish verified evidence from inferred intent. Never blur the two in code, labels, or copy.
- Never fabricate companies, contacts, budgets, requirements, publication dates, search results, or evidence.
- Treat a search result as a candidate, not automatically as a verified lead.
- Preserve original source URLs and actual evidence. Never drop or rewrite them.
- Do not present mock data as live data. Demo content in `src/data/leads.json` / `src/screens.json` is explicitly labeled illustrative in the UI; keep those labels.
- Make limitations, failed integrations, and unavailable information explicit in the UI and in code paths (empty / error / quota states), not silent.
- Avoid unnecessary AI calls when deterministic code is sufficient (filtering, dedup, formatting, CSV export).

## UI preservation rules

- Treat the existing Lovable-generated UI as the visual source of truth. Full system: `DESIGN.md`.
- Before modifying a screen, inspect its implementation: the route file, `src/components/radar/screen.tsx` (the shared renderer), and the relevant entries in `src/data/screens.json` / `shell.json` / `leads.json`.
- Preserve layout, typography, color tokens, spacing, interactions, and responsive behavior.
- Avoid generic redesigns, placeholder content, arbitrary styling changes, and unnecessary component replacement.
- Make visual changes only when required by the task or explicitly requested.
- Keep the frontend polished, consistent, and usable on desktop and smaller screens.

## Testing and completion

- Actual scripts (`frontend/package.json`): `dev`, `build`, `build:dev`, `preview`, `lint` (ESLint), `format` (Prettier), `test` (Vitest run), `test:watch`. Package manager: Bun recommended (`bun.lock`, `bunfig.toml`); npm also documented.
- Actual test coverage: one routing test (`frontend/src/test/app-routing.test.tsx`). Run the relevant checks after changes (`bun run test`, `bun run lint`, and `bun run build` for structural changes).
- Report what changed and which checks actually passed or failed, with commands.
- Never claim a command, integration, or test succeeded unless it was executed and verified.
- When a test cannot be run, state why.

## Agent workflow

1. Understand the request and inspect the relevant code and docs (`PRODUCT.md`, `DESIGN.md`, nested `frontend/AGENTS.md`).
2. Identify the smallest correct implementation; check it against scope (`PRODUCT.md`) and design (`DESIGN.md`).
3. Check dependencies and security implications (new packages, keys, backend surface, third-party terms).
4. Implement incrementally, reusing existing patterns and components.
5. Test the changed behavior with the repo's actual scripts.
6. Review the diff for unrelated changes, regressions, secrets, and accidental design changes.
7. Summarize changes, verification (commands + results), limitations, and remaining work.
