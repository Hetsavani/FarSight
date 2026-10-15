import { describe, expect, it } from "vitest";

import { SearchNormalizationError } from "./normalize";
import {
  buildTavilyBody,
  buildTavilyQuery,
  MAX_TAVILY_QUERY_LENGTH,
  parseTavilyPayload,
  tavilyErrorMessage,
  TAVILY_SEARCH_URL,
} from "./tavily";

describe("buildTavilyQuery", () => {
  it("uses the user query and appends selected criteria plus intent phrases", () => {
    const query = buildTavilyQuery({
      query: "POS integration help",
      markets: ["US", "CA"],
      services: ["backend-apis"],
      limit: 10,
    });
    expect(query).toContain("POS integration help");
    expect(query).toContain("Backend Engineering & APIs");
    expect(query).toContain("United States");
    expect(query).toContain("Canada");
    expect(query).toContain("contractor");
  });

  it("builds a criteria-only query when no free text is given", () => {
    const query = buildTavilyQuery({
      industries: ["hospitality"],
      services: ["ai-agents"],
      limit: 10,
    });
    expect(query).toContain("Hotel & Hospitality");
    expect(query).toContain("AI Agents & Research Bots");
  });

  it("narrows intent phrases to a single selected signal category", () => {
    const direct = buildTavilyQuery({ signals: ["direct-demand"], limit: 10 });
    expect(direct).toContain("contractor");
    expect(direct).not.toContain("product launch");
    const inferred = buildTavilyQuery({ signals: ["potential-opportunity"], limit: 10 });
    expect(inferred).toContain("product launch");
    expect(inferred).not.toContain("contractor");
  });

  it("stays within the provider query length cap", () => {
    const query = buildTavilyQuery({
      query: "x".repeat(200),
      markets: ["US", "CA", "UK", "EU", "UAE", "AU", "NZ"],
      industries: ["ai-agencies", "yc-startups", "b2b-saas", "ai-startups"],
      services: ["backend-apis", "ai-integrations", "ai-agents"],
      limit: 10,
    });
    expect(query.length).toBeLessThanOrEqual(MAX_TAVILY_QUERY_LENGTH);
  });
});

describe("buildTavilyBody", () => {
  it("requests one bounded basic search with published dates", () => {
    expect(buildTavilyBody({ markets: ["US"], limit: 7 }, "backend help")).toEqual({
      query: "backend help",
      search_depth: "basic",
      max_results: 7,
      include_answer: false,
      include_published_date: true,
    });
    expect(TAVILY_SEARCH_URL).toBe("https://api.tavily.com/search");
  });
});

describe("parseTavilyPayload", () => {
  it("extracts the results array untouched", () => {
    const items = [{ title: "t", url: "https://example.com/x" }];
    expect(parseTavilyPayload({ results: items, query: "q" })).toBe(items);
  });

  it("rejects payloads without a results array", () => {
    expect(() => parseTavilyPayload(null)).toThrowError(SearchNormalizationError);
    expect(() => parseTavilyPayload({})).toThrowError(/results/);
    expect(() => parseTavilyPayload({ results: "nope" })).toThrowError(/results/);
  });
});

describe("tavilyErrorMessage", () => {
  it("maps key, quota, and validation failures honestly", () => {
    expect(tavilyErrorMessage(401)).toContain("401");
    expect(tavilyErrorMessage(429)).toContain("rate limit");
    expect(tavilyErrorMessage(432)).toContain("quota");
    expect(tavilyErrorMessage(433)).toContain("quota");
    expect(tavilyErrorMessage(500)).toContain("status 500");
  });

  it("never mentions secrets", () => {
    for (const status of [400, 401, 429, 432, 433, 500]) {
      expect(tavilyErrorMessage(status, "some detail").toLowerCase()).not.toContain(
        "api key value",
      );
      expect(tavilyErrorMessage(status)).not.toMatch(/tvly-/);
    }
  });
});
