# Optional tool integrations

Choose the smallest tool that supplies missing evidence for the current gate.
The skill must still work when none of these integrations is installed.

| Need | Tool capability | Use | Limit |
| --- | --- | --- | --- |
| Understand an unfamiliar product journey or UI pattern | Mobbin MCP or another screen/flow reference source | Search one journey at a time; inspect actual returned screen previews; save canonical source links in the checkpoint record | Inspiration is not the product specification; do not claim a screen was examined from metadata alone |
| Triage ambiguous requirements or a large review set | Jev/TypeSafe typed judgment | Ask one narrow yes/no, choice, or ordered-score question over bounded observed material; retain probabilities and counterevidence | Never turn model confidence into a passing gate, confirmed user fact, or permission |
| Verify changing library or CLI behavior | Current official docs, Context7 CLI, or a documentation MCP | Resolve the exact package/version and look up the one API or command used in this slice | Documentation supports implementation choices; executable checks establish behavior |
| Prove behavior and diagnose failure | Project test CLI, local app runner, logs, traces, Git diff | Run the project's focused checks, then required full checks; preserve command and result | Source checks and mocks do not prove provider or deployed behavior |
| Review UI | Browser or simulator automation, screenshot capture, accessibility tooling | Capture the built state at relevant sizes and compare it with the approved brief/reference state | A screenshot of a different state is invalid comparison evidence |

Do not invoke an external MCP merely because it is available. Share only the
minimum relevant material, respecting the project's data and credential rules.
If a tool is unavailable, use a safe manual or deterministic alternative and
mark any missing gate evidence as pending. The agent should not install or
connect a paid/external service just to satisfy this table.
