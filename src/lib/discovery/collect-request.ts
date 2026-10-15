import {
  INDUSTRY_LABELS,
  MARKET_LABELS,
  SERVICE_LABELS,
  type SearchIndustry,
  type SearchMarket,
  type SearchService,
} from "./search-contract";

/**
 * Collect the Find Leads reference screen's existing controls into a search
 * request shape (validated later by `searchRequestSchema`).
 *
 * The reference markup carries no input names or values, so controls are
 * identified by their stable visible labels and visual selected state:
 * - markets: buttons showing a market label, selected when highlighted with
 *   `bg-secondary-container` or the runtime `selected-control` class;
 * - services: checked checkboxes inside a label naming a service;
 * - industries: tiles naming an industry and highlighted with
 *   `bg-primary-container` (display-only in the demo, still the shown config).
 * The screen's signal tiers are display-only, so `signals` is omitted and the
 * search covers both categories. Unknown labels are ignored.
 */

function reverseLabels<T extends string>(labels: Record<T, string>): Map<string, T> {
  const map = new Map<string, T>();
  for (const [code, label] of Object.entries(labels) as Array<[T, string]>) {
    map.set(label, code);
  }
  return map;
}

const MARKET_BY_LABEL = reverseLabels(MARKET_LABELS);
const INDUSTRY_BY_LABEL = reverseLabels(INDUSTRY_LABELS);
const SERVICE_BY_LABEL = reverseLabels(SERVICE_LABELS);

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function collectMarkets(scope: ParentNode): SearchMarket[] {
  const found: SearchMarket[] = [];
  const buttons =
    scope instanceof Element
      ? scope.querySelectorAll("button")
      : ((scope as Document).querySelectorAll?.("button") ?? []);
  for (const button of buttons) {
    const classes = button.className ?? "";
    const selected =
      classes.includes("bg-secondary-container") || classes.includes("selected-control");
    if (!selected) continue;
    for (const span of button.querySelectorAll("span")) {
      const code = MARKET_BY_LABEL.get(cleanText(span.textContent));
      if (code && !found.includes(code)) found.push(code);
    }
  }
  return found;
}

function collectServices(scope: ParentNode): SearchService[] {
  const found: SearchService[] = [];
  const boxes =
    scope instanceof Element
      ? scope.querySelectorAll('input[type="checkbox"]:checked')
      : ((scope as Document).querySelectorAll?.('input[type="checkbox"]:checked') ?? []);
  for (const box of boxes) {
    const label = box.closest("label");
    if (!label) continue;
    for (const span of label.querySelectorAll("span")) {
      const code = SERVICE_BY_LABEL.get(cleanText(span.textContent));
      if (code && !found.includes(code)) found.push(code);
    }
  }
  return found;
}

function collectIndustries(scope: ParentNode): SearchIndustry[] {
  const found: SearchIndustry[] = [];
  const spans =
    scope instanceof Element
      ? scope.querySelectorAll("span")
      : ((scope as Document).querySelectorAll?.("span") ?? []);
  for (const span of spans) {
    const code = INDUSTRY_BY_LABEL.get(cleanText(span.textContent));
    if (!code || found.includes(code)) continue;
    const tile = span.closest('div[class*="bg-primary-container"]');
    if (tile) found.push(code);
  }
  return found;
}

/** Read-only; returns a plain object for `searchRequestSchema` validation. */
export function collectFindLeadsRequest(scope: ParentNode | null): unknown {
  if (!scope) return {};
  const request: {
    markets?: SearchMarket[];
    industries?: SearchIndustry[];
    services?: SearchService[];
    limit: number;
  } = { limit: 10 };
  const markets = collectMarkets(scope);
  const industries = collectIndustries(scope);
  const services = collectServices(scope);
  if (markets.length > 0) request.markets = markets;
  if (industries.length > 0) request.industries = industries;
  if (services.length > 0) request.services = services;
  return request;
}
