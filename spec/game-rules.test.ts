import { describe, expect, it } from "vitest";
import {
  CAT_ARCHETYPES,
  DIFFICULTIES,
  advanceCat,
  circlesOverlap,
  clampPoint,
  createCat,
  formatClock,
  getRoundPhase,
} from "../game-rules.js";

describe("Neko Escape rules", () => {
  it("maps difficulty to longer rounds and increasing pursuit pressure", () => {
    expect(DIFFICULTIES.easy.durationMs).toBe(60_000);
    expect(DIFFICULTIES.medium.durationMs).toBe(120_000);
    expect(DIFFICULTIES.hard.durationMs).toBe(180_000);

    expect(DIFFICULTIES.easy.spawnIntervalMs).toBeGreaterThan(
      DIFFICULTIES.medium.spawnIntervalMs,
    );
    expect(DIFFICULTIES.medium.spawnIntervalMs).toBeGreaterThan(
      DIFFICULTIES.hard.spawnIntervalMs,
    );
  });

  it("ends at the timer and gives capture precedence on the same frame", () => {
    expect(
      getRoundPhase({ elapsedMs: 12_000, durationMs: 60_000, caught: false }),
    ).toBe("playing");
    expect(
      getRoundPhase({ elapsedMs: 60_000, durationMs: 60_000, caught: false }),
    ).toBe("won");
    expect(
      getRoundPhase({ elapsedMs: 60_000, durationMs: 60_000, caught: true }),
    ).toBe("lost");
  });

  it("treats touching circles as a capture", () => {
    expect(
      circlesOverlap(
        { x: 100, y: 100, radius: 24 },
        { x: 150, y: 100, radius: 26 },
      ),
    ).toBe(true);
    expect(
      circlesOverlap(
        { x: 100, y: 100, radius: 24 },
        { x: 151, y: 100, radius: 26 },
      ),
    ).toBe(false);
  });

  it("clamps the mouse target inside the playable arena without mutating input", () => {
    const point = { x: -30, y: 640 };
    const clamped = clampPoint(point, { width: 800, height: 600 }, 18);

    expect(clamped).toEqual({ x: 18, y: 582 });
    expect(point).toEqual({ x: -30, y: 640 });
  });

  it.each([
    [0.1, "top"],
    [0.3, "right"],
    [0.6, "bottom"],
    [0.9, "left"],
  ])("spawns a cat from the %s edge band", (edgeRoll, expectedEdge) => {
    const cat = createCat({
      id: `cat-${expectedEdge}`,
      bounds: { width: 800, height: 600 },
      target: { x: 400, y: 300 },
      difficulty: "medium",
      safeDistance: 0,
      rolls: { edge: edgeRoll, lane: 0.25, archetype: 0.5 },
    });

    const actualEdge =
      cat.y < 0
        ? "top"
        : cat.x > 800
          ? "right"
          : cat.y > 600
            ? "bottom"
            : "left";
    expect(actualEdge).toBe(expectedEdge);
  });

  it("rotates away from an unsafe chosen edge", () => {
    const target = { x: 400, y: 8 };
    const cat = createCat({
      id: "safe-cat",
      bounds: { width: 800, height: 600 },
      target,
      difficulty: "easy",
      safeDistance: 280,
      rolls: { edge: 0.1, lane: 0.5, archetype: 0.5 },
    });

    expect(Math.hypot(cat.x - target.x, cat.y - target.y)).toBeGreaterThanOrEqual(
      280,
    );
    expect(cat.y).not.toBeLessThan(0);
  });

  it("creates visibly different slow and fast cat variants", () => {
    const common = {
      bounds: { width: 800, height: 600 },
      target: { x: 400, y: 300 },
      difficulty: "medium" as const,
      safeDistance: 0,
    };
    const slow = createCat({
      ...common,
      id: "slow",
      rolls: { edge: 0.1, lane: 0.2, archetype: 0.1 },
    });
    const fast = createCat({
      ...common,
      id: "fast",
      rolls: { edge: 0.1, lane: 0.8, archetype: 0.9 },
    });

    expect(slow.kind).toBe(CAT_ARCHETYPES.slow.kind);
    expect(fast.kind).toBe(CAT_ARCHETYPES.fast.kind);
    expect(fast.speed).toBeGreaterThan(slow.speed);
    expect(fast.turnRate).toBeLessThan(slow.turnRate);
  });

  it("returns a new cat state that advances toward the target", () => {
    const cat = createCat({
      id: "moving-cat",
      bounds: { width: 800, height: 600 },
      target: { x: 400, y: 300 },
      difficulty: "easy",
      safeDistance: 0,
      rolls: { edge: 0.1, lane: 0.5, archetype: 0.5 },
    });
    const before = Math.hypot(cat.x - 400, cat.y - 300);
    const advanced = advanceCat(cat, { x: 400, y: 300 }, 0.1);

    expect(advanced).not.toBe(cat);
    expect(Math.hypot(advanced.x - 400, advanced.y - 300)).toBeLessThan(before);
  });

  it("formats the countdown with ceiling semantics", () => {
    expect(formatClock(180_000)).toBe("3:00");
    expect(formatClock(59_200)).toBe("1:00");
    expect(formatClock(4_200)).toBe("0:05");
    expect(formatClock(-100)).toBe("0:00");
  });
});
