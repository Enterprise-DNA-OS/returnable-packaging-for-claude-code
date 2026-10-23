---
description: Correct a posted movement by recording its complete offset.
---

# reverse

Read CLAUDE.md and docs/cli.md. Correct a posted movement by recording its complete offset.

1. Read the relevant current records first. Resolve names with the CLI; present ambiguity instead of guessing.
2. Replace example values with the operator’s requested values. Record their actor label. Preview imports before applying them.
3. Run: `npm run packaging -- reverse --movement=ISSUE-104 --ref=REV-104 --reason="Correct duplicate" --evidence=CORRECTION-104 --actor="Operator name" --json`.
4. Explain the result in business terms, including missing evidence and unresolved records.
5. Never send a statement, email or message. Drafts remain local. Never infer physical handover from a database entry.
