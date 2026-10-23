# Packaging evidence rules and limits

Sources checked 23 October 2026. These are record checks for a packaging register. They do not certify legal compliance or packaging safety, calculate tax, or authorise physical dispatch.

| Rule | Check | Basis |
|---|---|---|
| MOV-01 | Movement has a docket or evidence reference | Local traceability policy supporting retention of relevant business records |
| LOC-01 | Location classification, owner and country recorded | Local accountability policy |
| ITEM-01 | Imported packaging is classified for food contact | Local classification policy |
| BAL-01 | Non-system balance is negative | Local reconciliation check; investigate incomplete opening balances |
| CNT-01 | A physical count differs from the ledger or its ledger changed later | Local reconciliation policy; no automatic stock adjustment |
| FOOD-01 | Suitability reference or current clean observation is missing for food-contact packaging held internally | Local evidence check, informed by the rules below |

## Australia: packaging suitability

[FSANZ food packaging](https://www.foodstandards.gov.au/business/food-safety/food-packaging) explains Standard 3.2.2 clause 9. Packaging must suit its use and avoid contamination. [Chapter 3 scope](https://www.foodstandards.gov.au/business/food-safety-standards) confirms these food-safety standards apply to Australia. The report uses that basis only at locations classified AU.

The register checks a recorded suitability reference and the latest inspection observation. It does not read the evidence, test a crate, determine safe cleaning methods or track each physical item. A clean observation is not a release certificate. Thirty days is a local reminder interval, not a statutory inspection period. Damaged and quarantine observations remain visible until a later physical observation is recorded. Nothing automatically prevents dispatch.

## New Zealand: packaging guidance

[MPI packaging guidance](https://www.mpi.govt.nz/food-business/food-packaging-rules-and-guidance) addresses safe, suitable packaging and clean, undamaged materials. Do not apply Australia's Standard 3.2.2 to a New Zealand business as legislation. Set the operator's actual food-control plan and evidence process during installation.

## Retain the evidence, not just the link

[IRD records of income and expenses](https://www.ird.govt.nz/managing-my-tax/record-keeping/records-of-income-and-expenses) includes asset and liability information in tax records and states a seven-year period for sales and purchase records. [Australian Government record keeping](https://business.gov.au/finance/payments-and-invoicing/record-keeping) describes the general five-year rule and longer periods for some records. Applicability, start dates and longer obligations depend on the business and record.

Movements, counts, inspections, import batches and activity records cannot be edited or deleted through ordinary table operations. Corrections preserve the original and add an offset. Allocation cancellation preserves the original with a reason. Full exports include source rows and history. This assists traceability; it does not implement a complete tax retention policy. Evidence references are not copies of the files. Keep the original exports, dockets, inspection records and backups for the required period. There is no purge command or automatic expiry date.

## Operating limits

Actor labels are asserted text. Database owners can alter the database and disable triggers; this is not a tamper-proof legal audit archive. Shared business use needs scoped accounts, authentication, access review and independent backups. Review a discrepancy with the partner before making an adjustment or sending a statement.
