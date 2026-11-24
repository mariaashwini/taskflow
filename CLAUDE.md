# TaskFlow: brief for Claude Code

TaskFlow is a personal task manager: register and verify email, log in, create and organise tasks, a Trash with 30-day recovery, and a dashboard. Requirements and architecture are **approved and signed off (18 November 2026)**. We are starting **milestone M0, Project Initialization**.

## Source documents (read before changing anything)

| File                                  | What it is                                                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/requirements-v1.md`             | Phase 1 requirements: FR-AUTH-1 to 7, FR-TASK-1 to 6, FR-ORG-1 to 6, FR-DASH-1, data rules (1.4), non-functional requirements (1.5), US-01 to US-14 |
| `docs/requirements-v2.md`             | Approved changes and additions: Trash, email verification, password reset, `tokenVersion`, NFR-SEC-*, US-15 to US-21                                |
| `docs/technical-architecture.md`      | Approved architecture, decisions D1 to D22, milestones M0 to M8                                                                                     |
| `docs/sign-off.md`                    | Sign-off report and decisions P1 to P4                                                                                                              |
| `docs/project-initialization-plan.md` | **The plan for M0**: structure, dependencies, scripts, env, Git, database, done criteria                                                            |
| `docs/PROJECT_DEVELOPMENT_GUIDE.md`   | My reusable handbook for building any project with Claude. Not TaskFlow-specific; not a source of TaskFlow requirements                             |

**Precedence:** v2 overrides v1 where they differ. The architecture's lead paragraph lists how P1 to P4 adjust it (folder names, Node 26, ES modules, Vitest instead of Jest).

## How we work (important)

- I am learning. **Work step by step and stop after each step** of the plan so I can review it. Explain the reasoning behind important technical decisions in plain, beginner-friendly language.
- **Follow the approved documents.** Do not add features, packages, files or rules they don't call for. Do not change an approved business rule.
- **If something in the plan doesn't work as written** (a tool behaves differently, a version conflicts), stop and explain the problem and options. Don't silently work around it.
- Prefer the official generators (NestJS CLI, Vite template), then remove their sample code.
- Never commit secrets or `.env` files. Never run destructive commands (deleting volumes, force-pushing, resetting Git history) without asking first.

## Approved stack

- **Node.js 26 LTS** (pinned in `.nvmrc` and `engines`), TypeScript strict mode everywhere, **ES modules** in all three projects.
- **Backend:** NestJS 12 (modular), TypeORM 1.x with `mysql2`, MariaDB **11.4 LTS**, class-validator, helmet.
- **Frontend:** React 19, Vite, Ant Design 6, Redux Toolkit with RTK Query, React Router, React Hook Form (from M2).
- **Tests:** **Vitest** 5 (no SWC plugin needed; see decision B below), React Testing Library, Supertest.
- **Tools:** MariaDB installed directly on my computer (no Docker), Mailpit from M2, Postman, Git and GitHub, GitHub Actions.

## Local database (overrides the plan's Docker setup)

I do **not** use Docker. MariaDB is installed directly on my computer and is already set up:

- Server settings: `default_time_zone = '+00:00'`, `character_set_server = utf8mb4`, `collation_server = utf8mb4_uca1400_ai_ci`.
- Databases `taskflow` (development) and `taskflow_test` (automated tests), both `utf8mb4` / `utf8mb4_uca1400_ai_ci`.
- User `taskflow`@`localhost` with full rights on those two databases only. Its password is only in my local `.env` files.
- Connect with `DB_HOST=127.0.0.1`, **`DB_PORT=3307`**, `DB_SSL=false`.

My machine specifics (Windows, PowerShell):

- Node.js is managed by **nvm-windows** (`D:\nvm`; the active version is linked at `D:\nodejs`). Node 26.13.1 is for TaskFlow; 22.14.0 is kept for another project. Run `nvm use 26.13.1` (as Administrator) before working on TaskFlow, then check that `node --version` prints v26.13.1.
- MariaDB **11.4.9** runs inside **WampServer** (`D:\wamp64\bin\mariadb\mariadb11.4.9`), on port **3307**, and only while WampServer is running. Port **3306 is WampServer's MySQL, not MariaDB**: never connect to it.
- A separate MariaDB **12.1.2** install exists at `D:\MariaDB`. Its server is not running and must not be used. Its client is first on my PATH, so `mariadb --version` reports 12.1.2; that's only the client. Check the server with `SELECT @@version;`.
- That client requires TLS by default and WampServer's MariaDB has no TLS, so manual connections need `--skip-ssl`: `mariadb -h 127.0.0.1 -P 3307 -u taskflow -p --skip-ssl`. The backend's `mysql2` driver doesn't need this.
- MariaDB is bound to `127.0.0.1` (local connections only).
- Project folder: `D:\AI_development\taskflow`.

So in M0: **do not create `docker-compose.yml`, the `docker/` folder, or the `db:up` / `db:down` scripts.** The README should list these database prerequisites instead. CI on GitHub still runs MariaDB 11.4 as a service container in the workflow; that runs on GitHub's servers and needs nothing on my computer. If tests need a fresh database, empty the tables in `taskflow_test`; never drop or alter `taskflow` without asking. Mailpit (M2) will be installed directly too; we'll decide how when we get there.

## Repository layout (P1)

```text
taskflow/                 one Git repository, npm workspaces
├── taskflow-backend/     NestJS API
├── taskflow-frontend/    React app
├── taskflow-shared/      plain TypeScript shared by both (@taskflow/shared)
├── docs/
└── .github/workflows/ci.yml
```

## Rules that hold from day one

- **Same origin:** the browser only talks to Vite in development; Vite proxies `/api` to NestJS on port 3000. CORS stays off.
- **Global prefix `/api`**, taken from `API_PREFIX` in `@taskflow/shared`.
- **TypeORM:** `synchronize: false` and `migrationsRun: false` always; `timezone: 'Z'`; `dateStrings: ['DATE']`; migrations only via reviewed migration files run from compiled `dist/`.
- **Only `*.repository.ts`, `*.entity.ts` and `src/database/**` may import `typeorm` or `@nestjs/typeorm`** (ESLint `no-restricted-imports`).
- **UTC everywhere:** MariaDB `default_time_zone = '+00:00'`; `TZ=UTC` in CI and production; locally, `main.ts` sets it first.
- **Configuration** is validated at start-up with class-validator through `@nestjs/config`'s custom `validate` function; code reads it through a typed `AppConfigService`, never `process.env`.
- **Errors** go through one global exception filter returning `{ error: { code, message, fields?, requestId } }`, never a stack trace.
- **Logs** never contain request bodies, query strings, cookies, auth headers, tokens or SQL parameter values; a `redact()` helper is the safety net.
- **Frontend secrets:** none. Only `VITE_` variables reach the browser, and we have none.
- Install packages **only in the milestone that first needs them** (see the plan's dependency tables).

## M0 scope (see `docs/project-initialization-plan.md`)

**In:** root workspace and tooling, connection to my locally installed MariaDB (databases already created), `taskflow-shared` skeleton, NestJS app with config validation, database connection, `GET /api/health` (checks the database), global filter, validation pipe, logging, helmet, Vite app with Ant Design, Redux store with an empty `baseApi`, router, `/api` proxy, one placeholder status page, test setup with one backend e2e test and one frontend component test, CI workflow.

**Out:** entities, tables, migrations (M1); authentication, cookies, CSRF, rate limiting, email (M2, M3); tasks, Trash, dashboard (M4 to M7); any feature page or form.

**Order:** root → check the local database connection → shared → backend → frontend → CI → review. Stop after each.

**Done-when adjustment:** instead of "`npm run db:up` starts MariaDB", check that the backend connects to my local MariaDB; for the "database down" check, stop the MariaDB service briefly.

**Done when** every item in the plan's "Done when" checklist passes.

## Implementation decisions (M0)

Approved 24 November 2026; where they differ from the plan, they win.

- **TypeScript `~6.0`** in all three projects (typescript-eslint 8 supports TypeScript below 6.1).
- **A. Linting:** ESLint with `typescript-eslint` and `eslint-config-prettier`, not the generator's Oxlint.
- **B. No SWC:** Vitest keeps decorator metadata without `unplugin-swc`/`@swc/core`. If a test shows dependency injection failing for lack of it, stop and propose adding SWC back.
- **C. Vitest 5.1.1** in both apps; `@vitest/coverage-v8` always on exactly the same version as Vitest.
- **D. Fully strict TypeScript:** `strictPropertyInitialization` stays on; class-validator classes mark properties with `!`.
- **E. Shared response types:** `ErrorResponse`, `HealthResponse` and the codes `VALIDATION_FAILED`, `NOT_FOUND`, `INTERNAL_ERROR` live in `@taskflow/shared`.
- **F. Backend `test` runs unit and e2e tests** (needs WampServer running and `.env.test`); `test:e2e` runs only e2e.
- **G. Generator packages removed:** `@nestjs/mau` and its `deploy` script, `oxlint`, `oxlint-tsgolint`, `@nestjs/schematics`, `source-map-support`, and the backend's own `prettier` and `vite`. `@vitest/coverage-v8` is kept for `test:cov`.
- **H. Generated files removed:** `AGENTS.md`, `README.md`, `.gitattributes`, `.prettierrc`, `.oxlintrc.json`, and the sample controller, service and tests.
- **`src/app.setup.ts`** applies helmet and the `/api` prefix, for both `main.ts` and the e2e test.
- **Request IDs** come from `src/common/logging/request-id.middleware.ts`, so unknown routes get one too.
- **`data-source.ts`** loads `.env` with Node's built-in `process.loadEnvFile()` and checks it with the app's `validate` function.
- **Migrations:** `npm run migration:generate -- src/database/migrations/<Name>`; no migration command runs against `taskflow` in M0.

## Keeping the handbook current

`docs/PROJECT_DEVELOPMENT_GUIDE.md` is a reusable handbook for **future projects**, using TaskFlow only as brief examples. When we learn something about working with Claude Code or a development practice that would help in **any** project:

- Propose a short addition or change to the handbook, and make it only after I approve.
- Add only lessons useful beyond TaskFlow. Don't record TaskFlow implementation details, and don't copy the requirements or architecture.
- Keep it to about 5–7 pages: merge or replace outdated content instead of growing it.
- Never change the handbook as a side effect of other work.

## Conventions

- Branch: `m0-foundation` (one branch per milestone); `main` only through pull requests with CI green.
- Commits: `type: summary (IDs)`, e.g. `chore: set up NestJS backend (M0)`, later `feat: move task to Trash (FR-TASK-4)`. Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`.
- Commit `package-lock.json` and `.env.example` files; never `.env`, `node_modules`, `dist` or `coverage`.
