// @ts-check

import {
  DIFFICULTIES,
  advanceCat,
  circlesOverlap,
  clampPoint,
  createCat,
  formatClock,
  getDifficulty,
  getRemainingMs,
  getRoundPhase,
  getScheduledCatCount,
  rollsFromRandom,
} from "./game-rules.js";

/** @typedef {"easy" | "medium" | "hard"} DifficultyKey */
/** @typedef {"menu" | "playing" | "won" | "lost"} Phase */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {ReturnType<typeof createCat>} Cat */

/**
 * @typedef {object} SpawnSignal
 * @property {number} x
 * @property {number} y
 * @property {number} expiresAt
 * @property {string} kind
 */

/**
 * @typedef {object} GameState
 * @property {Phase} phase
 * @property {DifficultyKey} difficulty
 * @property {number} startedAt
 * @property {number} lastFrameAt
 * @property {number} elapsedMs
 * @property {number} catCounter
 * @property {Cat[]} cats
 * @property {Point} target
 * @property {SpawnSignal[]} signals
 */

/** @typedef {{ width: number, height: number, dpr: number }} View */

const MOUSE_RADIUS = 13;
const MOVEMENT_KEYS = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
]);

const app = /** @type {HTMLElement} */ (requiredElement("[data-app]"));
const canvas = /** @type {HTMLCanvasElement} */ (
  requiredElement("[data-game-canvas]")
);
const menuScreen = /** @type {HTMLElement} */ (
  requiredElement('[data-screen="menu"]')
);
const endScreen = /** @type {HTMLElement} */ (
  requiredElement('[data-screen="end"]')
);
const hud = /** @type {HTMLElement} */ (requiredElement("[data-hud]"));
const timerOutput = /** @type {HTMLOutputElement} */ (
  requiredElement("[data-timer]")
);
const catOutput = /** @type {HTMLOutputElement} */ (
  requiredElement("[data-cat-count]")
);
const liveRegion = /** @type {HTMLElement} */ (
  requiredElement("[data-live]")
);
const resultLine = /** @type {HTMLElement} */ (
  requiredElement("[data-result-line]")
);
const wonState = /** @type {HTMLElement} */ (
  requiredElement('[data-end-state="won"]')
);
const lostState = /** @type {HTMLElement} */ (
  requiredElement('[data-end-state="lost"]')
);
const replayButton = /** @type {HTMLButtonElement} */ (
  requiredElement('[data-action="replay"]')
);
const menuButton = /** @type {HTMLButtonElement} */ (
  requiredElement('[data-action="menu"]')
);
const difficultyButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (
  document.querySelectorAll("button[data-difficulty]")
);

const context = requireCanvasContext(canvas);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** @type {View} */
let view = { width: 1, height: 1, dpr: 1 };

/** @type {Readonly<Record<string, boolean>>} */
let heldKeys = Object.freeze({});

/** @type {GameState} */
let state = {
  phase: "menu",
  difficulty: "easy",
  startedAt: 0,
  lastFrameAt: performance.now(),
  elapsedMs: 0,
  catCounter: 0,
  cats: [],
  target: { x: 0, y: 0 },
  signals: [],
};

for (const button of difficultyButtons) {
  button.addEventListener("click", () => {
    const difficulty = button.dataset.difficulty;
    if (isDifficultyKey(difficulty)) {
      startRound(difficulty);
    }
  });
}

replayButton.addEventListener("click", () => startRound(state.difficulty));
menuButton.addEventListener("click", enterMenu);

canvas.addEventListener("pointerdown", (event) => {
  if (state.phase !== "playing") {
    return;
  }

  canvas.setPointerCapture(event.pointerId);
  updatePointerTarget(event);
  canvas.focus({ preventScroll: true });
  event.preventDefault();
});

window.addEventListener("pointermove", (event) => {
  if (state.phase === "playing") {
    updatePointerTarget(event);
  }
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (!MOVEMENT_KEYS.has(key) || state.phase !== "playing") {
    return;
  }

  event.preventDefault();
  heldKeys = Object.freeze({ ...heldKeys, [key]: true });
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (!MOVEMENT_KEYS.has(key)) {
    return;
  }

  heldKeys = Object.freeze({ ...heldKeys, [key]: false });
});

window.addEventListener("blur", () => {
  heldKeys = Object.freeze({});
});

window.addEventListener("resize", resizeCanvas);
new ResizeObserver(resizeCanvas).observe(canvas);

resizeCanvas();
enterMenu();
requestAnimationFrame(runFrame);

/**
 * @param {number} now
 */
function runFrame(now) {
  const deltaSeconds = Math.min(
    0.05,
    Math.max(0, (now - state.lastFrameAt) / 1000),
  );
  state = { ...state, lastFrameAt: now };

  if (state.phase === "playing") {
    updatePlaying(now, deltaSeconds);
  } else if (state.phase === "menu") {
    updateMenuAttract(now, deltaSeconds);
  }

  drawScene(now);
  requestAnimationFrame(runFrame);
}

/**
 * @param {DifficultyKey} difficulty
 */
function startRound(difficulty) {
  const now = performance.now();
  const config = DIFFICULTIES[difficulty];
  const target = { x: view.width / 2, y: view.height / 2 };
  const firstCat = makeCat("cat-1", difficulty, target);

  state = {
    phase: "playing",
    difficulty,
    startedAt: now,
    lastFrameAt: now,
    elapsedMs: 0,
    catCounter: 1,
    cats: [firstCat],
    target,
    signals: [makeSpawnSignal(firstCat, now)],
  };
  heldKeys = Object.freeze({});

  app.dataset.phase = "playing";
  menuScreen.hidden = true;
  endScreen.hidden = true;
  hud.hidden = false;
  syncHud();
  announce(`${config.label} night started.`);
  canvas.focus({ preventScroll: true });
}

function enterMenu() {
  const now = performance.now();
  const target = { x: view.width * 0.62, y: view.height * 0.58 };
  const demoCat = createCat({
    id: "menu-cat",
    bounds: view,
    target,
    difficulty: "medium",
    safeDistance: 100,
    rolls: { edge: 0.9, lane: 0.72, archetype: 0.5 },
  });

  state = {
    phase: "menu",
    difficulty: state.difficulty,
    startedAt: 0,
    lastFrameAt: now,
    elapsedMs: 0,
    catCounter: 0,
    cats: [demoCat],
    target,
    signals: [],
  };
  app.dataset.phase = "menu";
  menuScreen.hidden = false;
  endScreen.hidden = true;
  hud.hidden = true;
  difficultyButtons[0]?.focus({ preventScroll: true });
}

/**
 * @param {number} now
 * @param {number} deltaSeconds
 */
function updatePlaying(now, deltaSeconds) {
  const elapsedMs = now - state.startedAt;
  const keyboardTarget = applyKeyboard(state.target, deltaSeconds);
  const spawnedState = spawnDueCats(
    { ...state, target: keyboardTarget, elapsedMs },
    now,
  );
  const cats = spawnedState.cats.map((cat) =>
    advanceCat(cat, keyboardTarget, deltaSeconds),
  );
  const caught = cats.some((cat) =>
    circlesOverlap(cat, { ...keyboardTarget, radius: MOUSE_RADIUS }),
  );
  const phase = getRoundPhase({
    elapsedMs,
    durationMs: getDifficulty(state.difficulty).durationMs,
    caught,
  });

  state = {
    ...spawnedState,
    phase,
    elapsedMs,
    cats,
    target: keyboardTarget,
    signals: spawnedState.signals.filter((signal) => signal.expiresAt > now),
  };
  syncHud();

  if (phase === "won" || phase === "lost") {
    finishRound(phase);
  }
}

/**
 * @param {number} now
 * @param {number} deltaSeconds
 */
function updateMenuAttract(now, deltaSeconds) {
  const motionScale = reducedMotion.matches ? 0.25 : 1;
  const target = {
    x: view.width * 0.5 + Math.cos(now / 920) * view.width * 0.3 * motionScale,
    y: view.height * 0.54 + Math.sin(now / 680) * view.height * 0.25 * motionScale,
  };
  const currentCat = state.cats[0] ?? makeCat("menu-cat", "medium", target);
  const movedCat = advanceCat(currentCat, target, deltaSeconds * 0.8);
  const caught = circlesOverlap(movedCat, { ...target, radius: MOUSE_RADIUS });
  const nextCat = caught
    ? createCat({
        id: "menu-cat",
        bounds: view,
        target,
        difficulty: "medium",
        safeDistance: 180,
        rolls: rollsFromRandom(Math.random),
      })
    : movedCat;

  state = { ...state, target, cats: [nextCat] };
}

/**
 * @param {GameState} baseState
 * @param {number} now
 * @returns {GameState}
 */
function spawnDueCats(baseState, now) {
  let cats = [...baseState.cats];
  let signals = [...baseState.signals];
  let catCounter = baseState.catCounter;
  const scheduledCatCount = getScheduledCatCount(
    baseState.difficulty,
    baseState.elapsedMs,
  );

  while (cats.length < scheduledCatCount) {
    catCounter += 1;
    const cat = makeCat(
      `cat-${catCounter}`,
      baseState.difficulty,
      baseState.target,
    );
    cats = [...cats, cat];
    signals = [...signals, makeSpawnSignal(cat, now)];
    announce(`${cat.kind} cat joined. ${cats.length} cats.`);
  }

  return { ...baseState, cats, signals, catCounter };
}

/**
 * @param {"won" | "lost"} phase
 */
function finishRound(phase) {
  const catsLabel = state.cats.length === 1 ? "CAT" : "CATS";
  const survived = formatClock(state.elapsedMs);

  app.dataset.phase = phase;
  endScreen.setAttribute(
    "aria-labelledby",
    phase === "won" ? "end-title-won" : "end-title-lost",
  );
  hud.hidden = true;
  endScreen.hidden = false;
  wonState.hidden = phase !== "won";
  lostState.hidden = phase !== "lost";
  resultLine.textContent = `${survived} // ${state.cats.length} ${catsLabel}`;
  announce(phase === "won" ? "Night cleared." : "Cursor caught.");
  replayButton.focus({ preventScroll: true });
}

function syncHud() {
  const config = DIFFICULTIES[state.difficulty];
  timerOutput.value = formatClock(
    getRemainingMs(config.durationMs, state.elapsedMs),
  );
  catOutput.value = String(state.cats.length);
}

/**
 * @param {string} id
 * @param {DifficultyKey} difficulty
 * @param {Point} target
 * @returns {Cat}
 */
function makeCat(id, difficulty, target) {
  return createCat({
    id,
    bounds: view,
    target,
    difficulty,
    safeDistance: Math.min(280, Math.max(150, Math.min(view.width, view.height) * 0.44)),
    rolls: rollsFromRandom(Math.random),
  });
}

/**
 * @param {Cat} cat
 * @param {number} now
 * @returns {SpawnSignal}
 */
function makeSpawnSignal(cat, now) {
  return {
    x: Math.min(view.width - 16, Math.max(16, cat.x)),
    y: Math.min(view.height - 16, Math.max(16, cat.y)),
    expiresAt: now + 900,
    kind: cat.kind,
  };
}

/**
 * @param {PointerEvent} event
 */
function updatePointerTarget(event) {
  const rect = canvas.getBoundingClientRect();
  const touchOffset = event.pointerType === "touch" ? Math.min(58, rect.height * 0.1) : 0;
  const nextTarget = clampPoint(
    {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top - touchOffset,
    },
    view,
    MOUSE_RADIUS + 3,
  );
  state = { ...state, target: nextTarget };
}

/**
 * @param {Point} target
 * @param {number} deltaSeconds
 * @returns {Point}
 */
function applyKeyboard(target, deltaSeconds) {
  const horizontal =
    Number(Boolean(heldKeys.arrowright || heldKeys.d)) -
    Number(Boolean(heldKeys.arrowleft || heldKeys.a));
  const vertical =
    Number(Boolean(heldKeys.arrowdown || heldKeys.s)) -
    Number(Boolean(heldKeys.arrowup || heldKeys.w));
  const length = Math.hypot(horizontal, vertical);

  if (length === 0) {
    return target;
  }

  const distance = 330 * deltaSeconds;
  return clampPoint(
    {
      x: target.x + (horizontal / length) * distance,
      y: target.y + (vertical / length) * distance,
    },
    view,
    MOUSE_RADIUS + 3,
  );
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const previous = view;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.imageSmoothingEnabled = false;
  view = { width, height, dpr };

  if (previous.width > 1 && previous.height > 1) {
    const scaleX = width / previous.width;
    const scaleY = height / previous.height;
    state = {
      ...state,
      target: clampPoint(
        { x: state.target.x * scaleX, y: state.target.y * scaleY },
        view,
        MOUSE_RADIUS + 3,
      ),
      cats: state.cats.map((cat) => ({
        ...cat,
        x: cat.x * scaleX,
        y: cat.y * scaleY,
      })),
    };
  }
}

/**
 * @param {number} now
 */
function drawScene(now) {
  context.clearRect(0, 0, view.width, view.height);
  drawBackdrop();

  for (const signal of state.signals) {
    drawSpawnSignal(signal, now);
  }

  for (const cat of state.cats) {
    drawCat(cat, now);
  }

  drawMouse(state.target, now);
}

function drawBackdrop() {
  context.save();
  context.fillStyle = "#f4eedc";
  context.fillRect(0, 0, view.width, view.height);
  context.globalAlpha = 0.22;
  context.fillStyle = "#4b7eaa";

  for (let x = 24; x < view.width; x += 32) {
    context.fillRect(x, 0, 1, view.height);
  }

  for (let y = 24; y < view.height; y += 32) {
    context.fillRect(0, y, view.width, 1);
  }

  context.globalAlpha = 0.11;
  drawPaw(view.width * 0.12, view.height * 0.2, 5, "#211b2d");
  drawPaw(view.width * 0.84, view.height * 0.72, 7, "#ef6a4b");
  drawPaw(view.width * 0.2, view.height * 0.82, 4, "#65c5a5");
  context.restore();
}

/**
 * @param {SpawnSignal} signal
 * @param {number} now
 */
function drawSpawnSignal(signal, now) {
  const remaining = Math.max(0, signal.expiresAt - now) / 900;
  const size = 22 + (1 - remaining) * 12;
  context.save();
  context.globalAlpha = Math.min(1, remaining * 1.8);
  context.strokeStyle = signal.kind === "fast" ? "#ef6a4b" : "#211b2d";
  context.lineWidth = 4;
  context.strokeRect(signal.x - size, signal.y - size, size * 2, size * 2);
  context.fillStyle = "#f5c453";
  context.fillRect(signal.x - 4, signal.y - 4, 8, 8);
  context.restore();
}

/**
 * @param {Cat} cat
 * @param {number} now
 */
function drawCat(cat, now) {
  const pixel = Math.max(3, Math.round(cat.radius / 6));
  const velocityLength = Math.hypot(cat.vx, cat.vy);
  const angle =
    velocityLength > 0.001
      ? Math.atan2(cat.vy, cat.vx)
      : Math.atan2(state.target.y - cat.y, state.target.x - cat.x);
  const gait = (Math.floor(now / 105 + hashId(cat.id)) % 2) * 2 - 1;

  context.save();
  context.translate(Math.round(cat.x), Math.round(cat.y));
  context.rotate(angle);
  context.scale(cat.bodyLength, 1);

  context.globalAlpha = 0.18;
  context.fillStyle = "#211b2d";
  context.fillRect(-4 * pixel, 2 * pixel, 8 * pixel, 2 * pixel);
  context.globalAlpha = 1;

  context.fillStyle = cat.accent;
  context.fillRect(-6 * pixel, -pixel, 3 * pixel, pixel);
  context.fillRect(-7 * pixel, -2 * pixel, 2 * pixel, pixel);
  context.fillRect(-8 * pixel, -3 * pixel, 2 * pixel, pixel);

  context.fillStyle = cat.coat;
  context.fillRect(-4 * pixel, -2 * pixel, 7 * pixel, 4 * pixel);
  context.fillRect(2 * pixel, -3 * pixel, 3 * pixel, 5 * pixel);
  context.fillRect(3 * pixel, -4 * pixel, pixel, pixel);
  context.fillRect(5 * pixel, -4 * pixel, pixel, 2 * pixel);

  context.fillStyle = cat.accent;
  context.fillRect(3 * pixel, -2 * pixel, pixel, pixel);
  context.fillRect(5 * pixel, -2 * pixel, pixel, pixel);
  context.fillRect(5 * pixel, 0, 2 * pixel, pixel);
  context.fillRect(-2 * pixel, -2 * pixel, pixel, 4 * pixel);

  context.fillStyle = cat.coat;
  context.fillRect(-3 * pixel, 2 * pixel, pixel, pixel * (2 + Math.max(0, gait)));
  context.fillRect(pixel, 2 * pixel, pixel, pixel * (2 + Math.max(0, -gait)));
  context.restore();
}

/**
 * @param {Point} point
 * @param {number} now
 */
function drawMouse(point, now) {
  const pixel = 4;
  const bob = state.phase === "menu" ? Math.round(Math.sin(now / 160) * 2) : 0;
  context.save();
  context.translate(Math.round(point.x), Math.round(point.y + bob));

  context.globalAlpha = state.phase === "menu" ? 0.22 : 0.16;
  context.fillStyle = "#211b2d";
  context.fillRect(-14, 10, 32, 6);
  context.globalAlpha = 1;

  context.fillStyle = "#ef8e9f";
  context.fillRect(-24, 0, 8, pixel);
  context.fillRect(-20, 4, 8, pixel);
  context.fillRect(-16, 8, 8, pixel);

  context.fillStyle = "#fffaf0";
  context.fillRect(-12, -8, 24, 20);
  context.fillRect(8, -4, 12, 12);
  context.fillStyle = "#ef8e9f";
  context.fillRect(-8, -12, 8, 8);
  context.fillRect(4, -12, 8, 8);
  context.fillRect(20, 0, 4, 4);
  context.fillStyle = "#211b2d";
  context.fillRect(12, -1, 4, 4);
  context.restore();
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} pixel
 * @param {string} colour
 */
function drawPaw(x, y, pixel, colour) {
  context.fillStyle = colour;
  context.fillRect(x - pixel, y, pixel * 3, pixel * 2);
  context.fillRect(x - pixel * 2, y - pixel * 2, pixel, pixel);
  context.fillRect(x, y - pixel * 3, pixel, pixel);
  context.fillRect(x + pixel * 2, y - pixel * 2, pixel, pixel);
}

/**
 * @param {string} id
 * @returns {number}
 */
function hashId(id) {
  return Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0);
}

/**
 * @param {string | undefined} value
 * @returns {value is DifficultyKey}
 */
function isDifficultyKey(value) {
  return value === "easy" || value === "medium" || value === "hard";
}

/**
 * @param {string} message
 */
function announce(message) {
  liveRegion.textContent = message;
}

/**
 * @param {string} selector
 * @returns {Element}
 */
function requiredElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

/**
 * @param {HTMLCanvasElement} targetCanvas
 * @returns {CanvasRenderingContext2D}
 */
function requireCanvasContext(targetCanvas) {
  const targetContext = targetCanvas.getContext("2d");
  if (!targetContext) {
    throw new Error("Neko Escape requires a 2D canvas context");
  }

  return targetContext;
}
