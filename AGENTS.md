# AGENTS.md — FarSight

<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

Instructions for AI coding agents working in this repository. See `PRODUCT.md` for what the product is, and `DESIGN.md` for how the interface must look.

## Project structure and boundaries

- This repository is a single TanStack Start + TanStack Router app at the root (React 19, Vite 8, TypeScript, Tailwind CSS v4, Radix/shadcn UI). Details: `README.md`, `package.json`. There is no `backend/` directory; server logic lives in TanStack server functions, not a separate service. Do not scaffold one speculatively.
- Shared code lives where it already lives: `src/lib/` (utilities, including `src/lib/discovery/` contracts and normalization), `src/data/` (reference markup + demo lead data), `src/components/` (shared UI), `src/hooks/` (hooks), `src/functions/` (server functions).
- Validation is `zod`, enforced both before calls and inside server functions (`src/functions/discovery.ts` validates with `searchRequestSchema`).
- Tests live beside source as `src/**/*.test.ts(x)` and run with Vitest (`vitest.config.ts`).
- API pattern: TanStack Start server functions (`createServerFn`) in `src/functions/`, called from the client via RPC. Secrets are read only inside server handlers.

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

- `.env` is git-ignored and local-only; `.env.example` holds placeholders. No real keys are committed (verified: no `VITE_*` usage, no checked-in secrets).
- When keys are introduced: keep secrets and private API keys on the server (TanStack Start server functions). Never expose them through client-side env vars or frontend bundles.
- Validate untrusted inputs at server-function boundaries (with `zod`).
- Handle errors without exposing secrets, stack traces, or sensitive information. The repo already has an SSR error wrapper (`src/server.ts`, `start.ts`, `lib/error-*`); preserve it.
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

- Actual scripts (`package.json`): `dev`, `build`, `build:dev`, `preview`, `lint` (ESLint), `format` (Prettier), `test` (Vitest run), `test:watch`. Package manager: Bun recommended (`bun.lock`, `bunfig.toml`); npm also documented.
- Actual test coverage: routing plus discovery unit tests (contracts, normalization, query building, request collection) beside source under `src/`. Run the relevant checks after changes (`bun run test`, `bun run lint`, and `bun run build` for structural changes).
- Report what changed and which checks actually passed or failed, with commands.
- Never claim a command, integration, or test succeeded unless it was executed and verified.
- When a test cannot be run, state why.

## Agent workflow

1. Understand the request and inspect the relevant code and docs (`PRODUCT.md`, `DESIGN.md`).
2. Identify the smallest correct implementation; check it against scope (`PRODUCT.md`) and design (`DESIGN.md`).
3. Check dependencies and security implications (new packages, keys, backend surface, third-party terms).
4. Implement incrementally, reusing existing patterns and components.
5. Test the changed behavior with the repo's actual scripts.
6. Review the diff for unrelated changes, regressions, secrets, and accidental design changes.
7. Summarize changes, verification (commands + results), limitations, and remaining work.
