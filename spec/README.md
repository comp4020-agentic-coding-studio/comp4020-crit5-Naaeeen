# The spec

Every deliverable's spec - what the markers consider when they judge whether
your work matches what was required - is published on the course website, and
this repo's name tells you which one applies. The brief poses the problem; the
spec is the fixed contract. Read both on the site before you plan or build.

The checks in this directory come in two kinds.

## Invariants (shipped, always on)

`invariants.test.ts` asserts things that are true of any good website, however
you build it and whatever the week's brief asks: a navigation landmark, exactly
one top-level heading, a document language, a real title, a meta description, an
`og:image` card, a mobile viewport, and alt text on images. It runs against the
**built** site (`dist/`), so it checks what actually ships. Keep it green; do
not delete it.

The description and card are what a shared link looks like. The card check is
presence-only, so verify that the deployed path resolves as part of browser
testing.

## Your spec tests

Turning the week's published spec into tests is your work, not the template's.
Assert mechanically checkable rules in a focused test alongside the supplied
invariants. Leave requirements that need human judgement to actual play and the
crit. Test public contracts rather than implementation details so the tests
survive refactoring.

- **Contract tests** answer this week's published spec and stay with this Crit.
- **Sensors** protect a standard you expect every week and belong to the
  reusable harness.

A green suite is backpressure, not proof that the experience is good. The tutor
still judges the deployed page against the published spec.

## Crit 5 boundary

Good mechanical candidates for this game include:

- collision ends the round as a loss;
- the timer reaching zero ends the round as a win;
- difficulty presets have their intended duration and pressure;
- new cats enter from an arena edge and respect a safe spawn distance;
- the player target remains inside playable bounds.

The no-tutorial, fairness and five-minute-interest requirements are not unit
test claims. Verify those through cold play at both marking viewports and cite
the resulting correction in `PROCESS.md`.
