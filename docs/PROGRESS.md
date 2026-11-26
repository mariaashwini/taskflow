# TaskFlow progress

Where the work stands, for the next session. Update it at the end of each session or sub-step.
Decisions live in `CLAUDE.md` ("Implementation decisions (M0)"). This file records status and next steps.

_Last updated: 26 November 2026_

## Current position

- **Milestone:** M0, Project Initialization. Branch `m0-foundation`.
- **Step:** 4 of 7, Backend.
- **Sub-step:** Logging done and verified, **not committed yet**. Next: ESLint with the TypeORM import rule.
- **Git:** `m0-foundation` pushed to GitHub (`origin`) up to `6a08d1f` on 26 November 2026, tracking `origin/m0-foundation`.
  No pull request and no CI workflow yet; the pull request is opened in step 7 (Review), once CI exists and is green.

## Step 4 (Backend): status

| Sub-step | Status |
| --- | --- |
| NestJS generator and cleanup (decisions G, H) | Done |
| Configuration validation | Done, verified |
| Database module and migration scripts | Done, verified (migration scripts not run) |
| `app.setup.ts`: request ID, helmet, `Cache-Control`, `/api` prefix | Done, verified |
| Health check `GET /api/health` | Done, verified |
| Global exception filter | Done, verified |
| Global validation pipe | Done, verified |
| Logging: `redact()` and interceptor | Done, verified |
| ESLint with the TypeORM import rule; `lint` and `typecheck` scripts | **Next** |
| Test setup and health e2e test (`taskflow_test`, `.env.test`) | To do |

### What has been verified

- **Configuration:** with no `.env`, the backend refuses to start and names all nine variables. Exit code 1; no values are printed. With a valid `.env`, it starts.
- **Database:** connects to the local MariaDB 11.4 on port 3307. Nothing in the database has been changed; no tables, no migrations.
- **Health:**
  - `200 {"status":"ok","database":"up"}`.
  - With MariaDB stopped: `503 {"status":"error","database":"down"}`, answered within 0.02 s.
  - After MariaDB restarts, it's up again without restarting the backend.
- **Headers on every response, errors included:**
  - `Content-Security-Policy` with `frame-ancestors 'none'`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Cache-Control: no-store`
  - No `Strict-Transport-Security` locally, and no `X-Powered-By`.
- **Unknown routes:**
  - Inside and outside `/api`, they return `404 {"error":{"code":"NOT_FOUND","message":"Not found.","requestId":"…"}}`.
  - No stack trace, path or query string appears in the response or the log.
  - Each response has its own request ID.
- **Validation pipe:** tested with a throwaway script, because no endpoint accepts input yet.
  - Unknown fields are rejected.
  - Each field gets one entry; nested fields are written as `address.city`.
  - Submitted values are never echoed.
  - The filter answers `400 VALIDATION_FAILED` with `fields` and the request ID.
- **Logging:**
  - `redact()` (throwaway script): all ten keys in any letter case and at any depth, arrays, a circular object (`[Circular]`), a shared object, the original unchanged.
  - `/api/health?token=abc123` gives one request line with `route: '/api/health'`, status, duration and request ID; `abc123` is nowhere in the log.
  - Unknown routes get no request line (the accepted limitation below).
  - `LOG_LEVEL=warn`: no request lines. `NODE_ENV=production`: one JSON object per line, the request fields as real JSON fields.
  - Invalid config (`LOG_LEVEL=bogus`) still fails at start-up and names the variable, without its value (`bufferLogs` hides nothing).

### Not yet tested

- The 500 `INTERNAL_ERROR` path and database-error logging. No route can cause them yet; they're planned for the e2e test step.
- Whether TypeORM's command-line program loads the ES-module `dist/database/data-source.js`. The first real test is in M1, because every migration command touches the database (even `migration:show` creates the `migrations` table).

## Logging sub-step: agreed design

**Answers already given:**

1. **Log format:** readable text in development; one JSON object per line in production, using NestJS's built-in `ConsoleLogger` `json` option.
2. **TypeORM logging:** change to `['warn', 'migration']` in `src/database/data-source-options.ts`. With `'error'`, TypeORM prints failed SQL with its parameter values, bypassing `redact()`. Failed queries still reach the filter, which logs only the driver code.

**Changes, in order** (explain each in 2–4 lines before making it):

1. `src/common/logging/redact.ts` (new):
   - Replaces the values of the architecture's ten keys with `[REDACTED]`, at any depth and in any letter case. The keys are `password`, `newPassword`, `token`, `csrfToken`, `tokenHash`, `passwordHash`, `authorization`, `cookie`, `set-cookie` and `x-csrf-token`.
   - Safe with circular objects; returns a copy.
2. `src/common/interceptors/logging.interceptor.ts` (new):
   - Writes one entry per request when the response **finishes**, so the status is final.
   - The entry holds the method, route pattern (`req.route.path`), status, duration and request ID.
   - Never the raw URL, query string, body or headers. Passed through `redact()`.
3. `src/common/filters/all-exceptions.filter.ts`: its log calls become structured entries through `redact()`.
4. `src/app.setup.ts`: `app.useLogger(new ConsoleLogger({ logLevels, json }))`. The levels come from `LOG_LEVEL`; `json` is on only in production.
5. `src/main.ts`: `NestFactory.create(AppModule, { bufferLogs: true })`, so start-up lines use that logger.
6. `src/app.module.ts`: register the interceptor with `APP_INTERCEPTOR`.
7. `src/database/data-source-options.ts`: `logging: ['warn', 'migration']`.

**How to check:**
- Start the app and call `/api/health?token=abc123` and an unknown route with `curl.exe`.
- Expect one request line for the health call, with the route pattern and no query.
- Expect `abc123` nowhere in the log.
- Start it again with `LOG_LEVEL=warn` and confirm the request lines disappear.
- Test `redact()` with a throwaway scratchpad script.

## Notes for the step 4 review

- **The interceptor's limitation (accepted, following the architecture):** NestJS runs interceptors only for requests that reach a route. Unknown routes (404s from the filter or the non-`/api` catch-all) get no request line. From M2, neither will requests stopped by guards (401, 403). Server errors are still logged by the filter. The alternative, a logging middleware, sees every request but departs from the documented design.
- **Request ID fallback:** if a request ever lacked an ID, the non-`/api` catch-all would use `'unknown'`, while the filter creates a fresh random ID. It can't happen in practice, because the request-ID middleware runs first.
- **UTC log timestamps (`src/common/logging/app-logger.ts`, approved 26 November 2026):** NestJS's `ConsoleLogger` creates its date formatter when imported, before `main.ts` sets `TZ=UTC`, so text-mode logs showed local time. `AppLogger` extends `ConsoleLogger` and only overrides `getTimestamp()` to return ISO 8601 UTC (`2026-11-26T15:06:12.162Z`). Verified. Production JSON timestamps (numbers) are unchanged.
- **Field messages:** validation messages are class-validator's built-in English texts until M2 adds our own in `@taskflow/shared` (`messages.ts`).
- **Slow first start:** the backend can take about 25 seconds to start the first time after a pause, probably because Windows scans `node_modules`. It isn't a bug. One earlier check run also wrote no app log, and the cause is unknown; it hasn't happened again.

## Working notes for this machine

- Before working: run `nvm use 26.13.1` (as Administrator) and confirm `node --version` prints v26.13.1. **WampServer must be running** for MariaDB on port 3307.
- For a "database down" check: WampServer icon → **MariaDB → Service administration → Stop Service**, then **Start/Resume Service**. Only MariaDB; data is not affected.
- `taskflow-backend/.env` exists (ignored by Git). `.env.test` doesn't exist yet; it's needed for the e2e test step.

## After step 4

Step 5, Frontend → step 6, CI → step 7, Review (pull request, then walk through every file).
