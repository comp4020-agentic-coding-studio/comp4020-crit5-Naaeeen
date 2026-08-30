# Crit 5 reflection

## What was the breakthrough that moved the work forward?

The breakthrough was treating the agent as a worker inside two feedback loops,
not as the source of truth. The mechanical loop was specification → failing
test → smallest implementation → full check. It worked because time and
randomness were inputs while collision, spawning and movement were pure rules.
The experiential loop was build → play at both marking viewports → observe →
correct. Keeping them separate stopped a green suite from being presented as
proof that the game was obvious or fun. Screenshots found a mobile layout
failure that code checks missed; later, player feedback showed that cats
arrived too slowly. I turned the second judgement into a tested scheduling rule
so the correction would survive future agent sessions.

## What did this work change about who I want to be as a software developer?

I want to engineer conditions in which an agent can be wrong cheaply, visibly
and reversibly. That means grounding work in primary requirements, keeping
persistent instructions short and repository-specific, creating deterministic
interfaces for mechanical behaviour, and requiring command or browser evidence
before accepting a claim. Human authority still belongs where automation is
weak: taste, fairness and whether an interaction teaches itself. I also want
feedback to improve the system rather than produce another one-off prompt. A
repeated correction should become a harness rule, test or validation step; a
weekly choice should stay in the plan; and delegated work should end with diff
review and a green checkpoint. The goal is not to make the agent sound
confident. It is to make the work legible enough that confidence is unnecessary.
