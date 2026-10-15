import { afterEach, describe, expect, it } from "vitest";

import { collectFindLeadsRequest } from "./collect-request";

afterEach(() => {
  document.body.innerHTML = "";
});

function mount(html: string): void {
  document.body.innerHTML = `<div class="reference-screen">${html}</div>`;
}

describe("collectFindLeadsRequest", () => {
  it("collects selected markets, active industries, and checked services", () => {
    mount(`
      <button class="group bg-secondary-container text-on-secondary"><span>🇺🇸</span><span>United States</span></button>
      <button class="group bg-surface-container text-on-surface"><span>🇦🇪</span><span>UAE (Dubai/AD)</span></button>
      <div class="p-2.5 rounded bg-primary-container"><span class="font-body-sm">B2B SaaS</span></div>
      <div class="p-2.5 rounded bg-surface-container-high"><span class="font-body-sm">Real Estate Developers</span></div>
      <label><input type="checkbox" checked /><span>Backend Engineering &amp; APIs</span></label>
      <label><input type="checkbox" /><span>AI Agents &amp; Research Bots</span></label>
      <label><input type="checkbox" checked /><span>Exclude freelance platforms (Upwork, Fiverr)</span></label>
    `);

    expect(collectFindLeadsRequest(document.querySelector(".reference-screen"))).toEqual({
      markets: ["US"],
      industries: ["b2b-saas"],
      services: ["backend-apis"],
      limit: 10,
    });
  });

  it("treats runtime-toggled buttons as selected and ignores unknown labels", () => {
    mount(`
      <button class="selected-control"><span>🇦🇺</span><span>Australia</span></button>
      <button class="selected-control"><span>⭐</span><span>Mystery Market</span></button>
      <label><input type="checkbox" checked /><span>Unknown Service Thing</span></label>
    `);

    expect(collectFindLeadsRequest(document.querySelector(".reference-screen"))).toEqual({
      markets: ["AU"],
      limit: 10,
    });
  });

  it("returns an empty-shape object when nothing is selected or scoped", () => {
    mount(`<button class="bg-surface-container"><span>Canada</span></button>`);
    expect(collectFindLeadsRequest(document.querySelector(".reference-screen"))).toEqual({
      limit: 10,
    });
    expect(collectFindLeadsRequest(null)).toEqual({});
  });
});
