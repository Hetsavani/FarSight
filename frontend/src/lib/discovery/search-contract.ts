import { z } from "zod";

/**
 * Typed search contract for lead-discovery requests and normalized results.
 *
 * This module defines validation only. It performs no network access, no AI
 * calls, and no scoring. Provider integration (Tavily) is a later task and
 * must conform to these schemas rather than extending them ad hoc.
 *
 * Option codes mirror the values shown on the existing Find Leads reference
 * screen (frontend/src/data/screens.json entry "11"). The recency window and
 * "max candidates" presets shown in that screen are deliberately NOT part of
 * this contract: the upcoming search implementation will use a fixed
 * conservative limit, and additional filters are added only when the search
 * implementation actually consumes them.
 */

// --- Option catalogs (codes + the UI labels they were taken from) --------

export const SEARCH_MARKETS = ["US", "CA", "UK", "EU", "UAE", "AU", "NZ"] as const;
export type SearchMarket = (typeof SEARCH_MARKETS)[number];
export const MARKET_LABELS: Record<SearchMarket, string> = {
  US: "United States",
  CA: "Canada",
  UK: "United Kingdom",
  EU: "European Union",
  UAE: "UAE (Dubai/AD)",
  AU: "Australia",
  NZ: "New Zealand",
};

export const SEARCH_INDUSTRIES = [
  "ai-agencies",
  "yc-startups",
  "b2b-saas",
  "ai-startups",
  "real-estate",
  "hospitality",
  "healthcare",
  "logistics",
] as const;
export type SearchIndustry = (typeof SEARCH_INDUSTRIES)[number];
export const INDUSTRY_LABELS: Record<SearchIndustry, string> = {
  "ai-agencies": "AI & Software Agencies",
  "yc-startups": "YC-backed Startups",
  "b2b-saas": "B2B SaaS",
  "ai-startups": "AI Startups",
  "real-estate": "Real Estate Developers",
  hospitality: "Hotel & Hospitality",
  healthcare: "Healthcare & Clinics",
  logistics: "Logistics & Supply Chain",
};

export const SEARCH_SERVICES = [
  "backend-apis",
  "ai-integrations",
  "ai-agents",
  "fullstack-mvp",
  "third-party-integrations",
  "internal-tools",
] as const;
export type SearchService = (typeof SEARCH_SERVICES)[number];
export const SERVICE_LABELS: Record<SearchService, string> = {
  "backend-apis": "Backend Engineering & APIs",
  "ai-integrations": "AI Integrations & Workflows",
  "ai-agents": "AI Agents & Research Bots",
  "fullstack-mvp": "Full Custom Software Dev",
  "third-party-integrations": "Third-Party API Integrations",
  "internal-tools": "Internal Tools & Ops Portals",
};

export const SIGNAL_CATEGORIES = ["direct-demand", "potential-opportunity"] as const;
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

// --- Request bounds --------------------------------------------------------

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 200;
export const MIN_SEARCH_LIMIT = 1;
/** Conservative cap: one search call returns at most 10 candidates. */
export const MAX_SEARCH_LIMIT = 10;
export const DEFAULT_SEARCH_LIMIT = 10;

const marketSchema = z.enum(SEARCH_MARKETS);
const industrySchema = z.enum(SEARCH_INDUSTRIES);
const serviceSchema = z.enum(SEARCH_SERVICES);
const signalCategorySchema = z.enum(SIGNAL_CATEGORIES);

/**
 * Minimal validated lead-discovery search request.
 *
 * Accepts a free-text query and/or structured criteria taken from the Find
 * Leads UI. Unknown top-level keys are rejected (strict) so malformed
 * callers fail loudly instead of being silently partially applied.
 */
export const searchRequestSchema = z
  .object({
    query: z.string().trim().min(MIN_QUERY_LENGTH).max(MAX_QUERY_LENGTH).optional(),
    markets: z.array(marketSchema).max(SEARCH_MARKETS.length).optional(),
    industries: z.array(industrySchema).max(SEARCH_INDUSTRIES.length).optional(),
    services: z.array(serviceSchema).max(SEARCH_SERVICES.length).optional(),
    signals: z.array(signalCategorySchema).min(1).max(SIGNAL_CATEGORIES.length).optional(),
    limit: z
      .number()
      .int()
      .min(MIN_SEARCH_LIMIT)
      .max(MAX_SEARCH_LIMIT)
      .default(DEFAULT_SEARCH_LIMIT),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasQuery = (value.query?.length ?? 0) > 0;
    const hasCriteria = [value.markets, value.industries, value.services].some(
      (selected) => (selected?.length ?? 0) > 0,
    );
    if (!hasQuery && !hasCriteria) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Search must include a query or at least one selected criterion.",
      });
    }
  });

export type SearchRequest = z.infer<typeof searchRequestSchema>;

/**
 * Deterministic human-readable summary of a validated request, used as the
 * `queryContext` carried on every normalized result. Built only from fields
 * the request actually contains; never invents criteria.
 */
export function buildQueryContext(request: SearchRequest): string {
  const parts: string[] = [];
  if (request.query) parts.push(request.query);
  const groups: Array<[string, readonly string[] | undefined]> = [
    ["markets", request.markets],
    ["industries", request.industries],
    ["services", request.services],
    ["signals", request.signals],
  ];
  for (const [name, values] of groups) {
    if (values && values.length > 0) parts.push(`${name}: ${values.join(", ")}`);
  }
  return parts.join(" | ").slice(0, 300);
}

// --- Normalized result contract --------------------------------------------

/** Source links must be absolute http(s) URLs; anything else is unsafe. */
const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL must be a valid absolute http(s) link." },
  );

/** Accepts `YYYY-MM-DD` optionally followed by a time component. */
const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?)?$/, {
    message: "Date must be an ISO 8601 calendar date, optionally with time.",
  });

/**
 * Signal classification for a result.
 *
 * `category` records whether the evidence suggests explicit buying intent
 * (`direct-demand`) or only a possible future need (`potential-opportunity`).
 * `verified` is a literal `false`: every result entering through this
 * contract is an unverified candidate. Classification must never be rendered
 * or read as confirmed buying intent.
 */
export const resultSignalSchema = z
  .object({
    category: signalCategorySchema,
    verified: z.literal(false),
  })
  .strict();

/**
 * Normalized provider result. Every field is either observed from the
 * provider response or explicitly nullable/absent — nothing is synthesized.
 * In particular: no relevance score, no company profile, and no publication
 * date unless the provider actually supplied one.
 */
export const searchResultSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    url: httpUrlSchema,
    sourceName: z.string().trim().min(1).max(200),
    domain: z.string().trim().min(1).max(253),
    /** Provider snippet; empty string when the provider gave no content. */
    snippet: z.string().max(2000),
    /** Genuinely available publication date only; otherwise null. */
    publishedDate: isoDateSchema.nullable(),
    /** ISO timestamp of when this application discovered the result. */
    discoveredAt: z.string().datetime({ offset: true }),
    queryContext: z.string().trim().min(1).max(300),
    signal: resultSignalSchema,
    /** No scoring exists yet; always null from normalization v1. */
    scoreExplanation: z.string().trim().min(1).max(1000).nullable(),
  })
  .strict();

export type SearchResult = z.infer<typeof searchResultSchema>;
export type ResultSignal = z.infer<typeof resultSignalSchema>;
