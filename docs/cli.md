# Command guide

One CLI, 29 commands. Add --json to any command for machine-readable results. All writes need --actor. Actor labels are recorded assertions, not authenticated signatures. Arguments use --flag=value. Unknown flags fail.

## locations

List sites and partners with their responsible owner.

```bash
npm run packaging -- locations
```

## items

List packaging types and food-contact classifications.

```bash
npm run packaging -- items
```

## movements

Trace posted movements and their evidence.

```bash
npm run packaging -- movements
```

## balances

Read the recorded unit balance at each location.

```bash
npm run packaging -- balances
```

## returns-due

Find overdue issues, partial returns and missing due dates.

```bash
npm run packaging -- returns-due
```

## unmatched-returns

Find returned units not matched to an issue.

```bash
npm run packaging -- unmatched-returns
```

## reconciliations

Compare physical counts with the ledger, including backdated changes.

```bash
npm run packaging -- reconciliations
```

## disputes

Read unresolved and closed quantity disputes.

```bash
npm run packaging -- disputes
```

## hygiene

Review food-contact packaging observations.

```bash
npm run packaging -- hygiene
```

## compliance

Check missing evidence, classifications, negative balances and hygiene review records.

```bash
npm run packaging -- compliance
```

## attention

Combine overdue returns, disputes and record checks.

```bash
npm run packaging -- attention
```

## weekly-review

Prepare the weekly packaging review from balances, returns and evidence.

```bash
npm run packaging -- weekly-review
```

## location

Read one location and its movement history.

```bash
npm run packaging -- location --location=BAY
```

## add-location

Register a depot, partner or opening-balance source.

```bash
npm run packaging -- add-location --code=EAST --name="East partner" --kind=partner --owner=Jules --country=NZ --actor="Operator name"
```

## set-location

Classify a location and assign an owner and country.

```bash
npm run packaging -- set-location --location=EAST --kind=partner --owner=Jules --country=NZ --actor="Operator name"
```

## add-item

Register a packaging type and its suitability evidence.

```bash
npm run packaging -- add-item --code=TOTE --name="Returnable tote" --food-contact=true --suitability=SPEC-01 --actor="Operator name"
```

## set-item

Update the packaging classification and suitability evidence.

```bash
npm run packaging -- set-item --item=TOTE --food-contact=true --suitability=SPEC-02 --actor="Operator name"
```

## log

Post a movement with a docket reference.

```bash
npm run packaging -- log --ref=ISSUE-104 --item=PALLET --from=DEPOT --to=BAY --qty=20 --evidence=DOCKET-104 --actor="Operator name"
```

## reverse

Correct a posted movement by recording its complete offset.

```bash
npm run packaging -- reverse --movement=ISSUE-104 --ref=REV-104 --reason="Correct duplicate" --evidence=CORRECTION-104 --actor="Operator name"
```

## match-return

Allocate returned units to the original issue.

```bash
npm run packaging -- match-return --issue=ISSUE-104 --return=RETURN-104 --qty=20 --actor="Operator name"
```

## unmatch-return

Void an incorrect return allocation with a reason.

```bash
npm run packaging -- unmatch-return --allocation=<unique-id-prefix> --reason="Wrong issue" --actor="Operator name"
```

## count

Record a physical count without changing stock.

```bash
npm run packaging -- count --location=BAY --item=PALLET --qty=76 --evidence=COUNT-02 --actor="Operator name"
```

## inspect

Record the result of a physical packaging inspection.

```bash
npm run packaging -- inspect --location=DEPOT --item=CRATE --result=clean --evidence=WASH-02 --note="Physical check recorded" --actor="Operator name"
```

## raise-dispute

Assign a quantity dispute and deadline.

```bash
npm run packaging -- raise-dispute --movement=ISSUE-101 --title="Quantity differs" --owner=Jules --due=2026-12-01 --actor="Operator name"
```

## close-dispute

Close a dispute with its resolution.

```bash
npm run packaging -- close-dispute --dispute=<unique-id-prefix> --resolution="Signed docket reconciled" --actor="Operator name"
```

## draft-statement

Write a local partner statement draft.

```bash
npm run packaging -- draft-statement --location=BAY
```

## import

Preview and import TrackOnline item-level transaction exports.

```bash
npm run packaging -- import trackonline --file=imports/transactions.csv --actor="Migration operator" --dry-run
```

## export

Write a complete JSON interchange snapshot.

```bash
npm run packaging -- export --out=exports/register.json
```

## Dates and quantities

Dates use YYYY-MM-DD. log, reverse, count and inspect accept --date and default to today in UTC. log accepts --due and --note; a due date cannot precede movement date. Quantities are whole units. Counts can be zero; movements and allocations must be positive. Future posted movements, counts and inspections are rejected. A physical count is the close-of-day count, not an intraday checkpoint.

Location kinds are internal, partner, system and unknown. Country is NZ, AU or other. Imported locations start unknown. Imported food-contact classifications start unknown; use set-item after review. Inspect results are clean, damaged or quarantine. Thirty days is the local inspection-review interval, not a legal frequency.

Codes and references match exactly without case; names match without case; IDs accept unique prefixes. Ambiguous matches list candidates and exit 1. Dates, flags and ambiguous records never get guessed.

## Ledger meaning

Opening balances are movements from a system location to a real location. Transfer movements have two locations and one item type. Corrections reverse a complete movement and then post the corrected replacement. A return allocation pairs a partner-to-depot return to the opposite depot-to-partner issue for the same item, on or after the issue date. Returns to a different depot require a reviewed transfer and matching plan; never force an unrelated allocation. Allocations cannot exceed either movement. Unmatch an allocation before reversing either side. Reversing a reversal is blocked.

A negative balance is reported for review, not silently prevented: an incomplete historical import can legitimately expose a missing opening balance. Returns-due requires explicit matches; it never assumes net balance identifies an overdue delivery. Reclassifying a location changes how its movements appear in the returns review, so review existing history first.

Counts store the ledger balance as it stood when recorded and recompute the ledger for that count date. A later backdated movement flags the count for re-review. New counts do not erase old variances. No count automatically adjusts stock. Inspection records describe the observed pool at a location and date; they do not identify individual crates, release stock, or block dispatch.

Export includes nine record sets and refuses to overwrite an existing file. It is an interchange snapshot, not a restore program. Import details are in the replacement guide.
