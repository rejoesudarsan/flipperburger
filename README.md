# Flipperburger

A portable [Agent Skill](https://agentskills.io/specification) for building
product features in small, reviewable checkpoints. It adapts ideas from
[Shopify Helix](https://shopify.engineering/helix); it is an independent skill,
not Shopify's internal tool.

Each checkpoint starts with observable acceptance cases, implements one slice,
then records behavior, visual, code/product, and human decision evidence. A
failed or unrun gate cannot be called passed. The skill also works for a new
product where the reference is an approved product flow rather than an existing
app.

## Install

```sh
npx flipperburger install --agent all --scope project
```

Run this from the repository that should use the skill. `all` installs the same
portable skill into `.agents/skills/flipperburger` for Codex, Cursor, Gemini
CLI, GitHub Copilot, OpenCode, and Windsurf, plus `.claude/skills/flipperburger`
for Claude Code. These paths follow their current documentation:
[Codex](https://learn.chatgpt.com/docs/build-skills),
[Cursor](https://cursor.com/docs/skills),
[Gemini CLI](https://geminicli.com/docs/cli/skills/),
[Copilot](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills),
[OpenCode](https://opencode.ai/docs/skills/),
[Windsurf](https://docs.devin.ai/desktop/cascade/skills), and
[Claude Code](https://code.claude.com/docs/en/skills).

```sh
# Install only for selected agents.
npx flipperburger install --agent codex,cursor,claude

# Install to your home directory instead of one project.
npx flipperburger install --agent all --scope user

# Preview writes or target another project.
npx flipperburger install --dry-run
npx flipperburger install --dir /path/to/project

# For another Agent Skills client, supply its documented skills parent directory.
npx flipperburger install --target-dir /path/to/agent/skills
```

An existing, different `flipperburger` directory is left intact. `--force`
backs it up before replacement. User-scoped installation on your machine does
not automatically install the skill in remote/cloud agent sessions.

The source skill is [skills/flipperburger/SKILL.md](skills/flipperburger/SKILL.md).
It uses optional [tool integrations](skills/flipperburger/references/tool-integrations.md):
Mobbin for journey references, Jev for bounded typed review signals, current
documentation tools for APIs, and project CLIs or browser automation for gate
evidence. None is required to install or invoke the skill.

## Develop and validate locally

```sh
npm test
npm pack
```

To test a local tarball made by `npm pack` before publishing a change:

```sh
npx --yes --package ./flipperburger-0.1.0.tgz -- flipperburger install --dir /path/to/project
```

The package is distributed under the MIT license.
