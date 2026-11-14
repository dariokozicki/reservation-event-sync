# Reservation Event Sync

A local reservation-sync service and simulator. Send duplicated or reordered events, compare the
source with the local view, and inspect confirmation delivery through an idempotent email provider.

## Run

Prerequisite: Docker Engine with Compose v2+ (or Docker Desktop), with Linux containers enabled.
Ports 3000 and 55432 must be available. No local Node, PostgreSQL, API keys, or account setup is required.
Run the commands below from the repository root in Windows PowerShell or a Linux shell.

```sh
docker compose up --build -d
```

Open http://localhost:3000. Compose starts PostgreSQL, runs tracked migrations and queue setup,
then starts Next.js and the separate pg-boss worker. Fonts are bundled; the running app does not
require external services. The first image build needs access to npm and Docker Hub.

```sh
docker compose logs -f web worker
docker compose down
```

Database state persists in the named `postgres_data` volume. `docker compose down` preserves it.
To deliberately erase all demo data, use `docker compose down -v`.

For DBeaver, create a PostgreSQL connection to `127.0.0.1:55432`, database `reservation_sync`,
username `reservation`, password `reservation`. The database port binds to localhost only and can
be overridden with `DB_PORT`. Application tables are in `public`; queue tables are in `pgboss`.
Exact Windows/Linux commands and optional configuration: [setup guide](docs/setup.md).

## Two-minute walkthrough

1. Run **Out of order**. The delivery log shows versions 3 and 2 buffered, then 1 applying all three.
   The reservation ends confirmed with 3 guests. **Source & local state** shows a match.
2. Click **Resend version 3**. It is recorded as a duplicate; no second email is scheduled.
3. Run **Missing event**. Local state remains pending at v1 and no email exists. Click
   **Deliver version 2**. Both v2 and v3 apply and one confirmation is scheduled.
4. Run **Lost email response**, then open **Confirmation email**. The provider accepts one email,
   loses the acknowledgement, and returns the existing receipt on retry. There are two attempts
   and one accepted email. Allow several seconds for the retry.
5. Run **Cancellation arrives first**. The final state is cancelled, with one email for its earlier
   confirmation. **Cancelled before confirmation** ends cancelled with zero emails.

For manual interaction, use **Create reservation**, set the provider failure mode before confirming,
then confirm, update, or cancel. To demonstrate exhaustion, choose **Provider unavailable**, confirm,
wait for four attempts, switch to normal delivery, and click **Retry failed email**.
Use **Export result** to download the selected reservation's state, history, and delivery evidence.

Click **Open reservation page** for `/reservations/<id>`. It has separate reservation, synchronization,
and email statuses. Inspector tabs persist in the URL; **Copy link** preserves the current tab.
New confirmation emails include an absolute **View reservation** link to the same page.
`APP_BASE_URL` can override the public origin; the default follows `APP_PORT` on localhost.
Existing emails keep their frozen contents, including their original link or absence of a link.

## Verify in Docker

```sh
docker compose run --build --rm checks
docker compose run --build --rm integration
```

`checks` runs formatting, ESLint, physical file limits, TypeScript, and unit tests. `integration` uses a separate
ephemeral PostgreSQL database (`reservation_test`), runs migrations, and exercises real transactions
and pg-boss jobs. It never resets the demo database. Integration tests cover:

- All 24 permutations of a four-event history.
- Concurrent repeated deliveries, conflicting event identities, gaps, and terminal cancellation.
- Rollback after enqueueing but before confirmation persistence.
- Frozen confirmation details after later changes.
- Concurrent provider deduplication, failures before acceptance, and lost acknowledgements.
- Actual worker retries, exhaustion, and manual recovery.
- HTTP validation, body-size limits, duplicate/conflict responses, and origin checks.

## Repeatable stress scenario

```sh
docker compose run --build --rm stress
```

The default run creates 50 reservations in a separate `reservation_stress` database, shuffles their
events with seed 42, injects 2–4 deliveries per event, and ingests them with concurrency 8. A real
pg-boss worker handles simulated transient failures and lost acknowledgements. Ten reservations
cancel before confirmation; the other 40 must each produce exactly one accepted email.

The report compares complete final states, inbox entries, frozen email details, and provider
acceptances. It prints JSON and writes `artifacts/stress/stress-last.json`; a mismatch exits nonzero.
The same seed reproduces the input delivery plan, not the operating system's concurrent scheduling.
Every run uses fresh IDs and leaves the demo database untouched. See [stress design](docs/stress.md).

```sh
docker compose run --rm -e STRESS_SEED=2026 -e STRESS_RESERVATIONS=100 stress
docker compose --profile tools stop test-db stress-db
```

## Architecture

```text
Simulated PMS (source_events + source snapshot)
    │ deliveries, including duplicates and arbitrary order
    ▼
Next.js API → Zod → PostgreSQL inbox
    │ per-reservation transaction lock; drain consecutive versions
    ├─ reservations table (typed domain columns)
    └─ first confirmation marker + pg-boss job (same transaction)
                                  │
                           separate Node worker
                                  │ stable key + frozen payload
                                  ▼
                     simulated provider receipt ledger
```

The inbox retains unique events; the delivery log retains repeated attempts. A transaction-scoped
advisory lock serializes each reservation, including when creation has not arrived yet. Unrelated
reservations can proceed independently. Database uniqueness protects event IDs and reservation/version.

`reservations` stores the local domain model in typed columns: status, version, guest details, stay
dates, guest count, and cancellation reason. PostgreSQL checks enforce status, positive version,
guest-count limits, and checkout after check-in. `streams` only tracks identities and simulator
metadata, including the simulated source JSON. It can exist before the creation event arrives;
the domain reservation row is inserted only when creation is applied. The API still calls the
assembled domain object `local` for source/local comparison; it is not a JSON database column.

Migration `0001_normalize_reservations` backfills existing `streams.local` values into the domain
table before removing that column. Stop old web/worker processes before applying this upgrade;
the initial migration is retained so a fresh checkout follows the same migration history.

pg-boss is the transactional outbox and retry mechanism. A permanent confirmation marker prevents
reenqueueing after queue history expires. Queue job retention is not business idempotency.
The provider's durable unique key prevents repeat delivery after a worker crash or lost response.
This is an explicit simulated-provider contract, not a claim that arbitrary real email APIs can
guarantee exactly-once delivery. Eventual delivery also requires recovery and retry of permanent failures.

## Lifecycle and assumptions

Creation produces `pending`; confirmation is separate and changes it to `confirmed`. Pending or
confirmed reservations may become `cancelled`. Updates alter details only. Cancellation is terminal.
Only the first confirmation sends an email, using the details at that version. A later cancellation
does not suppress it. A reservation never confirmed gets no email.

Versions are consecutive per reservation, beginning at 1. Timestamps do not decide ordering.
Gaps are visible and never skipped; the source eventually delivers all versions. Invalid lifecycle
events block that reservation and remain inspectable. Identical duplicate events are acknowledged;
changed content under the same ID or version is a conflict.

Editing assumes one owning user and one active editing session per reservation. Stale forms from
multiple tabs/devices can overwrite newer fields; source version ordering does not detect stale
editing intent. Production would first add expected-version checks and conflict handling. CRDT/OT
merging is a possible extension for collaborative editing, not part of this demo.

Full assumptions, acceptance criteria, industry research, and alternatives: [decision note](docs/decisions.md).
Verification evidence and actual time: [validation record](docs/validation.md).
Container/process boundaries: [architecture diagram](docs/architecture.md).

## API

| Method | Path                            | Purpose                                          |
| ------ | ------------------------------- | ------------------------------------------------ |
| GET    | `/api/health`                   | Database readiness                               |
| GET    | `/api/reservations`             | Latest 100 streams and aggregate totals          |
| GET    | `/api/reservations/:id`         | Source/local state, inbox, attempts, and receipt |
| POST   | `/api/events`                   | Accept a validated source event                  |
| POST   | `/api/simulations`              | Create and deliver a scenario                    |
| POST   | `/api/reservations/:id/actions` | Append, deliver/replay, set faults, retry email  |

Schemas in `src/domain/schemas.ts` are the contract. Domain types are inferred in `src/types/`.
`/api/events` returns 200 for applied, buffered, or duplicate events, 409 for identity conflicts,
422 for invalid transitions, and 400 for schema errors. Accepted invalid transitions are retained.

## Development and boundaries

- Next.js, TypeScript, Node 24, Drizzle, PostgreSQL 17, pg-boss, Zod, Tailwind, TanStack Query.
- Tailwind utilities style every component; the global stylesheet contains only imports/theme tokens.
  Shared controls and the header keep repeated markup small. Prettier sorts Tailwind classes.
- `next-intl` provides typed English catalogs, pluralization, and date/number formatting. UI and email
  copy are extracted; stored payloads and diagnostics remain verbatim. English is the only shipped
  locale. See [UI structure and localization](docs/code-quality.md).
- Authored code/config files have at most 300 physical lines and 100 characters per line.
  ESLint also rejects multiple statements per line. Generated lockfiles and schema snapshots are exempt.
- `npm run db:generate` produces Drizzle migrations; tracked SQL is applied by the migration service.
- To use host tooling optionally: `npm ci`. All required commands remain available in Docker.
- This is a localhost-only demo. Database and UI ports bind to loopback.
  No authentication, real PMS/email integration, payment processing, or inventory management is included.
- Reservation URLs are public in this demo. Production must authenticate the visitor and authorize
  access to the specific reservation, including its APIs. An ID or forwarded email is not permission.
- Event and email histories are retained without pruning for the demonstration. The UI displays the
  latest 100 reservations and up to 200 delivery/attempt entries per selected reservation.
- Invalid transitions require source correction/operator investigation; no destructive skip button exists.
- Visual styling references Pentice's public site. The UI is an engineering demonstration, not its booking site.
- AI assisted research, implementation, tests, and documentation. The developer owns the final submission.
