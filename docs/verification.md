# Verification on 23 October 2026

Local Node 22 on Linux: npm install, npm test and npm run demo passed. The test suite passed 87 assertions and exercised all 29 CLI commands against PGlite. It also rendered the two read-only dashboards and all document definitions. The demo produced ten documents in three families. Desktop and mobile dashboard checks found no page overflow. A partner statement was visually inspected.

The manual GitHub workflow was dispatched for Linux and Windows on Node 20 and 22, plus Postgres 17. GitHub blocked every job before any step ran because recent account payments failed or the spending limit needed an increase. These are not test failures and are not recorded as passing environments. No spending settings were changed.

Run: https://github.com/Enterprise-DNA-OS/returnable-packaging-for-claude-code/actions/runs/39892459642

The schema uses standard Postgres SQL and the suite supports TEST_DATABASE_URL against a fresh disposable database, but native Postgres and Windows execution remain unverified in this run. The single adapter, portable paths and Node process runner are shared between environments.
