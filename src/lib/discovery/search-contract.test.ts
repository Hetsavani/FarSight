import { describe, expect, it } from "vitest";

import {
  buildQueryContext,
  DEFAULT_SEARCH_LIMIT,
  MAX_QUERY_LENGTH,
  MAX_SEARCH_LIMIT,
  searchRequestSchema,
  searchResultSchema,
} from "./search-contract";

describe("searchRequestSchema", () => {
  it("accepts a valid search request with criteria and explicit limit", () => {
    const parsed = searchRequestSchema.parse({
      query: "contract backend engineer for POS integration",
      markets: ["US", "CA"],
      industries: ["hospitality", "b2b-saas"],
      services: ["backend-apis"],
      signals: ["direct-demand"],
      limit: 5,
    });

    expect(parsed.query).toBe("contract backend engineer for POS integration");
    expect(parsed.markets).toEqual(["US", "CA"]);
    expect(parsed.limit).toBe(5);
  });

  it("applies the conservative default limit when omitted", () => {
    const parsed = searchRequestSchema.parse({ query: "AI integration partner" });
    expect(parsed.limit).toBe(DEFAULT_SEARCH_LIMIT);
    expect(parsed.limit).toBeLessThanOrEqual(MAX_SEARCH_LIMIT);
  });

  it("rejects empty searches", () => {
    expect(searchRequestSchema.safeParse({}).success).toBe(false);
    expect(searchRequestSchema.safeParse({ query: "   " }).success).toBe(false);
    expect(searchRequestSchema.safeParse({ query: "x" }).success).toBe(false);
    expect(searchRequestSchema.safeParse({ markets: [] }).success).toBe(false);
    expect(
      searchRequestSchema.safeParse({ markets: [], industries: [], services: [] }).success,
    ).toBe(false);
  });

  it("rejects oversized requests", () => {
    expect(searchRequestSchema.safeParse({ query: "x".repeat(MAX_QUERY_LENGTH + 1) }).success).toBe(
      false,
    );
    const eightMarkets = ["US", "CA", "UK", "EU", "UAE", "AU", "NZ", "US"] as const;
    expect(searchRequestSchema.safeParse({ markets: [...eightMarkets] }).success).toBe(false);
  });

  it("rejects unsupported signal categories and malformed filter values", () => {
    expect(
      searchRequestSchema.safeParse({ query: "backend help", signals: ["viral-growth"] }).success,
    ).toBe(false);
    expect(searchRequestSchema.safeParse({ query: "backend help", signals: [] }).success).toBe(
      false,
    );
    expect(searchRequestSchema.safeParse({ query: "backend help", markets: ["XX"] }).success).toBe(
      false,
    );
    expect(
      searchRequestSchema.safeParse({ query: "backend help", industries: ["crypto-casino"] })
        .success,
    ).toBe(false);
    expect(searchRequestSchema.safeParse({ query: "backend help", limit: "10" }).success).toBe(
      false,
    );
  });

  it("rejects unknown top-level fields instead of ignoring them", () => {
    expect(
      searchRequestSchema.safeParse({ query: "backend help", recency: "7d", foo: 1 }).success,
    ).toBe(false);
  });

  it("enforces the result limit maximum of 10", () => {
    expect(searchRequestSchema.safeParse({ query: "backend help", limit: 10 }).success).toBe(true);
    expect(searchRequestSchema.safeParse({ query: "backend help", limit: 11 }).success).toBe(false);
    expect(searchRequestSchema.safeParse({ query: "backend help", limit: 100 }).success).toBe(
      false,
    );
    expect(searchRequestSchema.safeParse({ query: "backend help", limit: 0 }).success).toBe(false);
    expect(searchRequestSchema.safeParse({ query: "backend help", limit: 2.5 }).success).toBe(
      false,
    );
  });

  it("builds a query context only from supplied fields", () => {
    expect(buildQueryContext({ query: "POS help", limit: 10 })).toBe("POS help");
    expect(buildQueryContext({ markets: ["US"], signals: ["direct-demand"], limit: 10 })).toBe(
      "markets: US | signals: direct-demand",
    );
  });
});

describe("searchResultSchema", () => {
  const valid = {
    title: "Example posting: senior backend contractor",
    url: "https://example.com/posts/hiring-backend-contractor",
    sourceName: "example.com",
    domain: "example.com",
    snippet: "Seeking a contractor for API work.",
    publishedDate: "2026-10-01",
    discoveredAt: "2026-10-15T12:00:00.000Z",
    queryContext: "backend help",
    signal: { category: "direct-demand", verified: false as const },
    scoreExplanation: null,
  };

  it("accepts a valid normalized result", () => {
    expect(searchResultSchema.parse(valid)).toEqual(valid);
  });

  it("never accepts a verified status through this contract", () => {
    const fabricated = { ...valid, signal: { category: "direct-demand", verified: true } };
    expect(searchResultSchema.safeParse(fabricated).success).toBe(false);
  });

  it("rejects invalid or unsafe URLs", () => {
    for (const url of [
      "notaurl",
      "",
      "javascript:alert(1)",
      "data:text/plain,hi",
      "ftp://x.test/f",
    ]) {
      expect(searchResultSchema.safeParse({ ...valid, url }).success).toBe(false);
    }
  });

  it("rejects unknown fields and malformed dates", () => {
    expect(searchResultSchema.safeParse({ ...valid, score: 94 }).success).toBe(false);
    expect(
      searchResultSchema.safeParse({ ...valid, publishedDate: "sometime last week" }).success,
    ).toBe(false);
  });
});
