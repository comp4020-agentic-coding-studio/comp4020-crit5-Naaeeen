# Process overview

## Directing the agent through the repository

I did not begin with “make a game.” I audited the inherited Crit 4 harness,
read the Crit 5 contract, and separated stable rules from weekly decisions.
`CLAUDE.md` became the source-linked contract for architecture, commands,
verification and the no-push boundary; `AGENTS.md` routes other agents to it;
`PLAN.md` owns the game design. The repository, not a drifting chat, became the
shared context. See
[`209cc6e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Naaeeen/commit/209cc6e).

## Giving mechanical claims automatic backpressure

I wrote the focused rules test before `game-rules.js`; the first run failed
because the module was absent. The smallest green implementation extracted
timing, collision, clamping, spawning and pursuit into pure functions. Time and
random rolls are inputs rather than hidden browser state, while `main.js` is the
canvas adapter. The agent could therefore verify its output with a repeatable
command instead of treating plausible code as evidence. See
[`3e31d19`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Naaeeen/commit/3e31d19).

## Reserving judgement for play

Tests could prove capture and scheduling, but not whether the opening taught
itself or the chase felt fair. I played the built artefact at both marking
viewports, checked touch, replay and the console, then compared screenshots.
That exposed mobile title clipping and caused a targeted layout correction. See
[`b18f309`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Naaeeen/commit/b18f309)
and
[`cd8b647`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Naaeeen/commit/cd8b647).
Later, real user play found the cat curve too sparse. Rather than merely
re-prompting, I converted that judgement into a failing schedule test, a pure
`getScheduledCatCount` rule and explicit `12/9/7`-second intervals. The
34-test suite and a browser run verified the correction. See
[`111f7e1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Naaeeen/commit/111f7e1).

| Before play correction | After play correction |
| --- | --- |
| ![Mobile title clipped at the frame](docs/mobile-before.png) | ![Mobile title and all timers inside the frame](docs/mobile-after.png) |
