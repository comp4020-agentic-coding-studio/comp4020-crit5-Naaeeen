import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(
  readFileSync(resolve("dist/index.html"), "utf8"),
).window.document;

describe("Neko Escape built-page contract", () => {
  it("ships one focusable game canvas and a restrained live region", () => {
    const canvas = doc.querySelector("canvas[data-game-canvas]");

    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("tabindex")).toBe("0");
    expect(doc.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it("offers the three promised round durations as semantic controls", () => {
    const choices = Array.from(
      doc.querySelectorAll<HTMLButtonElement>("button[data-difficulty]"),
    );

    expect(choices.map((button) => button.dataset.difficulty)).toEqual([
      "easy",
      "medium",
      "hard",
    ]);
    expect(choices.map((button) => button.textContent?.replace(/\s+/g, " "))).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1:00"),
        expect.stringContaining("2:00"),
        expect.stringContaining("3:00"),
      ]),
    );
  });

  it("keeps both round outcomes and recovery actions in semantic HTML", () => {
    expect(doc.querySelector('[data-end-state="won"]')).toBeTruthy();
    expect(doc.querySelector('[data-end-state="lost"]')).toBeTruthy();
    expect(doc.querySelector('button[data-action="replay"]')).toBeTruthy();
    expect(doc.querySelector('button[data-action="menu"]')).toBeTruthy();
  });

  it("loads the browser runtime as a local module", () => {
    const runtime = doc.querySelector<HTMLScriptElement>(
      'script[type="module"][src="./main.js"]',
    );

    expect(runtime).toBeTruthy();
    expect(doc.querySelectorAll('[src^="http"], [href^="http"]').length).toBe(0);
  });
});
