# PRODUCT.md — FarSight Product Specification

What the product is meant to accomplish and what belongs in scope. How to work: `AGENTS.md`. How it must look: `DESIGN.md`.

This spec is grounded in the actual repository. Each section marks **Implemented** (verified in code), **Planned** (intended, not built), or **Future** (possibility, not a requirement).

## 1. Product vision

**Implemented:** a working opportunity-discovery workspace ("FarSight / Opportunity Radar") with ten routes. Find Leads performs a real bounded Tavily search via a server function and shows live results with original source links; the remaining screens render illustrative reference content and there is no persistence — demo content stays explicitly labeled.

**Planned (first priority):** a personal opportunity-discovery system that helps an independent software engineer find **genuine client-acquisition opportunities** — organizations with real, evidenced need for software development and AI implementation services. The first release must be a simple, useful client-finding workflow, not a generic research dashboard or an autonomous-agent platform.

**Future (not first-release requirements):** additional discovery categories such as startups, market trends, competitors, and emerging business opportunities.

## 2. Target user

**Planned:** a technically capable independent software engineer who can build full-stack web apps, backend services/APIs, AI integrations and AI-powered workflows, automation and internal tools, cloud/serverless integrations, and mobile apps. The product helps this user discover organizations that may genuinely need these services.

**Implemented:** the Find Leads screen already encodes this user's service surface as a checklist (backend engineering & APIs; AI integrations & workflows; AI agents & research bots; full custom software dev; third-party API integrations; internal tools & ops portals). Today these are static demo checkboxes used for a "fit-score" narrative — **planned** is computing a real, explained fit from them.

## 3. Target markets and industries

**Planned search space** (mirrors the demo filter options; listed here as possibilities, not proof of demand):
- Markets: United States, Canada, United Kingdom, Europe, United Arab Emirates, Australia, New Zealand.
- Industries/company types: AI and software startups (incl. YC-backed), SaaS businesses, software/AI agencies needing implementation partners or capacity, real estate and property developers, hospitality and hotels, healthcare/medical, restaurants, logistics/supply chain, and other businesses with meaningful software or automation needs.

**Implemented:** these appear only as static filter tiles and six illustrative leads in `src/data/leads.json` (hospitality, automation studio, property, health, logistics, clean energy). Presence in the demo is not evidence of real budgets or needs.

## 4. Opportunity and buying-signal model

The product must distinguish two categories everywhere (labels, copy, code, data):

- **Direct demand:** public evidence that an organization is explicitly looking for software development, contract engineering, AI implementation, API integrations, automation, or related technical help (e.g. contractor/freelancer request, integration-partner ask, stalled senior backend/AI hire with urgent delivery targets).
- **Potential opportunity:** evidence suggesting a future or indirect need — product launch, expansion, operational change, new technical initiative, relevant hiring — without explicit buying intent.

Rules: every result must show the evidence supporting its classification; potential opportunities must never be described as confirmed buying intent.

**Implemented:** the demo models this with the `tag` field (`Verified Direct Intent`, `Strong Inferred`, `Needs Verification`, `Needs Research`, `Moderate Signal`) and the `observed` (quote-like) vs `inferred` (interpretation) field split per lead. These are illustrative strings, not verified classifications — the real classifier and its evidence chain are **planned**.

## 5. Discovery sources

**Planned (potential sources, not integrations):** public Reddit discussions, Product Hunt, X, startup directories and announcements, YC-backed startup listings, public company websites, employer job pages, and relevant public announcements. The demo markup additionally name-drops Greenhouse (job feeds), procurement portals, press releases, engineering blogs, Substack roadmaps, and founder posts as source concepts.

**Implemented:** none. There are no source integrations, scrapers, API clients, keys, or fetch calls in the repo. "Greenhouse / Tavily API" appears only as a static demo source string; the Sources & Platforms screen's "Test Connection" explicitly reports no live credentials.

For every future source: respect its terms of service, access restrictions, APIs, rate limits, and privacy requirements. Do not promise universal coverage or real-time discovery.

## 6. Lead/result data requirements

Intended result model (fields below reflect the **actual demo shape** in `leads.json`; fields marked ✗ do not exist yet):

- Title / concise description ✓ (`title`)
- Organization/company, when identifiable from evidence ✓ (same as title in demo)
- Original source URL ✗ — **planned, required**. Preserve and display it; never drop or rewrite it.
- Source name and domain ✓ (`source`, `domain` — demo strings only)
- Actual source snippet / evidence ✓ (`observed` — illustrative quotes, not real evidence)
- Publication date ✗ — **planned**; record only when genuinely available, never guess.
- Discovery timestamp ✗ — **planned**.
- Search query / discovery context ✗ — **planned** (demo has filter state but stores nothing).
- Signal classification ✓ demo-only (`tag` + `tagColor`); real classifier **planned**.
- Relevance score / explanation ✗ real one — demo `score` strings (`94% AI Fit`) are static text; the scoring rule and its explanation are **planned**.
- Evidence-backed reasoning ✓ shape only (`inferred`, `pitchTitle`, `pitchBody` — illustrative).
- Verification status / limitations ✓ shape only (`tag`, demo banners); real verification **planned**.

Separate source-observed facts from generated interpretation in both data and UI (the `observed` vs `inferred` split is the current mechanism — keep it). Never fabricate missing fields or present a guessed date as a publication date.

## 7. MVP scope

The initial useful workflow:

1. Configure a search (market, industry/company type, service need, buying signal).
2. Trigger a search using an actually configured discovery source.
3. Inspect results and their source evidence.
4. Open the original source.
5. Save or reject results.
6. Revisit saved results.

**Implemented today:** step 1 as Find Leads filters; step 2 as one bounded Tavily call per submission (`src/functions/discovery.ts`, key stays server-side); step 3 as live result cards with snippets plus the existing illustrative rows/drawer/brief; step 4 via original-source links on live results; step 5 as session-local status flips/notes/saved-search names plus client-side CSV export and clipboard copy. Save/reject persistence and revisiting saved results remain **planned** — no data persists (no DB).

## 8. Quality requirements

- Relevant results matter more than raw volume.
- Prefer evidence of real need over generic technology mentions.
- Avoid generic SEO articles, listicles, freelance-marketplace spam, and agencies advertising their own services when they do not indicate genuine opportunity. (Not yet implemented — no filtering exists.)
- Do not automatically exclude legitimate employer job listings if they signal engineering demand.
- Deduplicate repeated discoveries when feasible. (Not implemented.)
- Explain why each result was included. (Demo `inferred` text only; real explanations planned.)
- Never claim a lead is verified without appropriate evidence. (Demo "Verified" tags are illustrative and labeled as such in the UI banners.)
- Handle empty results, errors, and exhausted quotas honestly and visibly — the required empty-state blocks, error components, and quota surfaces exist as UI shells (see `DESIGN.md` §3); wiring them to real states is planned.

## 9. Cost and implementation constraints

- The initial implementation must be free to operate within available free-tier quotas.
- Tavily is the currently identified candidate for web search; the user reports access to a free tier of 1,000 credits/month. Treat this as user-provided context, not a guarantee of provider terms or remaining credits. The repo contains **no Tavily integration, key, or client** — the "858 / 1,000 Tavily calls" pill is static demo text. Use Tavily only if the repo confirms it or the implementation task explicitly establishes it.
- Do not fall back to paid services automatically. Do not add Gemini, Firecrawl, Exa, paid hosting, a paid database, or other billable integrations without explicit approval.
- Keep the architecture simple: no unnecessary background workers, autonomous agents, or infrastructure. The current app is a single TanStack Start app with server functions and no separate backend — keep it that simple until the MVP workflow requires more.
- Never expose API keys in the browser (there are none today; see `AGENTS.md` for the server-side rule).

## 10. Out of scope for the first iteration

Unless explicitly requested, the MVP must not depend on: fully autonomous multi-agent systems; automated cold-email sending (outreach is manual-only by design — the demo states "Opportunity Radar never sends automated spam"); paid data providers; large-scale scraping infrastructure; complex CRM functionality; enterprise multi-tenant architecture; a broad opportunity marketplace before the client-discovery workflow works.

## 11. Product success criteria

Measurable checks for whether the product is useful (none are met yet — the app is demo-only, so do not claim otherwise):

- Results contain accessible original sources the user can open.
- The user can distinguish direct demand from inferred opportunity at a glance, with evidence.
- Irrelevant and duplicate results are visibly reduced, with explanations for inclusion.
- Search failures and quota limitations are transparent (honest empty/error/quota states).
- The user can efficiently identify promising leads worth investigating (filter → review → save/revisit loop works end to end).
- The workflow runs reliably without unexpected charges (quota guardrails hold at $0).
