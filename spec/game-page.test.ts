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
    const endScreen = doc.querySelector('[data-screen="end"]');
    const wonState = doc.querySelector('[data-end-state="won"]');
    const lostState = doc.querySelector('[data-end-state="lost"]');

    expect(endScreen?.getAttribute("aria-labelledby")).toBe("end-title-won");
    expect(wonState).toBeTruthy();
    expect(lostState).toBeTruthy();
    expect(wonState?.querySelector("h2")?.id).toBe("end-title-won");
    expect(lostState?.querySelector("h2")?.id).toBe("end-title-lost");
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
