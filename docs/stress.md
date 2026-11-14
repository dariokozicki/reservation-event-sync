# Repeatable stress scenario

Run `docker compose run --build --rm stress` from PowerShell or a Linux shell.

## Workload

- Default seed 42, 50 reservations, concurrency 8.
- Bounds: 1–200 reservations, 1–32 concurrent ingestion calls, unsigned 32-bit seed.
- Every unique event is delivered 2–4 times; the full delivery list is shuffled.
- Every fifth reservation cancels before confirmation and must produce no email.
- The others confirm, then either cancel or update their guest count again.
- Selected reservations fail before provider acceptance or lose the acknowledgement afterward.
- Real PostgreSQL transactions and pg-boss retries are used. Source and email remain simulated.

## Reproducibility

The seed fixes duplicate counts and input ordering. `planHash` fingerprints reservation-index/version
pairs, so it stays identical across repeated runs with the same parameters. IDs are fresh per run to
avoid collisions. Operating-system scheduling, transaction lock acquisition, retry jitter, and elapsed
time are not deterministic. This is an invariant test, not a production throughput benchmark.

Expected final reservation snapshots are constructed independently of `applyEvent`. The checker
compares all fields, verifies every source event is applied once, and checks email/no-email outcomes,
recipient, stable key, frozen guest count, and exactly one provider acceptance per confirmed case.
The duplicate count must equal total deliveries minus unique events. Conflicts or blocked events fail.

## Output

`artifacts/stress/stress-last.json` contains options, plan hash, counts, timings, and mismatches.
The process exits 0 only when all invariants pass. Startup errors also exit nonzero and print the error;
a report file from an earlier run is not evidence for that failed run. Each successful run overwrites
the report. Email completion allows at least 120 seconds, increasing with larger workloads to
accommodate the worker's one-job polling cadence and retries. Pending or exhausted jobs fail checks.

The runner connects only to `reservation_stress`, whose Compose service has an ephemeral filesystem.
It creates fresh records and does not truncate any database. Stop it after testing:

```sh
docker compose --profile tools stop stress-db
```

The workload invokes the same ingestion service used by the HTTP endpoint. HTTP contracts are
covered by the integration suite; this runner does not measure HTTP/network performance.
