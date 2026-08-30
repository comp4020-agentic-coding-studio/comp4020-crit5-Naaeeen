// @ts-check

/** @typedef {{ width: number, height: number }} Bounds */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {Point & { radius: number }} Circle */
/** @typedef {"easy" | "medium" | "hard"} DifficultyKey */
/** @typedef {"slow" | "steady" | "fast"} CatKind */
/** @typedef {"menu" | "playing" | "won" | "lost"} RoundPhase */

/**
 * @typedef {object} Difficulty
 * @property {string} label
 * @property {number} durationMs
 * @property {number} spawnIntervalMs
 * @property {number} maxCats
 * @property {number} speedMultiplier
 */

/**
 * @typedef {object} CatArchetype
 * @property {CatKind} kind
 * @property {number} speed
 * @property {number} turnRate
 * @property {number} radius
 * @property {number} bodyLength
 * @property {string} coat
 * @property {string} accent
 */

/**
 * @typedef {object} Cat
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} radius
 * @property {number} speed
 * @property {number} turnRate
 * @property {number} bodyLength
 * @property {CatKind} kind
 * @property {string} coat
 * @property {string} accent
 */

/**
 * @typedef {object} SpawnRolls
 * @property {number} edge
 * @property {number} lane
 * @property {number} archetype
 */

/** @type {Readonly<Record<DifficultyKey, Readonly<Difficulty>>>} */
export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({
    label: "1:00",
    durationMs: 60_000,
    spawnIntervalMs: 12_000,
    maxCats: 6,
    speedMultiplier: 0.88,
  }),
  medium: Object.freeze({
    label: "2:00",
    durationMs: 120_000,
    spawnIntervalMs: 9_000,
    maxCats: 14,
    speedMultiplier: 1,
  }),
  hard: Object.freeze({
    label: "3:00",
    durationMs: 180_000,
    spawnIntervalMs: 7_000,
    maxCats: 26,
    speedMultiplier: 1.12,
  }),
});

/** @type {Readonly<Record<CatKind, Readonly<CatArchetype>>>} */
export const CAT_ARCHETYPES = Object.freeze({
  slow: Object.freeze({
    kind: "slow",
    speed: 72,
    turnRate: 5.6,
    radius: 27,
    bodyLength: 1.08,
    coat: "#5fc7a8",
    accent: "#173f4f",
  }),
  steady: Object.freeze({
    kind: "steady",
    speed: 94,
    turnRate: 4.2,
    radius: 24,
    bodyLength: 1,
    coat: "#ef6a4b",
    accent: "#422337",
  }),
  fast: Object.freeze({
    kind: "fast",
    speed: 124,
    turnRate: 2.2,
    radius: 21,
    bodyLength: 1.18,
    coat: "#f5c453",
    accent: "#4d2f24",
  }),
});

/**
 * @param {string} key
 * @returns {Readonly<Difficulty>}
 */
export function getDifficulty(key) {
  if (key === "medium" || key === "hard") {
    return DIFFICULTIES[key];
  }

  return DIFFICULTIES.easy;
}

/**
 * @param {string} difficulty
 * @param {number} elapsedMs
 * @returns {number}
 */
export function getScheduledCatCount(difficulty, elapsedMs) {
  const config = getDifficulty(difficulty);
  const safeElapsedMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const intervalSpawns = Math.floor(safeElapsedMs / config.spawnIntervalMs);

  return Math.min(config.maxCats, 1 + intervalSpawns);
}

/**
 * @param {{ elapsedMs: number, durationMs: number, caught: boolean }} state
 * @returns {RoundPhase}
 */
export function getRoundPhase(state) {
  if (state.caught) {
    return "lost";
  }

  return state.elapsedMs >= state.durationMs ? "won" : "playing";
}

/**
 * @param {Circle} first
 * @param {Circle} second
 * @returns {boolean}
 */
export function circlesOverlap(first, second) {
  const combinedRadius = first.radius + second.radius;
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return dx * dx + dy * dy <= combinedRadius * combinedRadius;
}

/**
 * @param {Point} point
 * @param {Bounds} bounds
 * @param {number} inset
 * @returns {Point}
 */
export function clampPoint(point, bounds, inset) {
  const safeInset = Math.max(0, inset);
  const minX = Math.min(safeInset, bounds.width / 2);
  const minY = Math.min(safeInset, bounds.height / 2);
  const maxX = Math.max(minX, bounds.width - safeInset);
  const maxY = Math.max(minY, bounds.height - safeInset);

  return {
    x: clamp(point.x, minX, maxX),
    y: clamp(point.y, minY, maxY),
  };
}

/**
 * @param {object} options
 * @param {string} options.id
 * @param {Bounds} options.bounds
 * @param {Point} options.target
 * @param {DifficultyKey} options.difficulty
 * @param {number} options.safeDistance
 * @param {SpawnRolls} options.rolls
 * @returns {Cat}
 */
export function createCat(options) {
  const difficulty = getDifficulty(options.difficulty);
  const archetype = selectArchetype(options.rolls.archetype);
  const radius = archetype.radius;
  const candidates = createEdgeCandidates(
    options.bounds,
    radius,
    normaliseRoll(options.rolls.lane),
  );
  const firstEdge = Math.floor(normaliseRoll(options.rolls.edge) * candidates.length);
  const orderedCandidates = candidates.map(
    (_, offset) => candidates[(firstEdge + offset) % candidates.length],
  );
  const safeDistance = Math.max(0, options.safeDistance);
  const position =
    orderedCandidates.find(
      (candidate) => distance(candidate, options.target) >= safeDistance,
    ) ?? farthestPoint(orderedCandidates, options.target);

  return {
    id: options.id,
    x: position.x,
    y: position.y,
    vx: 0,
    vy: 0,
    radius,
    speed: archetype.speed * difficulty.speedMultiplier,
    turnRate: archetype.turnRate,
    bodyLength: archetype.bodyLength,
    kind: archetype.kind,
    coat: archetype.coat,
    accent: archetype.accent,
  };
}

/**
 * @param {Cat} cat
 * @param {Point} target
 * @param {number} deltaSeconds
 * @returns {Cat}
 */
export function advanceCat(cat, target, deltaSeconds) {
  const frameSeconds = clamp(deltaSeconds, 0, 0.25);
  const toTargetX = target.x - cat.x;
  const toTargetY = target.y - cat.y;
  const targetDistance = Math.max(0.0001, Math.hypot(toTargetX, toTargetY));
  const desiredX = toTargetX / targetDistance;
  const desiredY = toTargetY / targetDistance;
  const currentSpeed = Math.hypot(cat.vx, cat.vy);

  let directionX = desiredX;
  let directionY = desiredY;

  if (currentSpeed > 0.0001) {
    const blend = Math.min(1, cat.turnRate * frameSeconds);
    const mixedX = cat.vx / currentSpeed + (desiredX - cat.vx / currentSpeed) * blend;
    const mixedY = cat.vy / currentSpeed + (desiredY - cat.vy / currentSpeed) * blend;
    const mixedLength = Math.max(0.0001, Math.hypot(mixedX, mixedY));
    directionX = mixedX / mixedLength;
    directionY = mixedY / mixedLength;
  }

  const vx = directionX * cat.speed;
  const vy = directionY * cat.speed;

  return {
    ...cat,
    vx,
    vy,
    x: cat.x + vx * frameSeconds,
    y: cat.y + vy * frameSeconds,
  };
}

/**
 * @param {number} durationMs
 * @param {number} elapsedMs
 * @returns {number}
 */
export function getRemainingMs(durationMs, elapsedMs) {
  return Math.max(0, durationMs - elapsedMs);
}

/**
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatClock(milliseconds) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * @param {() => number} random
 * @returns {SpawnRolls}
 */
export function rollsFromRandom(random) {
  return {
    edge: normaliseRoll(random()),
    lane: normaliseRoll(random()),
    archetype: normaliseRoll(random()),
  };
}

/**
 * @param {number} roll
 * @returns {Readonly<CatArchetype>}
 */
function selectArchetype(roll) {
  const value = normaliseRoll(roll);

  if (value < 0.34) {
    return CAT_ARCHETYPES.slow;
  }

  return value < 0.72 ? CAT_ARCHETYPES.steady : CAT_ARCHETYPES.fast;
}

/**
 * @param {Bounds} bounds
 * @param {number} radius
 * @param {number} lane
 * @returns {Point[]}
 */
function createEdgeCandidates(bounds, radius, lane) {
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);

  return [
    { x: lane * width, y: -radius },
    { x: width + radius, y: lane * height },
    { x: lane * width, y: height + radius },
    { x: -radius, y: lane * height },
  ];
}

/**
 * @param {Point[]} points
 * @param {Point} target
 * @returns {Point}
 */
function farthestPoint(points, target) {
  return points.reduce((farthest, point) =>
    distance(point, target) > distance(farthest, target) ? point : farthest,
  );
}

/**
 * @param {Point} first
 * @param {Point} second
 * @returns {number}
 */
function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

/**
 * @param {number} value
 * @returns {number}
 */
function normaliseRoll(value) {
  return clamp(Number.isFinite(value) ? value : 0, 0, 0.999999);
}

/**
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
