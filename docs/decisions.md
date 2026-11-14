# Reservation Event Sync

## Scope and time

- The user reported three hours remaining at 2026-11-14 15:44 America/Buenos_Aires.
- Conservative planning checkpoint: 18:44 local time, based on that remaining-time estimate.
- The user later confirmed this chat was the start: 15:12 local time. See the validation time record.
- The user later reported two hours remaining; the selected extras are detail pages and stress testing.
- Stack: TypeScript, Node, Next.js, Tailwind, TanStack Query, Zod, Drizzle, PostgreSQL, pg-boss.
- All services and checks run in Docker. Local-only, synthetic data and email delivery.

## Assumptions

1. Creation and confirmation are separate events. Creation produces a pending reservation.
2. Confirmation changes pending to confirmed and schedules exactly one confirmation email.
3. Pending or confirmed reservations can be cancelled. Cancellation is terminal.
4. Updates change guest/stay details, never status. Updates after cancellation are invalid.
5. Source versions start at 1 and are consecutive per reservation; timestamps are informational.
6. Every event eventually arrives. Gaps remain visible until the missing event is delivered.
7. Each event ID is immutable; reservation/version also identifies one immutable event.
8. Duplicate identical deliveries are safe. Conflicting reuse is reported, never overwritten.
9. An invalid transition blocks that reservation's sequence, without blocking other reservations.
10. Email content is frozen at first confirmation, including all preceding detail updates.
11. Confirmation followed by cancellation still sends one email regardless of delivery order.
12. Creation followed directly by cancellation sends no email.
13. The simulated provider deduplicates concurrent/repeated calls by key and identical payload.
14. Provider keys remain valid for the full retry/replay lifetime. Provider receipts are durable.
15. Delivery is eventual only if failures recover and exhausted jobs are retried.
16. No authentication: this is a localhost demo, not a publicly deployable service.
17. Production reservation links require sign-in and authorization for the specific reservation.
    Possession of a URL/UUID or a forwarded email alone would not grant access to its page or APIs.
18. New confirmation links use the configured public base URL and are frozen with the email payload.
19. Stress runs use an isolated database. A seed reproduces the input plan; concurrency timing varies.
20. English is the initial locale. UI and email copy use next-intl catalogs; audit evidence remains
    verbatim. Delivery timestamps use explicitly labeled UTC. No language selector is included.
21. Reservation edits assume one owning user with one active editing session per reservation.
    This is a workflow assumption, not enforced authentication or stale-write protection. Multiple
    tabs/devices for the same user can still overwrite fields from an older form snapshot.

## Concurrent editing boundary

Event delivery concurrency and concurrent user edits are separate concerns. The source simulator
assigns consecutive versions under a reservation lock, and ingestion applies that order safely.
However, the update form submits all editable fields and does not include an expected base version.
A stale form can therefore overwrite newer field values even though every event is applied correctly.

For multiple editors, the first extension would be optimistic concurrency: submit the version the
editor read, compare it inside the source transaction, and reject stale updates for refresh/review.
Sending only changed fields reduces accidental overwrites but does not resolve same-field conflicts.
CRDTs or operational transformation (OT) are alternatives if collaborative editing is required;
they need explicit merge semantics and must preserve cross-field rules such as checkout after check-in.
Neither collaborative merging nor optimistic version checks are implemented in this demo.

## Approach

Persist events in an inbox, serialize processing per reservation, and drain consecutive versions.
Apply state, the permanent confirmation marker, and the pg-boss job in one PostgreSQL transaction.
The email worker retries with the same provider key and frozen payload. Provider acceptance is
recorded separately from worker acknowledgement, allowing the ambiguous-success failure demo.
Queue retention is not used as a permanent business deduplication mechanism.

Local reservation state uses a relational `reservations` table, with database constraints on status,
version, guest count, and dates. The earlier JSONB local-state column is migrated into those typed
columns. `streams` remains the pre-creation tracking identity and simulator metadata. This separates
the domain model from received event history while keeping out-of-order arrivals inspectable.

Reservation lifecycle behavior uses the State pattern: awaiting creation, pending, confirmed,
and cancelled handlers implement one typed interface. Shared update/cancellation behavior lives in
the existing-reservation base state. The event dispatcher checks sequence and identity once, then
delegates to the current state. Handlers return new snapshots without mutating the input.

An event is distinct from a status. Our reduced lifecycle is pending -> confirmed -> cancelled,
with pending -> cancelled also allowed. Inquiry, holds, payments, check-in/out and inventory are
outside this slice. Consecutive versions are a simulator contract, not a universal PMS guarantee.

## Acceptance matrix

| ID  | Source     | Expected behavior                        | Proof                                                |
| --- | ---------- | ---------------------------------------- | ---------------------------------------------------- |
| R1  | Brief      | Correct local reservation view           | Permutations converge to expected state              |
| R2  | Brief      | Duplicates and reordering are safe       | Duplicate/concurrent/gap tests                       |
| R3  | Brief      | One email per confirmed reservation      | Worker retry + provider receipt assertions           |
| R4  | User       | Separate creation and confirmation       | Creation has no email; confirmation has one          |
| R5  | User       | Docker-only setup                        | Compose build/start and containerized checks         |
| R6  | User       | UI simulates and shows outcomes          | Browser walkthrough of scenarios                     |
| R7  | User       | File/line limits, type files, ESLint     | Lint and physical file-length checks                 |
| R8  | User       | Direct reservation pages and email links | Link, refresh, tab and error walkthrough             |
| R9  | User       | Repeatable concurrent stress scenario    | Seeded report against isolated PostgreSQL            |
| R10 | User       | Windows/Linux setup commands             | Shell walkthroughs and explicit environment limits   |
| R11 | User       | Tailwind utilities and extracted UI copy | CSS inspection, typed catalogs, lint, browser checks |
| A1  | Assumption | Missing versions block visibly           | Gap repair scenario                                  |
| A2  | Assumption | Provider supports idempotency            | Accept-then-timeout retry scenario                   |

## Research

- https://help.guesty.com/hc/en-gb/articles/9369679396253-Reservation-statuses-Overview
- https://docs.mews.com/connector-api/operations/reservations
- https://developers.cloudbeds.com/docs/guest-communication-reputation-management
- https://open-api-docs.guesty.com/docs/webhooks
- https://pgboss.io/api/adapters
- https://pgboss.io/api/queues

Real PMS integrations may provide snapshots or notification-only webhooks and need authoritative
state retrieval. Replacing our source requires revisiting sequence and reconciliation assumptions.

## Selected extras and boundaries

The reservation page reuses the inspector/API and exposes a stable URL, rather than duplicating
transition logic. The browser shares one TanStack Query client across routes. The worker remains
separate from Next.js. The stress runner exercises the actual synchronization service and worker;
it does not simulate HTTP load or claim production capacity. Expected final snapshots are constructed
independently of the state reducer. Queue operations and database isolation are unchanged.

The brief explicitly requires simulated source and email services. No real email integration is
included. Its idempotency contract, failure modes, and receipt ledger provide the required evidence
without provider accounts, credentials, or external side effects.

The quality pass replaces custom component CSS with Tailwind utilities and uses next-intl for
interface/email copy. Shared controls, explicit button types, guarded scenario selection, and
structured fetch failures keep the UI code consistent. Details: [code quality](code-quality.md).

## AI assistance

Codex assisted with research, architecture, implementation, tests and documentation.
The developer owns the assumptions and final submission. Review and validation results are recorded
separately; no checks are considered passed before execution.
