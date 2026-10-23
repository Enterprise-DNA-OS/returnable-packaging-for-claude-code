---
description: Allocate returned units to the original issue.
---

# match-return

Read CLAUDE.md and docs/cli.md. Allocate returned units to the original issue.

1. Read the relevant current records first. Resolve names with the CLI; present ambiguity instead of guessing.
2. Replace example values with the operator’s requested values. Record their actor label. Preview imports before applying them.
3. Run: `npm run packaging -- match-return --issue=ISSUE-104 --return=RETURN-104 --qty=20 --actor="Operator name" --json`.
4. Explain the result in business terms, including missing evidence and unresolved records.
5. Never send a statement, email or message. Drafts remain local. Never infer physical handover from a database entry.
