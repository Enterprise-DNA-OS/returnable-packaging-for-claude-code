# Returnable Packaging for Claude Code

Find the pallets still owed to you, reconcile crate counts and keep the evidence behind every correction in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT licensed. Install the fictional demo and try the packaging week. | Your location codes, return rules, TrackOnline export mappings and business views. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=trackonline&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=trackonline&utm_medium=managed) |

For depot managers and food/logistics operators reconciling reusable packaging. Runs with Claude Code, Codex, OpenCode or Cursor. TrackOnline covers a wider connected service; this free base covers the movement register, returns, physical counts, disputes and evidence. [Scope and research](docs/research.md).

TrackOnline lists Pro Plus at EUR 1,535 a month, EUR 18,420 for twelve months before VAT. This is the published subscription, not a verified ANZ customer bill or an all-in implementation cost. [Vendor pricing](https://trackonline.com/what-is-trackonline/).

## Quick start

Node 20.6 or later on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/returnable-packaging-for-claude-code.git
cd returnable-packaging-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Local PGlite stores data in .data/db and supports one process at a time. DATABASE_URL selects Postgres. Use a fresh DATA_DIR or database for business records, run migrate, and import without the fictional seed. The demo has an overdue partial pallet return, overdue crates, a count discrepancy, stale inspection evidence and a quarantine observation. Dates are relative to first seed; repeated seeds preserve work.

## Five weekly jobs

1. /returns-due: identify owed units and the operator responsible for each partner.
2. /unmatched-returns: match received packaging to the issue it settles.
3. /reconciliations: compare physical counts with recorded balances.
4. /hygiene: review missing, stale or adverse observations for food-contact packaging.
5. /weekly-review: combine the returns, balances, disputes and evidence checks.

The project ships 29 CLI commands and 30 slash recipes. Every CLI command accepts --json. See [the command guide](docs/cli.md) for writes, reversals, imports and exports.

## Ten questions answered by the current CLI

TrackOnline has configurable reports. These are questions this build answers now; no claim is made that TrackOnline cannot answer them.

| Operator question | Command |
|---|---|
| Which partners still owe pallets from overdue issues? | returns-due |
| How many units remain after partial returns? | returns-due |
| Which received units have no matched issue? | unmatched-returns |
| Where are our crates according to the ledger? | balances |
| Which physical counts disagree with the movement history? | reconciliations |
| Which count changed after a backdated movement was added? | reconciliations |
| Which quantity disputes still have an owner and deadline? | disputes |
| Which food-contact pools have stale or adverse observations? | hygiene |
| Which movements are missing their docket reference? | compliance |
| What should we resolve in Monday's packaging meeting? | weekly-review |

## Corrections keep the evidence

Movements are immutable. Reverse a complete incorrect entry, then record the correct movement. Returns match the original issue by item and route and cannot over-allocate either side. Voiding a wrong match preserves its reason. Counts never silently adjust stock; the report also flags later entries that change the ledger for an old count date.

An entry is not proof of handover. Actor names are assertions, not authenticated signatures. The food-contact checks review recorded evidence and observations; they do not release packaging or certify safety. [Rules, sources and limits](docs/compliance.md).

## Bring your TrackOnline history

```bash
npm run packaging -- import trackonline --file=imports/transactions.csv --actor="Migration operator" --dry-run
npm run packaging -- import trackonline --file=imports/transactions.csv --actor="Migration operator"
```

Save the processed, item-level Excel export as CSV UTF-8 with ISO dates first. Map different headings with --map. The import preserves every source column, rejects duplicate or changed source keys, and rolls back a bad file. New locations and food-contact classifications require review. Opening balances, contractual due dates and return matches need reconciliation. Attachments, rental agreements and connected partner workflows do not come across automatically. [Export, mapping and cutover guide](docs/replace-trackonline.md).

## Your first hour: ten things to ask for

1. Put our business name and colours on the statements.
2. Show overdue pallets by partner and owner.
3. Explain the four-pallet discrepancy in the fictional Bay count.
4. Show food-contact packaging needing a physical check.
5. Record a returned quantity and match its original issue.
6. Draft a packaging statement without sending it.
7. Test our export headings before importing.
8. Add our partner account code through /customise.
9. Add a read-only end-of-week balance through /new-view.
10. Record a correction while preserving the original docket.

## Documents and views

npm run docs creates partner statement drafts, movement dockets and count reconciliation records as branded HTML. npm run view creates the packaging week and balance snapshots. Change brand.json once for name, logo and colours. Print HTML documents to PDF from a browser. No server or front end is included. [What a screen provides](docs/why-no-front-end.md).

## Verification and operation

npm test uses a temporary database, exercises every command and verifies partial returns, allocation limits, reversals, immutable history, backdated counts, atomic imports, source preservation, drafts and escaped HTML. The suite also supports a fresh disposable Postgres database via TEST_DATABASE_URL. The manual GitHub workflow includes Windows, Linux and Postgres checks.

export writes all nine record sets to JSON and refuses to overwrite a file. It is an interchange snapshot, not an automatic restore. Back up the database and referenced evidence separately. Public database access is revoked; shared use needs authentication and scoped roles. Read [operating instructions](CLAUDE.md).

MIT licensed. Not affiliated with TrackOnline or Anthropic. Hosting and agent use have separate costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=trackonline&utm_medium=readme).
