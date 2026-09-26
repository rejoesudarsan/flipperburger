---
name: flipperburger
description: Build a product feature through small, reviewable checkpoints with recorded behavior, visual, code, and human decision gates. Use for substantial multi-step product work, especially a new app or flow; skip for a small isolated fix.
---

# Flipperburger

Adapt the checkpoint loop described in [Shopify Helix](https://shopify.engineering/helix). For a new product, the approved product outcome, flow, and design references are the target; do not invent a reference app or claim pixel equivalence to an inspiration product. Use [Spec Kit's](https://github.com/github/spec-kit/blob/main/docs/quickstart.md) ambiguity and consistency checks without creating a duplicate specification system. Make local behavior inspectable, as described in [OpenAI's harness engineering](https://openai.com/index/harness-engineering/).

## Start

1. Read the repository's own instructions and the one product flow being built. Identify settled requirements, open decisions, current implementation, and its required checks. Do not import another repository's infrastructure or assume its state.
2. State the user outcome and observable acceptance cases. Check the flow, acceptance cases, and planned slices for omissions or contradictions before implementation. Leave material choices in the project's decision log. Propose a short ordered set of checkpoints, each yielding something a person can inspect in minutes. The first checkpoint can be a product contract or app skeleton; later checkpoints add one behavior at a time.
3. Keep a checkpoint record in the repository's existing build/handoff location, or a compact `docs/build/` record if none exists. Record scope, target, state, acceptance cases, gates, evidence links or commands, findings, and the decision. Use [the record template](references/checkpoint-record.md) when the project has no established format. Keep target product docs separate from evidence of what has shipped.

## Run one checkpoint

- Implement only its agreed slice. Choose reversible defaults where open choices do not affect the slice. Record material unresolved decisions in the project's decision log.
- **Behavior gate:** exercise the user-visible success and failure paths with the smallest meaningful automated or manual checks. Keep the app bootable with safe fixtures and expose enough state, logs, or traces to diagnose failures. A source-level check is not proof of a working app.
- **Visual gate:** for UI work, inspect the running result at representative desktop and mobile sizes against the product brief and cited reference states. Check content, hierarchy, interaction, empty/loading/error states, and accessibility. Treat inspiration as direction, not a target for exact copying. For non-UI work, mark this gate not applicable with a reason.
- **Code and product gate:** review the changed slice against repository rules and the checkpoint's acceptance cases. Use two independent, context-isolated reviews when the change is substantial or risky and the environment permits; give reviewers the diff, constraints, and concrete question. Resolve findings and rerun affected checks. Do not claim reviews ran when they did not.
- **Decision gate:** show the actual artifact and evidence to the user for product judgment before treating a checkpoint as accepted, unless they have already authorized an autonomous run. Make the review concrete before requesting a decision. Record their feedback, fix findings, and rerun affected gates. Do not label a checkpoint accepted or advance past this gate merely because an AI score is high.

Use states `proposed`, `implementing`, `gates-running`, `awaiting-user-review`, `accepted`, and `blocked`. A failed gate keeps the checkpoint in progress; record the failure and repair it before advancing. Do not silently weaken acceptance cases or label unavailable evidence as a pass. Commit or deploy only when authorized by the task and repository rules.

## AI judgment boundary

Jev or another model may classify bounded, redacted evidence for routing or uncertainty. Use one narrow typed question with explicit options or ordered levels; supply the relevant observed text or diff, not a conclusion. It may suggest a follow-up question or flag a possible omission. Record its answer and probability distribution next to the source; low confidence or unavailable service falls back to deterministic checks or human review. Deterministic checks decide identity, authorization, persistence, test results, and gate status. A person decides product direction and approval. Never send credentials or unrelated private candidate data for workflow review.

## Optional tools

Read [tool integrations](references/tool-integrations.md) only when the checkpoint benefits from an external reference, bounded AI judgment, current API documentation, or browser evidence. Use available MCPs or CLIs by capability; no named service is required for this skill to run. Record which tool produced each piece of evidence and its limits.

## Finish and reuse

Record the accepted decision and reusable feedback in the checkpoint record, then start the next slice from that approved baseline. Report what is implemented, what was verified, which gates remain open, and the next checkpoint. Do not present a target flow as shipped behavior.
