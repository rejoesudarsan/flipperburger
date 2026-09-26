# Checkpoint record template

Use this only when the project has no existing build record. Keep it beside the
project's active product docs and link to the actual source of truth.

```markdown
# <Feature>: checkpoint <number> — <small reviewable result>

State: proposed
Target: <product brief, flow, reference state, or behavior contract>
Scope: <what this slice builds>
Acceptance: <observable success and failure cases>

## Evidence

- Behavior: pending
- Visual: pending / not applicable with reason
- Code and product review: pending
- Human decision: pending

## Findings and decision

<Failed checks, fixes, unresolved choices, feedback, and date.>
```

Keep `pending` until a check actually runs. Cite screenshots, commands, logs,
or review notes that can be inspected. A passing documentation check is not
runtime behavior evidence.
