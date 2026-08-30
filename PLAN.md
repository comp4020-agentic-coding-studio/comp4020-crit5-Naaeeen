# C5 implementation plan

## Response to the brief

Build **Neko Escape**, a tiny static survival game inspired by the movement and
charm of WebNeko but using original, locally rendered pixel cats.

The player is represented by a small mouse that follows pointer movement on
desktop and touch/tap movement on a phone. Cats chase it. Contact loses the
round; surviving the selected timer wins it. The game contains no tutorial or
how-to-play text: the opening composition, moving mouse, watching cat and
obvious time/difficulty choices must invite the first action.

## Fixed acceptance criteria

- A wrong move can cause a loss and every round ends in a win or loss.
- A cold player can make the first move without explanation and finish within
  five minutes.
- Difficulty choices last 1:00, 2:00 and 3:00.
- New cats enter periodically from a screen edge; coat, silhouette and movement
  make faster and slower cats legible.
- At least one game rule has a focused automated test.
- The built game works at 1920x1080 and 390x844.
- At least one later change is grounded in playing the finished game.
- The repository shows incremental green commits, a cited `PROCESS.md` and
  `reflections/crit-5.md`.
- Nothing is pushed or shipped in this implementation session.

## Experience direction

Use a deliberate late-1990s desktop-pet aesthetic: warm paper-like arena,
chunky ink borders, limited tomato/blue/mint palette and original pixel cats
drawn locally. Avoid generic cards, gradients and imported fonts.

The title screen shows the game name plus three large, self-explanatory choices
identified by paw intensity and `1:00`, `2:00`, `3:00`. These are labels,
not gameplay instructions. Selecting one begins immediately.

During play:

- The native pointer controls a visible mouse constrained to the arena, so
  leaving the browser is not an invulnerability exploit.
- Touch/tap moves the mouse with a visual offset so a finger does not cover it.
- Arrow/WASD input provides a keyboard path without adding tutorial copy.
- A cat spawn is telegraphed briefly at an edge and placed far enough from the
  mouse to avoid an unavoidable loss.
- One cat appears initially; another appears every 25 seconds.
- Cat variants differ in speed and steering: a fast cat overshoots more, a
  steady cat turns well, and a slow cat occupies space.
- The HUD contains only the countdown and compact status imagery.
- Win/loss screens use visual storytelling and a clear replay control, not
  retrospective instructions.

## Architecture

Keep the bare static stack already selected by the course `stack` skill.

- `game-rules.js`: pure configuration, collision, clamping, spawn selection,
  state transitions and cat movement. Time/random inputs are parameters.
- `main.js`: DOM/canvas setup, pointer/touch/keyboard adapters, animation
  frame loop and screen transitions.
- `styles.css`: responsive presentation and accessible focus/reduced-motion
  handling.
- `spec/game-rules.test.ts`: focused public-rule tests.
- `spec/game-page.test.ts`: built-page contract checks where useful.

Render the arena on one canvas while keeping title, difficulty and end controls
as semantic HTML. Canvas is decorative gameplay output; equivalent state is
announced in a restrained live region without containing gameplay instructions.

## TDD slices and local commits

1. Preserve the course-generated bare-stack conversion as its own green
   checkpoint.
2. Prune/update the cross-agent harness and commit this plan.
3. RED: specify collision, timer ending, edge spawning and viewport clamping.
4. GREEN: implement the pure rule model; refactor only after targeted and full
   suites pass.
5. Build the smallest playable desktop loop and commit when the built page is
   green.
6. Add difficulty, timed spawning, cat variants and mobile/keyboard input.
7. Apply the original visual system and responsive layout.
8. Run built-page browser verification at both marking viewports; cold-play,
   record the observation and make at least one experience-driven correction.
9. Complete `PROCESS.md`, `reflections/crit-5.md` and the link-preview card;
   run final checks and review the full diff.

## Verification evidence

For every implementation slice, capture the exact command and result. Final
verification must include:

- `mise exec -- pnpm check`
- `mise exec -- pnpm check:evidence`
- a production `pnpm preview`
- screenshots at 1920x1080 and 390x844
- browser console inspection
- pointer and phone-sized touch interaction
- keyboard focus/replay
- a fresh reviewer pass over code, tests, docs and secrets

## Research grounding

This plan follows the COMP4020 sequence of spec-driven development,
backpressure, context budgeting and agentic manual verification:

- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/lectures/week-2/
- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/lectures/week-3/
- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/lectures/week-4/
- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/lectures/week-5/
- https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/05-game/

It also applies current official guidance to keep instruction files concise,
explore before coding, expose deterministic verification, keep repository
knowledge versioned and require human review:

- https://code.claude.com/docs/en/best-practices
- https://openai.com/index/harness-engineering/
- https://openai.com/index/introducing-codex/
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-copilot-overview

