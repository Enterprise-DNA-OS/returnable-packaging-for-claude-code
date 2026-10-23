# Returnable Packaging for Claude Code: operating instructions

This register is for the depot manager who reconciles pallets, crates and other returnable packaging. It records what moved, what came back, what was counted and what needs a physical check.

Business: fill in your business name. Operator: fill in your name and role. Priorities: agreed balances, returned packaging and traceable corrections.

## Start with evidence

Read docs/cli.md and run npm run packaging -- attention --json. A record is an operator assertion, not proof that a physical movement occurred. Never invent a docket, quantity, return match, inspection or owner. Read a location's full history before changing its classification. List ambiguous candidates and stop that write until resolved.

## Routing

| Ask | Recipe |
|---|---|
| List sites and partners with their responsible owner. | /locations |
| List packaging types and food-contact classifications. | /items |
| Trace posted movements and their evidence. | /movements |
| Read the recorded unit balance at each location. | /balances |
| Find overdue issues, partial returns and missing due dates. | /returns-due |
| Find returned units not matched to an issue. | /unmatched-returns |
| Compare physical counts with the ledger, including backdated changes. | /reconciliations |
| Read unresolved and closed quantity disputes. | /disputes |
| Review food-contact packaging observations. | /hygiene |
| Check missing evidence, classifications, negative balances and hygiene review records. | /compliance |
| Combine overdue returns, disputes and record checks. | /attention |
| Prepare the weekly packaging review from balances, returns and evidence. | /weekly-review |
| Read one location and its movement history. | /location |
| Register a depot, partner or opening-balance source. | /add-location |
| Classify a location and assign an owner and country. | /set-location |
| Register a packaging type and its suitability evidence. | /add-item |
| Update the packaging classification and suitability evidence. | /set-item |
| Post a movement with a docket reference. | /log |
| Correct a posted movement by recording its complete offset. | /reverse |
| Allocate returned units to the original issue. | /match-return |
| Void an incorrect return allocation with a reason. | /unmatch-return |
| Record a physical count without changing stock. | /count |
| Record the result of a physical packaging inspection. | /inspect |
| Assign a quantity dispute and deadline. | /raise-dispute |
| Close a dispute with its resolution. | /close-dispute |
| Write a local partner statement draft. | /draft-statement |
| Preview and import TrackOnline item-level transaction exports. | /import |
| Write a complete JSON interchange snapshot. | /export |
| Change a field or rule | /customise |
| Add a read-only snapshot | /new-view |

## Hard rules

- Use scripts/packaging.mjs for record changes. Each write needs the operator's --actor label. It is not authentication.
- Corrections reverse movements; allocations are voided with reasons. Never delete or overwrite history.
- Never send email or a statement. Drafts in drafts/ are for a person to review and send separately.
- Never claim food safety, tax compliance, actual receipt, or a partner's agreement from these records alone. Read docs/compliance.md.
- Public sharing, external changes and destructive work need the operator's explicit authorisation.
- Use a fresh DATA_DIR or DATABASE_URL for real records. Never import a business ledger into the fictional demo.
- DATABASE_URL selects Postgres; otherwise PGlite uses DATA_DIR, default .data/db. PGlite has one local process at a time.
- This is a trusted-operator tool. Before shared use, add authenticated access, scoped database roles, private backups and tested recovery. Never expose database credentials to a browser. The schema revokes public access.
- Migrations live in supabase/migrations. Never edit an applied migration. Run npm test after code changes.

## Files

scripts/packaging.mjs is the single CLI. supabase/seed.sql is fictional. views.json and documents.json define read-only HTML outputs, branded by brand.json. Generated records and documents are ignored by Git. Referenced evidence files need separate retention and backups. A JSON export is not an automatic restore.

Built and run for businesses through Omni by Enterprise DNA: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=trackonline&utm_medium=agent
