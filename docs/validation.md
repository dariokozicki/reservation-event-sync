# Validation record

## Relational reservation model

The local domain model now lives in typed `reservations` columns rather than `streams.local` JSONB.
The migration creates the table, backfills existing values, then removes the old column.
It preserves the API's `local` object and the existing transactional email behavior.

The production build, formatting, ESLint/file limits, TypeScript, and 37 unit tests passed.
The expanded PostgreSQL suite passed 25 integration tests (62 tests total). Six added cases cover
pre-creation event tracking, overview/detail consistency, database constraints for version/status/
guest count/date ordering, and migration backfill of pending, confirmed, and cancelled reservations.

The running demo was backed up and its old web/worker processes stopped before migration. All 21
existing reservation values matched afterward (16 confirmed, 4 cancelled, 1 pending), as did every
tracking row, source event, inbox entry, delivery, confirmation, provider receipt, and email attempt.
The migrated dashboard displayed the existing reservations correctly. An HTTP gap-recovery smoke
test created a new pending v1 reservation, delivered missing v2, reached confirmed v3, and accepted
one email with a working reservation-page link. The main database was not reset.

CodeRabbit completed an independent review of the 15-file normalization diff and raised zero issues.

The repeated 100-reservation stress run (seed 2026, concurrency 8) passed: 360 unique events,
1,075 deliveries, 715 duplicates, 80 expected/accepted emails, and 99 attempts. There were no
conflicts, blocked events, or mismatches. Ingestion took 2,554 ms; total time was 99,882 ms.

A fresh tracked-source export built and started in Windows PowerShell on ports 3005/55437 with
a new database. Its gap-recovery smoke test and port-specific reservation email link passed.
The official Linux Docker CLI container then ran the documented checks and integration commands
against that clean project: 37 unit and 25 integration tests passed. As before, this verifies a
Linux shell/client against Docker Desktop's Linux engine, not a separate native Linux host.
Disposable verification services were removed; the migrated main web/database remained healthy.

## Tailwind and internationalization quality pass

The UI now uses Tailwind utilities and shared controls. Only the Tailwind import/theme stylesheet
remains. next-intl provides typed English catalogs, complete parameterized messages, pluralization,
and date/number formatting. A lint rule rejects new raw JSX copy and literal accessible labels.

Local formatting, ESLint/file limits, TypeScript, and 37 unit tests passed. The production Docker
build and 19 PostgreSQL/worker integration tests passed after the refactor. One additional unit test
covers cancellation while reading an HTTP response body; the final clean-copy checks include it.

The browser walkthrough created Taylor Reed with one guest, displayed pending state and no email,
switched between mutually exclusive update/cancel forms, and confirmed the reservation. One email
was accepted with the correct frozen details and a working reservation link. The page displayed
"1 guest" and "1 attempt", retained its selected tab across refresh, and supported keyboard tab
navigation. At 390 x 844 there was no page-level horizontal overflow. No warning/error logs were
observed. Existing emails remained unchanged. Screenshots were inspected at desktop/mobile sizes.

CodeRabbit completed its independent review of the UI refactor and raised one minor issue:
response-body cancellation could be swallowed as malformed JSON. The current client rethrows
AbortError from both fetch and body parsing; the regression test passed. No unresolved review issues
remain. The production-only dependency audit reported zero advisories after the added dependencies.

### Final clean-copy verification

The final source revision was exported from the Git index without node_modules or an environment
file. Windows PowerShell built and started `reservation-sync-final-windows` on ports 3004/55436,
then passed formatting, lint/file limits, TypeScript, and all 37 unit tests inside Docker.
The Linux CLI/shell container built and started `reservation-sync-final-linux` on ports 3003/55435,
then passed the same checks and all 19 PostgreSQL/worker integration tests. All commands exited 0.
The Linux-host qualification in Platform verification below still applies.

Both fresh installations passed HTTP smoke checks: a missing event persisted pending v1 with no
email; delivering version 2 converged to confirmed v3 with one provider receipt. Each generated
the correct port-specific email link, and its reservation page returned HTTP 200.

The final Linux stress run used seed 2026, 100 reservations, and concurrency 8. It processed 360
unique events across 1,075 deliveries, identified 715 duplicates, and accepted exactly 80 expected
emails across 99 attempts. Conflicts, blocked events, and state mismatches were all zero.
Ingestion took 2,017 ms and the full run took 99,692 ms, including worker polling and retries.

The main demo was refreshed with the final production image while retaining its database. A final
browser update changed Taylor Reed from one guest at v2 to two guests at v3, with matching source
and local state. The original confirmation remained the only email and retained its one-guest
snapshot. This also verified the explicit submit button after the shared Button default changed.

## Reservation page and stress verification

The reservation detail page, confirmation link, and stress runner were added after the initial
implementation. Docker ESLint/file limits, TypeScript, 26 unit tests, and 19 PostgreSQL/worker
integration tests passed. The production build includes the dynamic `/reservations/[id]` route.

Browser checks exercised the actual email's View reservation link, the three status summaries,
URL-backed inspector tabs across reload, copy-link feedback, and the reservation-not-found page.
A 390 x 844 viewport had no page-level horizontal overflow. No warning/error logs were observed
during the successful detail-page walkthrough. New email content includes its absolute reservation
URL; previously persisted emails remain unchanged.

The default stress run passed with seed 42 and concurrency 8: 50 reservations, 180 unique events,
544 deliveries, 364 duplicates, 40 expected/accepted emails, and 50 provider attempts. There were
zero conflicts, blocked events, or final-state mismatches. Ingestion took 976 ms; the full run took
52,488 ms including the real worker's polling and retries. These are observations, not capacity claims.

## Platform verification

Windows PowerShell ran the documented Docker checks and stress commands. A fresh tracked-source
copy, without host node_modules or an environment file, started as `reservation-sync-windows` with
a new database on ports 3001/55433. Its reordered scenario reached confirmed v3, accepted one email,
and generated a working reservation link using port 3001 automatically. Health and detail-page
requests returned successfully.

Linux verification uses the official `docker:cli` Linux container and its shell/Compose client,
connected to Docker Desktop's Linux engine. It is not a separate native Linux host. The installed
Ubuntu WSL distribution lacks Docker Desktop integration, so its direct `docker` prerequisite was
unavailable; no user settings were changed to enable it.

The Linux shell completed `docker compose up --build -d`, `checks`, `integration`, and `stress`
from the clean copy under `reservation-sync-linux` on ports 3002/55434. All commands exited 0.
The repeated seed-42 stress run produced the same plan hash and counts, with no mismatches
(1,156 ms ingestion; 51,493 ms total). The CLI container is an external Docker client: its bind-mount
report directory belongs to the daemon host. Normal local Linux/Windows commands write the report
into the checkout as documented. These earlier runs preceded the final quality pass above.

## Time

The user confirmed work began in this chat. Its first request was at 15:12:22
America/Buenos_Aires on 2026-11-14. There is no additional pre-chat hour to count; an earlier note
incorrectly inferred one from the user's approximate remaining-time estimate.

Approximate elapsed-time breakdown, reconstructed from chat timestamps (includes discussion/waits):

| Local time  | Approx. | Work                                                                         |
| ----------- | ------: | ---------------------------------------------------------------------------- |
| 15:12-15:50 |  38 min | Brief, ordering/idempotency design, stack, lifecycle research, scope         |
| 15:50-16:21 |  31 min | Core implementation, Docker, tests, UI, independent review and fixes         |
| 16:21-16:59 |  38 min | Architecture discussion, DBeaver, State pattern, manual tests, freeze check  |
| 16:59-17:35 |  36 min | Detail page, stress runner, Tailwind/i18n, quality fixes, clean setup checks |
| 17:35-17:58 |  23 min | Webhook explanation, diagram review, final PDF audit, provider research      |
| 17:58-18:00 |   2 min | Single-editor assumption, time correction, commit and remote handoff         |
| 18:00-18:15 |  15 min | Source ZIP, table explanation, and domain-storage design discussion          |
| 18:15-18:23 |   8 min | Reservation-table migration, preservation checks, tests, review and handoff  |

Elapsed time at the commit request was about 2 hours 46 minutes. These are wall-clock phases,
not separately measured active coding time. Initial files were created at 15:52; the original
29 tests passed at 16:19. The initial accessibility fix was verified by 16:21. Later verification
expanded the suite to 56 tests. The earlier conservative 18:44 checkpoint was a planning estimate,
not the start time or a claim of work performed before this chat.

## Initial implementation checks (historical)

- Docker production build: passed with Next.js 16.4.6.
- Docker lint, physical file limits, TypeScript, unit tests: passed (10 tests).
- PostgreSQL/pg-boss integration suite: passed (19 tests, including all 24 delivery permutations).
- Initial checks: `docker compose --profile tools run --rm checks` (exit 0).
- Initial integration: `docker compose --profile tools run --rm integration` (exit 0, 35.48 seconds).
- HTTP tests cover invalid input, body limits, origins, conflict responses, and reservation IDs.
- Real worker tests cover lost acknowledgements, retry exhaustion, and manual recovery.
- Production dependency audit: zero reported advisories at the time of inspection.
- Development dependency audit: 11 moderate reports in Drizzle Kit/esbuild and ESLint/minimatch
  dependency trees. No production dependency advisories. No development server is exposed.
- Browser: reordered events converged to confirmed v3 with 3 guests and one email.
- Browser: a missing v2 left the local view at pending v1; delivering it applied v2/v3 and one email.
- Browser: duplicate deliveries produced no additional email; source/local comparison matched.
- Browser: manual creation sent no email; confirmation with an injected failure recovered on retry.
- Browser: lost acknowledgement produced response-lost/deduplicated attempts and one provider receipt.
- Browser: JSON export downloaded and parsed successfully; no console warnings/errors were observed.
- Mobile: 390 x 844 viewport had no page-level horizontal overflow; inspector tabs remained usable.
- Production web/database health checks passed; the separate worker remained running.

## Reproducibility and persistence

A clean copy of tracked source, without node_modules or an environment file, was built and started
under the separate Compose project `reservation-sync-clean` on port 3001 with a fresh database.
Migrations and the worker started successfully. The reordered scenario converged and delivered once.

Restarting its database, web, and worker preserved reservation state, the provider receipt timestamp,
and attempt count. A second confirmation queued while the worker was stopped survived a database/web
restart, then delivered once when the worker resumed. The temporary project and its volume were removed.
The main demo remains running on port 3000 with its data intact.

The clean-copy walkthrough preceded the four small review fixes below. The final production image
was rebuilt afterward, and lint, types, unit tests, integration tests, and a browser check were repeated.

## Independent review

The authenticated CodeRabbit CLI completed an independent review of 73 files using the user's
explicit authorization. It reported four minor findings; each was confirmed and fixed:

- Exclude `.env.*` variants from the Git index and Docker build context.
- Avoid reporting synchronization when the source snapshot is unavailable.
- Stop a partially initialized pg-boss instance when startup fails, preserving the original error.
  Three unit tests cover initialization failure, cleanup failure, and subsequent recovery.

The two environment-file findings are grouped above. A second complete review covered 75 files and
reported one additional minor accessibility issue: inspector tabs lacked arrow-key navigation.
The tabs now support Left/Right with wrapping, Home/End, and a single tab stop for the selected tab.
This small UI fix was checked with lint/types and keyboard interaction in the browser.

## Test-run notes and boundaries

The retry-exhaustion integration test initially used a timeout shorter than pg-boss's randomized
backoff could require. Its observation window was increased to 45 seconds (test limit 60 seconds),
without changing production retry behavior. A later verification run was interrupted by test-database
cleanup; it was discarded and rerun. The final 19-test run completed successfully.

The provider is simulated and implements the documented durable idempotency contract. These checks
do not demonstrate exactly-once delivery through an arbitrary third-party provider. Production use
also requires authentication, a real source adapter, and operational monitoring.

## Follow-up: DBeaver and State pattern

At the user's request, PostgreSQL now publishes `127.0.0.1:55432` for local database clients.
DBeaver saved the `reservation_sync` connection and its test returned Connected (103 ms), using
PostgreSQL 17.11. The application and worker continue using the internal Docker database address.

The lifecycle conditional chain was replaced with typed state handlers for awaiting creation,
pending, confirmed, and cancelled. Sequence and reservation-ID guards remain at the dispatcher.
Ten additional tests cover pre-creation events, recreation, all terminal-state event types,
updates after confirmation, cancellation before confirmation, and input immutability.

The expanded suite passed: 20 unit tests and 19 database/worker integration tests. ESLint, file
limits, TypeScript, and the production Docker build passed. The rebuilt web and worker are running.
A reordered scenario sent through the rebuilt app reached confirmed v3 with 3 guests, one accepted
provider receipt, and one email attempt. The fresh CodeRabbit review subsequently completed with
zero issues reported.

## Reported desktop freeze during missing-event scenario

The user reported Codex becoming unresponsive after running Missing event. Read-only inspection of
the exact reservation confirmed pending v1, v1 applied, v3 buffered, no v2 delivery, and no email.
The web/database services remained healthy, the worker remained running, and recent service logs
showed no errors. The recovered page displayed the expected gap; its current browser error/warning
log was empty. This does not recover pre-crash browser logs or establish the desktop freeze's cause.
