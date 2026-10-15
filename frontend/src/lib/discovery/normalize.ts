import { searchResultSchema, type SearchResult, type SignalCategory } from "./search-contract";

/**
 * Deterministic normalization of provider-like search items.
 *
 * Pure functions only: no network, no AI, no scoring, no relevance
 * inference. A result that normalizes successfully is still an unverified
 * candidate — normalization says nothing about relevance.
 */

/** Shape of one raw item as returned by a web-search provider (Tavily-like). */
export type ProviderSearchItem = {
  title?: unknown;
  url?: unknown;
  link?: unknown;
  content?: unknown;
  snippet?: unknown;
  text?: unknown;
  published_date?: unknown;
  publishedDate?: unknown;
  date?: unknown;
  source?: unknown;
  sourceName?: unknown;
};

export type NormalizeContext = {
  queryContext: string;
  signalCategory: SignalCategory;
  /** Test seam; defaults to the current time. Always means "discovered now". */
  discoveredAt?: string;
};

export class SearchNormalizationError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(`Cannot normalize provider result (${field}): ${message}`);
    this.name = "SearchNormalizationError";
    this.field = field;
  }
}

/** Query parameters stripped during canonicalization (tracking only). */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gclsrc",
  "fbclid",
  "msclkid",
  "yclid",
]);

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireHttpUrl(value: unknown): string {
  const text = asNonEmptyString(value);
  if (!text) throw new SearchNormalizationError("url", "missing or empty.");
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new SearchNormalizationError("url", "not a valid absolute URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SearchNormalizationError("url", "only http(s) source links are allowed.");
  }
  return text;
}

/**
 * Canonical form of a URL used ONLY as a deduplication key. The original
 * URL string is always preserved separately for display and linking.
 * Normalizations: lowercase scheme/host, drop `www.`, default ports,
 * fragment, and tracking params; sort remaining params; drop trailing `/`.
 */
export function canonicalizeUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return url.trim();
  }
  parsed.protocol = parsed.protocol.toLowerCase();
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  const isDefaultPort =
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443");
  const params = new URLSearchParams();
  const keys = [...parsed.searchParams.keys()].sort();
  for (const key of keys) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) continue;
    const values = parsed.searchParams.getAll(key);
    for (const v of values) params.append(key, v);
  }
  let path = parsed.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path === "/") path = "";
  const query = params.toString();
  const port = isDefaultPort || parsed.port === "" ? "" : `:${parsed.port}`;
  return `${parsed.protocol}//${host}${port}${path}${query ? `?${query}` : ""}`;
}

function normalizeDate(value: unknown): string | null {
  const text = asNonEmptyString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return null;
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return null;
  return text;
}

/**
 * Convert one provider-like item into the normalized contract.
 * Throws SearchNormalizationError for missing/invalid title or URL.
 * Never invents company, budget, contact, score, date, or verification data.
 */
export function normalizeProviderResult(raw: unknown, ctx: NormalizeContext): SearchResult {
  if (typeof raw !== "object" || raw === null) {
    throw new SearchNormalizationError("item", "expected an object.");
  }
  const item = raw as ProviderSearchItem;

  const title = asNonEmptyString(item.title);
  if (!title) throw new SearchNormalizationError("title", "missing or empty.");
  const url = requireHttpUrl(item.url ?? item.link);

  const snippet =
    asNonEmptyString(item.content) ??
    asNonEmptyString(item.snippet) ??
    asNonEmptyString(item.text) ??
    "";

  const publishedDate = normalizeDate(item.published_date ?? item.publishedDate ?? item.date);

  let domain: string;
  try {
    domain = new URL(url).hostname.toLowerCase();
  } catch {
    throw new SearchNormalizationError("url", "hostname unreadable.");
  }

  const sourceName = asNonEmptyString(item.source) ?? asNonEmptyString(item.sourceName) ?? domain;

  const candidate = {
    title: title.slice(0, 300),
    url,
    sourceName: sourceName.slice(0, 200),
    domain,
    snippet: snippet.slice(0, 2000),
    publishedDate,
    discoveredAt: ctx.discoveredAt ?? new Date().toISOString(),
    queryContext: ctx.queryContext,
    signal: { category: ctx.signalCategory, verified: false as const },
    scoreExplanation: null,
  };
  return searchResultSchema.parse(candidate);
}

export type NormalizedBatch = {
  results: SearchResult[];
  /** Count of items skipped for missing/malformed fields. */
  dropped: number;
};

/**
 * Normalize a provider result list: validate each item, drop malformed ones
 * (counted, not silent), and deduplicate by canonical URL keeping the first
 * occurrence with its original display URL intact.
 */
export function normalizeSearchResults(rawItems: unknown, ctx: NormalizeContext): NormalizedBatch {
  if (!Array.isArray(rawItems)) {
    throw new SearchNormalizationError("items", "expected an array.");
  }
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  let dropped = 0;
  for (const raw of rawItems) {
    let normalized: SearchResult;
    try {
      normalized = normalizeProviderResult(raw, ctx);
    } catch (error) {
      if (error instanceof SearchNormalizationError) {
        dropped += 1;
        continue;
      }
      throw error;
    }
    const key = canonicalizeUrl(normalized.url);
    if (seen.has(key)) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    results.push(normalized);
  }
  return { results, dropped };
}
