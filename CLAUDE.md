# COMP4020 Crit 5 harness

This repository ships a tiny static browser game for COMP4020 Crit 5. The
deployed page is the marked artefact; the repository is the evidence trail for
how it was directed, tested and corrected.

Read the live Crit 5 contract before changing scope:

- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/05-game/
- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#marking-environment

## Instruction map

- The published brief and spec are the fixed contract.
- This file contains stable repository rules that should load every session.
- `PLAN.md` contains this Crit's design response and current implementation plan.
- `spec/` turns mechanical promises into automatic backpressure.
- Browser play at the marking viewports covers interaction and judgement that
  source and DOM tests cannot.
- `PROCESS.md` and `reflections/crit-5.md` record evidence after the work is real.
- `AGENTS.md` points non-Claude agents at this same canonical harness.

Do not copy session-specific tasks or course facts into this file. Link to their
source so the standing harness stays short and does not drift.

## Working loop

1. Inspect the brief, `git status`, the relevant files and existing checks.
2. Write or update `PLAN.md` before a multi-file or behavioural change.
3. Establish a green baseline before editing.
4. For a mechanical rule, demonstrate RED with a focused test, implement the
   smallest GREEN change, then refactor while the suite stays green.
5. Run the built page and exercise the real interaction; code review is not a
   substitute for play.
6. Commit only coherent green checkpoints with descriptive messages.

When a manual check exposes a mechanical bug, reproduce it with a failing test
before fixing it. When the same correction recurs, promote it into this harness
or an automatic sensor instead of relying on another prompt.

## Toolchain and commands

Use the versions pinned in `mise.toml`. The non-interactive WSL shell may expose
an older system Node, so run project commands through `mise exec -- ...`.

- `mise exec -- pnpm dev` - serve the working tree.
- `mise exec -- pnpm test` - fast Vitest loop.
- `mise exec -- pnpm typecheck` - static checks.
- `mise exec -- pnpm build` - create the actual `dist/` artefact.
- `mise exec -- pnpm preview` - serve the built artefact.
- `mise exec -- pnpm check` - typecheck, build and tests.
- `mise exec -- pnpm check:evidence` - validate assessed process files.

Read a failed command's output before editing. Never weaken a check merely to
make it green.

## Architecture guardrails

- Keep the existing bare HTML/CSS/JavaScript stack and client-only GitHub Pages
  deployment. Do not add a backend, framework or dependency without a concrete
  need.
- Keep timing, collision, spawning, clamping and state transitions in
  `game-rules.js` as deterministic pure functions. Pass time and randomness in;
  do not hide them behind the DOM or global state.
- Keep `main.js` as the browser adapter for DOM, canvas, input and the animation
  frame loop.
- Model round states explicitly: `menu`, `playing`, `won`, `lost`.
- Keep assets local and original or clearly licensed. Do not hotlink WebNeko
  sprites; reproduce only the desktop-pet feeling with original rendering.
- Preserve `spec/invariants.test.ts` and the pre-commit secret guard.

## Verification boundary

Before accepting an implementation checkpoint:

- run the focused test and `mise exec -- pnpm check`;
- run the built site, not only the development server;
- exercise `1920x1080` and `390x844` in Chrome-compatible tooling;
- verify pointer, touch-sized interaction, keyboard focus/replay and resize;
- inspect the browser console for errors or warnings;
- cold-play the opening without instructions and reach a win or loss;
- record at least one change caused by playing the finished game.

The no-tutorial, fairness and five-minute-interest requirements are human
judgements. Do not pretend a DOM assertion proves them.

## Git and safety

- Preserve unrelated user changes and inspect the diff before every commit.
- Never use destructive Git commands on an ambiguous target.
- Never commit keys, tokens or `.claude/` credentials.
- Commit locally in small green checkpoints.
- Do not push, publish, make the repository public or run the course ship skill
  unless the user explicitly asks.

## Shipped page conventions

- Keep one meaningful `<h1>`, a navigation landmark, real metadata, a working
  `og:image`, visible keyboard focus and semantic controls.
- Support reduced motion and avoid remote fonts or unnecessary network requests.
- A difficulty control may show its duration, but the game itself must teach
  the chase through motion and feedback, not tutorial copy.
