# Replace the packaging register in TrackOnline

This imports processed, item-level transaction rows. It does not migrate the whole TrackOnline service, partner network, rental contracts, attachments, scans or signatures. Keep those facilities operating until your replacement has been reconciled.

## Export while access is active

[TrackOnline's terms](https://trackonline.com/terms-and-conditions/) section 4.8 describes Excel export up to the last day of the agreement. [Smart Balance](https://trackonline.com/new-smart-balance/) supports saved layouts and Excel exports. Export both the movement history and the opening/current balances for a control total. A balance report is not a transaction file.

[The Royal FloraHolland TrackOnline Webview manual](https://np-royalfloraholland-production.s3-eu-west-1.amazonaws.com/Manual-TrackOnline-Webview-English-15102025.pdf) documents transaction export to XLSX, filtered selections and a 10,000-transaction maximum per export for that deployment. Your installation and report layout can differ. The public vendor pages do not specify a universal transaction workbook schema.

Choose an item-level export with transaction number, item, quantity, origin, destination, date and status. Filter to Processed. Save the worksheet as CSV UTF-8, with a single header row. Preserve source identifiers and all extra columns. Dates must be YYYY-MM-DD; choose an ISO display format before saving CSV. Confirm quantities are whole units. The included fixture is synthetic, not a captured vendor/customer export.

## One import command

Use a fresh database with migrations applied and no demo seed. Keep original exports outside the Git working files.

```bash
npm run packaging -- import trackonline --file=imports/transactions.csv --actor="Migration operator" --dry-run
npm run packaging -- import trackonline --file=imports/transactions.csv --actor="Migration operator"
```

The first command makes no lasting writes. The second imports the same file atomically. On Windows PowerShell, set $env:DATA_DIR to a fresh directory first; on bash use export DATA_DIR. Run npm run migrate there. Do not run demo or seed against business records.

## Heading mapping

Default headings are Number, Item, Quantity, From, To, Date, Status and optional Reference. These are supported adapter headings, not a claim every TrackOnline export uses them. For other headings, supply --map=imports/mapping.json:

```json
{"id":"Transaction number","item":"Item code","quantity":"Amount","from":"From location","to":"To location","date":"Transaction date","status":"Status","evidence":"Reference"}
```

Mappings rename columns only. They do not guess date conventions, translate statuses or expand pivoted item columns. If the export has one column per item, flatten it to one row per transaction/item while retaining the untouched workbook. If a transaction has multiple lines of the same item, obtain a stable line-level identifier in the mapped id column. Duplicate transaction/item keys fail; do not silently combine distinct movements.

## What maps

| Export field | Destination |
|---|---|
| Transaction number plus item | Stable source key for repeat-import checks |
| Item | Packaging code, created with food-contact classification unknown |
| From / To | Location codes; new locations start unclassified |
| Quantity | Positive whole units moved from origin to destination |
| Date | Posted calendar date, no future postings |
| Status | Must be Processed; other statuses reject the entire file |
| Reference | Docket/evidence reference; missing evidence becomes a review finding |
| Every column | Preserved in the original source payload |

Exact repeated source rows do not create duplicate movements. A changed source row rejects the complete file so a previously recorded quantity cannot silently change. Record corrections with reverse and log, then document how the source export and local correction relate. Do not re-import a changed source key without an explicit migration design. New and Cancelled rows are not posted stock and must be handled separately.

## Reconcile before cutover

1. Classify imported locations and food-contact items using set-location and set-item. The import cannot infer them.
2. Record reviewed opening balances from a system source when the export starts part-way through history. Avoid double-counting if complete acquisition history was imported.
3. Match returns to original issues with match-return. Imported rows do not infer pairings or contractual return dates. A no-due-date finding needs a reviewed correction or a migration that brings those dates across.
4. Compare per-location and per-item balances with TrackOnline, then record a physical count. Keep discrepancies assigned with raise-dispute.
5. Check history, evidence attachments, daily receiving and the partner statement with the team. Keep the source service until the required operating workflows and controls pass.

Save dockets, photos, agreements, correspondence, attachments and scan evidence separately. This free base has no automatic connection to TrackOnline Connect, RFID readers, a phone app or a rental billing system. Enterprise DNA maps the actual export and builds the required connections as part of your scoped installation.
