---
description: Update the packaging classification and suitability evidence.
---

# set-item

Read CLAUDE.md and docs/cli.md. Update the packaging classification and suitability evidence.

1. Read the relevant current records first. Resolve names with the CLI; present ambiguity instead of guessing.
2. Replace example values with the operator’s requested values. Record their actor label. Preview imports before applying them.
3. Run: `npm run packaging -- set-item --item=TOTE --food-contact=true --suitability=SPEC-02 --actor="Operator name" --json`.
4. Explain the result in business terms, including missing evidence and unresolved records.
5. Never send a statement, email or message. Drafts remain local. Never infer physical handover from a database entry.
