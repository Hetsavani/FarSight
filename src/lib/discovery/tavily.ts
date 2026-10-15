import { SearchNormalizationError } from "./normalize";
import {
  INDUSTRY_LABELS,
  MARKET_LABELS,
  SERVICE_LABELS,
  type SearchRequest,
} from "./search-contract";

/**
 * Tavily-specific helpers. Pure functions only — no network, no secrets.
 * The API key is handled exclusively inside the server function
 * (src/functions/discovery.ts) and never enters this module.
 *
 * Endpoint reference: POST https://api.tavily.com/search
 * (https://docs.tavily.com/documentation/api-reference/endpoint/search).
 * `search_depth: "basic"` costs 1 credit per call; `include_published_date`
 * surfaces Tavily's `published_date` estimate (RFC-style date or null).
 */

export const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

/** Maximum characters sent as the provider query string. */
export const MAX_TAVILY_QUERY_LENGTH = 400;

function intentPhrases(signals: SearchRequest["signals"]): string {
  const only = signals?.length === 1 && signals[0] !== undefined ? signals[0] : undefined;
  if (only === "direct-demand") {
    return '"looking for" OR hiring OR contractor OR freelancer OR "integration partner"';
  }
  if (only === "potential-opportunity") {
    return 'product launch OR expansion OR "hiring engineers" OR API migration';
  }
  return 'looking for contractor OR freelancer OR hiring OR "integration partner" OR product launch OR expansion';
}

/**
 * Build one deterministic Tavily query string from a validated request.
 * Composes the user's query (when present) with the selected service,
 * industry, and market labels plus buying-intent phrases. Never invents
 * criteria beyond the validated request fields.
 */
export function buildTavilyQuery(request: SearchRequest): string {
  const groups: string[] = [];
  if (request.query) groups.push(request.query);
  if (request.services && request.services.length > 0) {
    groups.push(`(${request.services.map((s) => SERVICE_LABELS[s]).join(" OR ")})`);
  }
  if (request.industries && request.industries.length > 0) {
    groups.push(`(${request.industries.map((i) => INDUSTRY_LABELS[i]).join(" OR ")})`);
  }
  if (request.markets && request.markets.length > 0) {
    groups.push(`(${request.markets.map((m) => MARKET_LABELS[m]).join(" OR ")})`);
  }
  groups.push(`(${intentPhrases(request.signals)})`);
  return groups.join(" ").slice(0, MAX_TAVILY_QUERY_LENGTH);
}

export type TavilySearchBody = {
  query: string;
  search_depth: "basic";
  max_results: number;
  include_answer: false;
  include_published_date: true;
};

/** Request body for one bounded search call. No extra provider features. */
export function buildTavilyBody(request: SearchRequest, query: string): TavilySearchBody {
  return {
    query,
    search_depth: "basic",
    max_results: request.limit,
    include_answer: false,
    include_published_date: true,
  };
}

/**
 * Extract the raw result items from a Tavily search payload.
 * Returns the untouched item objects; normalization happens separately.
 */
export function parseTavilyPayload(payload: unknown): unknown[] {
  if (typeof payload !== "object" || payload === null) {
    throw new SearchNormalizationError("items", "expected an object payload.");
  }
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) {
    throw new SearchNormalizationError("items", "expected a results array.");
  }
  return results;
}

/** Map an HTTP failure into an honest, key-free error message. */
export function tavilyErrorMessage(status: number, detail?: string): string {
  const extra = detail && detail.length > 0 ? ` Detail: ${detail.slice(0, 200)}` : "";
  if (status === 401) {
    return "Tavily rejected the request: missing or invalid API key (401). Check TAVILY_API_KEY on the server.";
  }
  if (status === 429) {
    return "Tavily rate limit reached (429). Wait before retrying; no results were fetched.";
  }
  if (status === 432 || status === 433) {
    return `Tavily plan or quota limit exceeded (${status}). No further calls were made; check usage on the Tavily dashboard.`;
  }
  if (status === 400 || status === 422) {
    return `Tavily rejected the search parameters (${status}).${extra}`;
  }
  return `Tavily search failed (status ${status}). No results were fetched.${extra}`;
}
