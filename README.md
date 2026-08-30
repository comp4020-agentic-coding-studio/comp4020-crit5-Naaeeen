# Neko Escape

An original desktop-pet-style browser game for COMP4020 Crit 5. Cats enter from
the edge and pursue a tiny mouse through a one-, two- or three-minute survival
round. The site is client-side and builds to static files for GitHub Pages.

## Local workflow

The repository pins Node and pnpm in `mise.toml`. In WSL, use `mise exec` so an
older system Node does not take precedence.

```sh
mise install
mise exec -- pnpm install
mise exec -- pnpm dev
mise exec -- pnpm check
mise exec -- pnpm check:evidence
mise exec -- pnpm build
mise exec -- pnpm preview
```

## Claude Code and the course plugin

From a WSL shell, install the official COMP4020 plugin marketplace and plugin:

```sh
claude plugin marketplace add comp4020-agentic-coding-studio/core
claude plugin install comp4020@comp4020
```

Inside Claude Code, run `/comp4020:doctor` to check the course environment and
`/plugin marketplace update comp4020` when you want plugin updates. The course
key belongs in Claude's untracked settings, never in this repository. See the
[official course setup](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/llm-access/)
and the [plugin source](https://github.com/comp4020-agentic-coding-studio/core).

## Repository map

- `index.html`, `styles.css`, `main.js` - page shell and browser runtime.
- `game-rules.js` - deterministic game rules shared by runtime and tests.
- `spec/` - persistent page invariants and Crit 5 contract tests.
- `CLAUDE.md` - canonical agent harness; `AGENTS.md` is its cross-tool entry.
- `PLAN.md` - design response, acceptance criteria and implementation slices.
- `PROCESS.md` and `reflections/crit-5.md` - assessed process evidence.
- `.github/workflows/checks.yml` - checks and Pages deployment after shipping.

This session intentionally stops before push or ship; the repository remains
private until the student runs the course's confirmed shipping workflow.
