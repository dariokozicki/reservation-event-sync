# Windows and Linux setup

## Prerequisites

- Windows: Docker Desktop running with Linux containers; use PowerShell in the repository root.
- Linux: Docker Engine running, Docker Compose v2+ installed, and permission to access the daemon.
- WSL: Docker Desktop's integration must already be enabled for that distribution to use `docker`.
- Ports 3000 and 55432 available; internet for the first npm/image download.
- No host Node, npm, PostgreSQL, Bash scripts, chmod, API keys, or `.env` file required.

## Same commands in PowerShell and Linux

```sh
docker version
docker compose version
docker compose up --build -d
docker compose ps
```

Open http://localhost:3000 after `web` is healthy. The migration service exits successfully once;
that is expected. The worker logs `Confirmation worker ready.`

```sh
docker compose logs --tail 50 web worker
docker compose run --build --rm checks
docker compose run --build --rm integration
docker compose run --build --rm stress
docker compose --profile tools stop test-db stress-db
```

Stress prints JSON and writes `artifacts/stress/stress-last.json`. Integration and stress use separate,
ephemeral databases. They neither truncate nor reuse the demo database. The stress runner rejects
any `DATABASE_URL` whose database name is not `reservation_stress`.

To repeat the same stress plan, run the same command again. To vary it (identical shell syntax):

```sh
docker compose run --rm -e STRESS_SEED=2026 -e STRESS_RESERVATIONS=100 stress
```

## Optional configuration

For a fresh checkout, copy `.env.example` to `.env` only if you need overrides.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux:

```sh
cp .env.example .env
```

Edit `.env` in a text editor:

```dotenv
APP_PORT=3001
DB_PORT=55433
```

Then run `docker compose up --build -d` again and open http://localhost:3001.
New email links automatically use that application port. To supply a different public origin, add
`APP_BASE_URL=https://reservations.example.test`. A valid http/https URL is required. Existing email
payloads stay unchanged. Both published ports remain bound to 127.0.0.1.

Docker services use `db:5432` internally, regardless of `DB_PORT`. The example `DATABASE_URL` is for
optional host tooling; update its port if using that tooling with a custom database port.

## Stop and data persistence

When upgrading an existing demo from the original JSONB schema, stop its old application processes
before applying the new migration. Existing reservations, email payloads, and receipts are preserved:

```sh
docker compose stop web worker
docker compose up --build -d
```

Migration `0001_normalize_reservations` backfills the typed `reservations` table before removing
`streams.local`. Do not use `down -v` for an upgrade. The migration is not rolling-deployment safe.

```sh
docker compose down
```

This preserves demo reservations and email receipts in the named PostgreSQL volume. Start again
with `docker compose up -d`. Only use `docker compose down -v` when deliberately erasing demo data.

See [validation](validation.md) for exactly which Windows/Linux environments were exercised.
