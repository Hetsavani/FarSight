import { createServerFn } from "@tanstack/react-start";

import {
  buildQueryContext,
  searchRequestSchema,
  type SearchRequest,
  type SearchResult,
} from "@/lib/discovery/search-contract";
import { normalizeSearchResults } from "@/lib/discovery/normalize";
import {
  buildTavilyBody,
  buildTavilyQuery,
  parseTavilyPayload,
  tavilyErrorMessage,
  TAVILY_SEARCH_URL,
} from "@/lib/discovery/tavily";

export type LiveSearchResponse = {
  results: SearchResult[];
  dropped: number;
  /** The exact provider query string that was executed. */
  query: string;
};

/**
 * Read the Tavily key. Called only inside the server handler below, so the
 * secret never enters client code or responses. No `VITE_`-prefixed alias
 * exists; do not add one.
 */
function readApiKey(): string {
  const key = typeof process !== "undefined" ? process.env["TAVILY_API_KEY"] : undefined;
  if (!key || key.trim().length === 0) {
    throw new Error(
      "TAVILY_API_KEY is not configured on the server. Add it to .env (ignored by git, never commit it) and restart the dev server.",
    );
  }
  return key.trim();
}

async function providerDetail(response: Response): Promise<string | undefined> {
  try {
    const text = await response.text();
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Execute one bounded Tavily search for a validated lead-discovery request.
 * One call per user submission; no retries, no background work, no fallbacks.
 */
export const searchLeads = createServerFn({ method: "POST" })
  .validator((data: unknown): SearchRequest => searchRequestSchema.parse(data))
  .handler(async ({ data }): Promise<LiveSearchResponse> => {
    const apiKey = readApiKey();
    const tavilyQuery = buildTavilyQuery(data);

    let response: Response;
    try {
      response = await fetch(TAVILY_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildTavilyBody(data, tavilyQuery)),
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error(
        "Could not reach Tavily (network error or timeout). No results were fetched.",
      );
    }

    if (!response.ok) {
      throw new Error(tavilyErrorMessage(response.status, await providerDetail(response)));
    }

    const payload: unknown = await response.json();
    const onlySignal =
      data.signals?.length === 1 && data.signals[0] !== undefined ? data.signals[0] : undefined;
    const { results, dropped } = normalizeSearchResults(parseTavilyPayload(payload), {
      queryContext: buildQueryContext(data),
      // Conservative: a single selected category is recorded; anything else
      // stays a potential opportunity, never implied direct demand.
      signalCategory: onlySignal ?? "potential-opportunity",
    });
    return { results, dropped, query: tavilyQuery };
  });
