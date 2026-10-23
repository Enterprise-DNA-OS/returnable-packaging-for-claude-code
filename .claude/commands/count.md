---
description: Record a physical count without changing stock.
---

# count

Read CLAUDE.md and docs/cli.md. Record a physical count without changing stock.

1. Read the relevant current records first. Resolve names with the CLI; present ambiguity instead of guessing.
2. Replace example values with the operator’s requested values. Record their actor label. Preview imports before applying them.
3. Run: `npm run packaging -- count --location=BAY --item=PALLET --qty=76 --evidence=COUNT-02 --actor="Operator name" --json`.
4. Explain the result in business terms, including missing evidence and unresolved records.
5. Never send a statement, email or message. Drafts remain local. Never infer physical handover from a database entry.
