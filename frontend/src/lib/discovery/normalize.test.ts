import { describe, expect, it } from "vitest";

import {
  canonicalizeUrl,
  normalizeProviderResult,
  normalizeSearchResults,
  SearchNormalizationError,
  type NormalizeContext,
} from "./normalize";

const CTX: NormalizeContext = {
  queryContext: "backend help | markets: US",
  signalCategory: "direct-demand",
  discoveredAt: "2026-10-15T12:00:00.000Z",
};

const VALID_ITEM = {
  title: "  Example posting: senior backend contractor for API work  ",
  url: "https://example.com/posts/hiring-backend-contractor",
  content: "Seeking an external contractor to integrate ordering APIs.",
  published_date: "2026-10-01",
  source: "Example Jobs Board",
};

describe("normalizeProviderResult", () => {
  it("normalizes a valid provider result without inventing data", () => {
    const result = normalizeProviderResult(VALID_ITEM, CTX);

    expect(result).toEqual({
      title: "Example posting: senior backend contractor for API work",
      url: "https://example.com/posts/hiring-backend-contractor",
      sourceName: "Example Jobs Board",
      domain: "example.com",
      snippet: "Seeking an external contractor to integrate ordering APIs.",
      publishedDate: "2026-10-01",
      discoveredAt: "2026-10-15T12:00:00.000Z",
      queryContext: "backend help | markets: US",
      signal: { category: "direct-demand", verified: false },
      scoreExplanation: null,
    });
  });

  it("exposes exactly the contracted fields and nothing synthetic", () => {
    const result = normalizeProviderResult(VALID_ITEM, CTX);
    expect(Object.keys(result).sort()).toEqual(
      [
        "discoveredAt",
        "domain",
        "publishedDate",
        "queryContext",
        "scoreExplanation",
        "signal",
        "snippet",
        "sourceName",
        "title",
        "url",
      ].sort(),
    );
    expect(result.scoreExplanation).toBeNull();
    expect(result.signal).toEqual({ category: "direct-demand", verified: false });
  });

  it("represents missing publication dates as null", () => {
    const { published_date: _omitted, ...withoutDate } = VALID_ITEM;
    expect(normalizeProviderResult(withoutDate, CTX).publishedDate).toBeNull();
    expect(
      normalizeProviderResult({ ...VALID_ITEM, published_date: "recently" }, CTX).publishedDate,
    ).toBeNull();
    expect(
      normalizeProviderResult({ ...VALID_ITEM, published_date: 20261001 }, CTX).publishedDate,
    ).toBeNull();
  });

  it("falls back to alternate provider field names and the domain", () => {
    const result = normalizeProviderResult(
      {
        title: "Roadmap post mentions API migration pain",
        link: "https://blog.testdev.io/roadmap-v2",
        snippet: "Migration notes.",
      },
      CTX,
    );
    expect(result.url).toBe("https://blog.testdev.io/roadmap-v2");
    expect(result.snippet).toBe("Migration notes.");
    expect(result.sourceName).toBe("blog.testdev.io");
    expect(result.domain).toBe("blog.testdev.io");
  });

  it("rejects invalid or unsafe URLs", () => {
    for (const url of ["notaurl", "", "javascript:alert(1)", "ftp://files.testdev.io/x"]) {
      expect(() => normalizeProviderResult({ title: "t", url }, CTX)).toThrowError(
        SearchNormalizationError,
      );
    }
    try {
      normalizeProviderResult({ title: "t", url: "notaurl" }, CTX);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SearchNormalizationError);
      expect((error as SearchNormalizationError).field).toBe("url");
    }
  });

  it("rejects missing or malformed fields predictably", () => {
    expect(() => normalizeProviderResult({ url: "https://example.com/x" }, CTX)).toThrowError(
      /title/,
    );
    expect(() =>
      normalizeProviderResult({ title: "   ", url: "https://example.com/x" }, CTX),
    ).toThrowError(SearchNormalizationError);
    expect(() => normalizeProviderResult(null, CTX)).toThrowError(/item/);
    expect(() => normalizeProviderResult("just a string", CTX)).toThrowError(/item/);
    expect(() => normalizeSearchResults("not-an-array", CTX)).toThrowError(/items/);
  });
});

describe("canonicalizeUrl", () => {
  it("treats casing, www, trailing slash, fragments, and tracking params as identical", () => {
    const canonical = canonicalizeUrl("https://example.com/Posts/Hiring/?utm_source=x#top");
    expect(canonical).toBe("https://example.com/Posts/Hiring");
    expect(canonicalizeUrl("HTTPS://WWW.EXAMPLE.COM/Posts/Hiring")).toBe(canonical);
    expect(canonicalizeUrl("https://example.com:443/Posts/Hiring?fbclid=abc")).toBe(canonical);
  });

  it("keeps meaningful query parameters distinct", () => {
    expect(canonicalizeUrl("https://example.com/jobs?page=2")).not.toBe(
      canonicalizeUrl("https://example.com/jobs?page=3"),
    );
  });
});

describe("normalizeSearchResults", () => {
  it("deduplicates by canonical URL, preserving the original display URL", () => {
    const batch = normalizeSearchResults(
      [
        VALID_ITEM,
        {
          ...VALID_ITEM,
          url: "https://WWW.example.com/posts/hiring-backend-contractor/?utm_source=n#top",
        },
        {
          title: "Second distinct posting",
          url: "https://example.com/posts/other-role",
          content: "Another snippet.",
        },
      ],
      CTX,
    );

    expect(batch.results).toHaveLength(2);
    expect(batch.dropped).toBe(1);
    expect(batch.results[0]?.url).toBe("https://example.com/posts/hiring-backend-contractor");
    expect(batch.results[1]?.url).toBe("https://example.com/posts/other-role");
  });

  it("drops malformed items while counting them", () => {
    const batch = normalizeSearchResults(
      [VALID_ITEM, { title: "", url: "notaurl" }, null, { title: "No URL here" }],
      CTX,
    );
    expect(batch.results).toHaveLength(1);
    expect(batch.dropped).toBe(3);
  });

  it("returns an empty batch for an empty list", () => {
    expect(normalizeSearchResults([], CTX)).toEqual({ results: [], dropped: 0 });
  });
});
