# Project Initialization Plan

This plan sets up a clean, working foundation for TaskFlow: milestone M0 from the architecture, plus the database connection. It builds no business features. Nothing is created until you approve it.

## Decisions needed before creating the projects

### P1 Repository layout

You asked for two projects, `taskflow-backend` and `taskflow-frontend`. The approved architecture also needs a place for shared code: limits, enums, validators and response types used by both sides (D7, R9, R17).

| Option | What it means | Trade-off |
| --- | --- | --- |
| **A. One repository, three projects (recommended)** | One Git repository `taskflow/` containing `taskflow-backend`, `taskflow-frontend` and a small `taskflow-shared`, linked with npm workspaces (built into npm) | One clone, one CI run, one pull request for a change that touches both sides. Shared code is imported directly. |
| B. Two separate repositories | Each app in its own Git repository | Shared code would have to be copied (breaking the "one source" rule) or published as a private package with its own versioning. API and UI changes need two coordinated pull requests. |

Option A keeps both projects exactly as you named them and still separate: each has its own `package.json`, configuration, build and tests. They just live side by side.

### P2 Node.js version

**Node.js 26 LTS.** It became the active long-term support release on 28 October 2026 and is supported until April 2029. NestJS 12 and TypeORM 1.0 both need at least Node.js 20, so 26 is comfortably supported. The version is pinned in `.nvmrc` and in each `package.json`, so every developer and CI use the same one.

### P3 Module format

JavaScript has two ways to connect files: the older **CommonJS** (`require`) and the modern standard **ES modules** (`import`). NestJS 12 now publishes its packages as ES modules; Vite and browsers already use them.

**Recommendation: ES modules in all three projects.** The shared package then works unchanged in both the backend and the frontend, with no double build.

Two small effects to know about:

- In the backend, relative imports end in `.js` even in TypeScript files (`import { AppModule } from './app.module.js'`). That's how Node.js finds ES modules; TypeScript checks it for us.
- TypeORM's migration commands run against the compiled JavaScript in `dist/`, because entities use decorators, which need compiling. The scripts build first automatically.

### P4 Test runner

The approved stack names Jest. Since then, two things make Jest awkward here:

- Jest's support for ES modules still needs an experimental Node.js flag and extra transform configuration, and NestJS 12 is now ES modules.
- Jest doesn't understand Vite's `import.meta.env` without additional plugins.

**Vitest** is a test runner built on Vite. It uses the same test style as Jest (`describe`, `it`, `expect`, mocks), works with React Testing Library and Supertest unchanged, handles ES modules natively, and NestJS 12's own sample projects now use it.

| Option | Effect |
| --- | --- |
| **A. Vitest for both projects (recommended)** | Replaces one approved tool. Tests read the same; less configuration; one runner for backend and frontend. The backend needs one small compiler plugin (SWC), because NestJS relies on decorator information that Vitest's default compiler drops. |
| B. Keep Jest | Works, with an ES-module transform setup, the experimental flag, and an `import.meta.env` workaround in the frontend. More to configure and maintain. |

This changes an approved stack item, so it needs your explicit choice. Everything else in the testing strategy stays the same either way.

## What initialization includes

| Area | Included now | Left for later |
| --- | --- | --- |
| Repository | Workspaces, strict TypeScript, ESLint, Prettier, EditorConfig, `.nvmrc`, Git files, CI workflow |  |
| Local services | Docker Compose with MariaDB 11.4 and a separate test database | Mailpit (M2) |
| Backend | NestJS app; validated configuration; `/api` prefix; security headers; global validation pipe; global exception filter with the standard error shape; logging with redaction; `GET /api/health` that also checks the database; TypeORM connection and migration commands | Entities, tables and migrations (M1); authentication, cookies, CSRF, rate limiting, email (M2, M3); task, Trash and dashboard APIs (M4 to M7) |
| Frontend | Vite React app; Ant Design theme provider; Redux store with an empty `baseApi`; router; `/api` proxy to the backend; one placeholder page | All feature pages, forms and route guards (M2 onwards); MSW (M2) |
| Shared | Project skeleton, wired into both apps | Limits, enums, validators, response types (M1 onwards, as each is needed) |
| Tests | Test runner set up in each project; one backend API test (health) and one frontend component test, both passing in CI | Everything feature-related |

**The placeholder page** shows the name TaskFlow and whether the API answered `/api/health`. It is a technical check that the frontend, proxy, backend and database are connected, not a feature screen. It's replaced in M2.

## Root folder structure

```text
taskflow/
├── taskflow-backend/          NestJS API (its own package.json)
├── taskflow-frontend/         React app (its own package.json)
├── taskflow-shared/           code used by both (its own package.json)
├── docker/
│   └── mariadb/
│       └── init/              SQL run once on first start (creates the test database)
├── docs/                      project notes; query plans and Postman collection later
├── .github/
│   └── workflows/ci.yml       lint, type check, test, build on every pull request
├── docker-compose.yml         local MariaDB
├── package.json               workspaces list and root scripts
├── package-lock.json          exact installed versions, committed
├── .nvmrc                     Node.js 26
├── .editorconfig              indentation and line endings for every editor
├── .gitattributes             line endings in Git
├── .gitignore
├── .prettierrc.json           one formatting style for all projects
├── .prettierignore
└── README.md                  how to set up and run everything
```

**Why these choices:**

- **One lockfile at the root:** npm workspaces install all three projects together and record every exact version in one `package-lock.json`. A teammate or CI gets identical packages.
- **Prettier at the root, ESLint in each project:** formatting should look the same everywhere, so one Prettier config. Lint rules differ (React hooks rules for the frontend; the TypeORM import rule for the backend), so each project has its own ESLint config.
- **`.editorconfig` and `.gitattributes`:** if anyone works on Windows, these stop Git from mixing Windows and Unix line endings, which would otherwise make every line look changed.

## Backend structure: `taskflow-backend`

This is the structure after initialization. Folders for later milestones are listed below the tree, not created yet.

```text
taskflow-backend/
├── src/
│   ├── main.ts                       start-up: security headers, /api prefix, shutdown hooks
│   ├── app.module.ts                 root module: imports Config, Database, Health
│   ├── config/
│   │   ├── env.validation.ts         checks every environment variable at start-up
│   │   └── app-config.service.ts     typed access to settings
│   ├── database/
│   │   ├── database.module.ts        TypeORM connection for the app
│   │   ├── data-source.ts            the same options, for the migration commands
│   │   ├── database-health.ts        "can we reach MariaDB?" check
│   │   └── migrations/               empty until M1
│   ├── common/
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts    every error becomes the standard JSON shape
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts      method, route, status, time, request ID
│   │   ├── logging/
│   │   │   └── redact.ts             masks sensitive keys in log entries
│   │   └── validation/
│   │       └── validation-pipe.ts    global pipe settings
│   └── modules/
│       └── health/
│           ├── health.module.ts
│           ├── health.controller.ts  GET /api/health
│           └── health.service.ts
├── test/
│   └── health.e2e-spec.ts            boots the app and calls /api/health
├── .env.example                      every variable, with safe example values
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

**Added in later milestones:** `modules/` gains `users`, `tokens`, `auth`, `mail`, `rate-limit` (M2, M3), `tasks` (M4), `trash`, `jobs` (M6) and `dashboard` (M7); `common/` gains `guards/` and `decorators/` (M2).

**How the pieces relate:**

- **`modules/`** holds features. Each module owns its controller, service, repository and entity, and `AppModule` just lists the modules. Adding a feature means adding a folder, not editing files all over the project.
- **`common/`** holds things every request passes through: the exception filter, logging, the validation pipe and, later, guards. They're registered once, globally, in `AppModule`, so no feature can forget them.
- **`database/`** is the only place, besides repositories and entities, allowed to import TypeORM (the lint rule from the architecture). The health check's database ping lives here for that reason.
- **`config/`** reads environment variables once at start-up and stops the app with a clear message if any is missing or invalid. A misconfigured server fails at once rather than at 2 a.m. on the first request that needs the value.
- **Why a health endpoint now:** it is the smallest real API, so it proves the whole chain (routing, filter, logging, database) and gives CI one end-to-end test from day one. Hosting platforms also use it to check the app is alive.
- **Shutdown hooks** let NestJS close the database connection pool cleanly when the process stops, instead of cutting connections mid-query.

## Frontend structure: `taskflow-frontend`

```text
taskflow-frontend/
├── public/                       favicon and static files
├── src/
│   ├── main.tsx                  mounts React with the providers
│   ├── app/
│   │   ├── App.tsx               layout shell around the routes
│   │   ├── providers.tsx         Redux Provider, Ant Design ConfigProvider and App
│   │   ├── router.tsx            the route list (one placeholder route now)
│   │   ├── store.ts              configureStore with baseApi only
│   │   └── theme.ts              Ant Design theme settings
│   ├── api/
│   │   └── baseApi.ts            createApi with fetchBaseQuery('/api'); health endpoint
│   ├── features/
│   │   └── status/               placeholder page: "API reachable?" (replaced in M2)
│   ├── components/               shared UI pieces (empty for now)
│   ├── lib/                      small helpers (empty for now)
│   ├── test/
│   │   └── setup.ts              test environment setup
│   └── vite-env.d.ts
├── index.html
├── .env.example
├── eslint.config.mjs
├── package.json
├── tsconfig.json                 (+ tsconfig.app.json, tsconfig.node.json from the Vite template)
└── vite.config.ts                React plugin, /api proxy, test settings
```

**Added in later milestones:** `features/auth` (M2), `features/tasks` (M4, M5), `features/trash` (M6), `features/dashboard` (M7); `components/` gains `RequireAuth`, `GuestOnly` and the loading, empty and error state components; `lib/` gains date, URL and debounce helpers.

**Why it's organised this way:**

- **By feature, not by file type.** Everything about Trash (its pages, components and RTK Query endpoints) lives in `features/trash/`. The alternative, all pages in one folder and all components in another, scatters each feature across the project, so a change means hunting through many folders.
- **`app/` wires things together** (store, router, providers) and holds no feature code.
- **One `baseApi`.** Each feature adds its own endpoints to it with `injectEndpoints`, so there's one cache and one place for the CSRF header and 401 handling later.
- **The `/api` proxy (D2):** in development the browser talks only to Vite at `localhost:5173`, and Vite forwards `/api` requests to NestJS at `localhost:3000`. To the browser it's one origin, exactly like production, so cookies will behave the same in development as in production.
- **No authentication or feature pages yet.** The router has one placeholder route; real pages arrive with their milestones.

## Shared project: `taskflow-shared`

```text
taskflow-shared/
├── src/
│   └── index.ts        exports API_PREFIX = '/api' (the one shared value needed now)
├── package.json        name "@taskflow/shared", ES module, exports the built files
└── tsconfig.json       compiles to dist/ with type declarations
```

- **How the apps use it:** npm workspaces link it into both apps' `node_modules`, so each imports it like any package: `import { API_PREFIX } from '@taskflow/shared'`. The backend uses it for its global route prefix and the frontend for `baseApi` and the Vite proxy, so the two can never disagree.
- **Rules:** plain TypeScript only, with no framework imports and no runtime dependencies, so it runs unchanged in Node.js and in the browser.
- **Grows with the milestones:** limits, enums and validators arrive in M1 and M2, response types as each API is built.

## Dependencies

Only what the foundation needs is installed now. Each later package is installed in the milestone that first uses it, so nothing sits unused.

### Installed now

| Package | Project | Purpose |
| --- | --- | --- |
| `@nestjs/core`, `@nestjs/common` | Backend | The NestJS framework |
| `@nestjs/platform-express` | Backend | Runs NestJS on Express, the default HTTP server |
| `reflect-metadata`, `rxjs` | Backend | Required by NestJS: decorator metadata and the stream library its interceptors use |
| `@nestjs/config` | Backend | Loads and validates environment variables |
| `@nestjs/typeorm`, `typeorm`, `mysql2` | Backend | Database access; `mysql2` is the only MariaDB driver TypeORM 1.0 supports |
| `class-validator`, `class-transformer` | Backend | Validation for the global validation pipe, and for configuration |
| `helmet` | Backend | Security headers |
| `react`, `react-dom` | Frontend | UI library |
| `antd` | Frontend | Ant Design components and theme |
| `@reduxjs/toolkit`, `react-redux` | Frontend | Redux store and RTK Query |
| `react-router` | Frontend | Routing |

### Development tools, installed now

| Package | Project | Purpose |
| --- | --- | --- |
| `typescript` | All three | Compiler and type checker |
| `prettier` | Root | Formatting |
| `eslint`, `typescript-eslint`, `eslint-config-prettier` | Backend, frontend | Linting; the last one switches off rules that would fight Prettier |
| `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Frontend | React-specific lint rules (from the Vite template) |
| `@nestjs/cli`, `@nestjs/testing` | Backend | Build, watch mode, and test helpers |
| `@types/node`, `@types/express` | Backend | Type information |
| `vite`, `@vitejs/plugin-react` | Frontend | Dev server and production build |
| `@types/react`, `@types/react-dom` | Frontend | Type information |
| `vitest` \[P4\] | Backend, frontend | Test runner |
| `unplugin-swc`, `@swc/core` \[P4\] | Backend | Compiles tests with decorator information, as NestJS needs |
| `supertest`, `@types/supertest` | Backend | Calls the API in end-to-end tests |
| `jsdom` | Frontend | A browser-like environment for component tests |
| `@testing-library/react`, `@testing-library/jest-dom` | Frontend | Component tests and readable assertions like `toBeInTheDocument()` |

If you choose to keep Jest instead \[P4\], `vitest` and the SWC plugin are replaced by `jest` with an ES-module transform (`@swc/jest`), and the frontend needs an extra plugin for `import.meta.env`.

### Installed later, when first needed

| Package | Milestone | Purpose |
| --- | --- | --- |
| `@nestjs/jwt`, `bcrypt`, `cookie-parser`, `nodemailer` (+ types) | M2 | Sessions, password hashing, cookies, email |
| `react-hook-form`, `@testing-library/user-event`, `msw` \[D13\] | M2 | Forms and form tests |
| `dayjs` (already inside Ant Design; added explicitly when imported) | M4 | Date picker values |
| `@nestjs/schedule` | M6 | Daily cleanup job |

### Deliberately not installed

Passport, Zod, Joi, Axios, Lodash, Moment, Swagger, Redis, Playwright and process runners such as `concurrently`. Each would duplicate something we already have or isn't needed yet.

## Development scripts

| Where | Script | What it does |
| --- | --- | --- |
| Root | `db:up` / `db:down` | Start or stop the local MariaDB container |
| Root | `build` | Build `taskflow-shared` first, then backend and frontend |
| Root | `lint`, `typecheck`, `test` | Run that script in every project that has it |
| Root | `format` / `format:check` | Prettier: fix formatting / only report it (CI uses the check) |
| Backend | `start:dev` | Run the API with automatic restart on save |
| Backend | `build` / `start:prod` | Compile to `dist/` / run the compiled app |
| Backend | `lint`, `typecheck` | ESLint / TypeScript check without output |
| Backend | `test` / `test:e2e` / `test:cov` | Unit tests / API end-to-end tests / coverage report |
| Backend | `migration:generate -- <Name>`, `migration:run`, `migration:revert`, `migration:show` | Build, then run the TypeORM migration command against the compiled data source |
| Frontend | `dev` | Vite dev server with the `/api` proxy |
| Frontend | `build` / `preview` | Type-check and build for production / serve that build locally |
| Frontend | `lint`, `typecheck`, `test`, `test:watch` | As above; watch mode re-runs tests on save |
| Shared | `build` / `dev` | Compile once / recompile on save |

**Daily development** uses three terminals: `taskflow-shared` in `dev`, the backend in `start:dev`, the frontend in `dev`, with `db:up` run once. A tool could start all three from one terminal, but it would be one more package; three terminals also keep each log readable.

## Environment configuration

**The principle:** settings come from environment variables. `.env` files are only a local convenience; production servers get real environment variables from the hosting platform's secret storage, and no `.env` file exists there.

### Backend

| File | Committed? | Purpose |
| --- | --- | --- |
| `.env.example` | Yes | Every variable with a safe example value and a comment: the documentation |
| `.env` | **Never** | Your local values, copied from the example |
| `.env.test` | **Never** | Values for the test database; CI sets the same values in the workflow instead |

Variables needed now:

| Variable | Example | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test` or `production` |
| `PORT` | `3000` | API port |
| `LOG_LEVEL` | `info` | How much to log |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `3306`, `taskflow`, `taskflow`, … | Database connection |
| `DB_SSL` | `false` | Encrypted database connection; `true` in production |

Added with M2: `APP_URL`, `JWT_SECRET`, `CSRF_SECRET`, cookie names, `TRUST_PROXY`, `SMTP_*` and `MAIL_FROM`.

- **Validated at start-up:** `env.validation.ts` describes each variable with class-validator rules, and `@nestjs/config` runs it through its custom `validate` hook (F5). Any missing or invalid value stops the app with a message naming every problem at once.
- **Typed access:** code reads settings through `AppConfigService` (`config.db.host`), never `process.env` directly, so a typo is a compile error rather than an `undefined` at runtime.
- **Time zone:** `TZ=UTC` is set in Docker, CI and production. Locally, `main.ts` sets it before anything else runs.

### Frontend

Vite exposes only variables starting with `VITE_` to browser code, and it builds them **into the public JavaScript file**, which anyone can read. So the frontend must never hold a secret, and right now it needs no `VITE_` variables at all: same origin means the API is simply `/api`.

The one setting is `API_PROXY_TARGET` (default `http://localhost:3000`), read only by `vite.config.ts` for the development proxy. It isn't exposed to the browser and is documented in `.env.example`.

## Git setup

- **One repository** at `taskflow/` \[P1\], on GitHub.
- **Branches:** `main` is always working. It is protected on GitHub: changes arrive only through pull requests with CI passing. Each milestone gets its own branch, starting with `m0-foundation`.
- **Commit messages:** a type, a summary, and the related IDs, for example `chore: set up NestJS backend (M0)` or later `feat: move task to Trash (FR-TASK-4)`. Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`.
- **Committed:** `package-lock.json` (exact versions), `.env.example` files, all configuration.
- **Never committed:** `.env` files, `node_modules`, build output, coverage reports.

`.gitignore` at the root (its patterns apply in every subfolder):

```text
# Dependencies
node_modules/

# Build output
dist/
*.tsbuildinfo

# Test output
coverage/

# Environment files: only the examples are committed
.env
.env.*
!.env.example

# Logs
*.log
npm-debug.log*

# Editors and operating systems
.idea/
.vscode/*
!.vscode/extensions.json
.DS_Store
Thumbs.db

# Vite
*.local
```

`.gitattributes` holds one line, `* text=auto eol=lf`, so every file is stored with Unix line endings whatever system it was edited on.

**CI (GitHub Actions)** on every pull request: check out, install Node.js from `.nvmrc`, `npm ci` (installs exactly what the lockfile says), start MariaDB 11.4 as a service, then `format:check`, `lint`, `typecheck`, `test` and `build`. Any failure blocks the merge.

## Initial database configuration

Initialization connects to MariaDB and sets up migrations, but creates **no tables**. Entities and the first migration are M1.

### Local MariaDB with Docker Compose

```yaml
# docker-compose.yml (root)
services:
  mariadb:
    image: mariadb:11.4
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-root_dev_only}
      MARIADB_DATABASE: taskflow
      MARIADB_USER: ${DB_USER:-taskflow}
      MARIADB_PASSWORD: ${DB_PASSWORD:-taskflow_dev_only}
      TZ: UTC
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_uca1400_ai_ci
      - --default-time-zone=+00:00
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mariadb-data:/var/lib/mysql
      - ./docker/mariadb/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      retries: 5

volumes:
  mariadb-data:
```

```sql
-- docker/mariadb/init/01-create-test-database.sql (runs once, on first start)
CREATE DATABASE IF NOT EXISTS taskflow_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
GRANT ALL PRIVILEGES ON taskflow_test.* TO 'taskflow'@'%';
```

- **Two databases:** `taskflow` for development and `taskflow_test` for automated tests. Tests empty their tables between runs, so they must never touch your development data.
- **Server settings match the architecture:** UTF-8 everywhere, the accent- and case-insensitive default collation (D22), and UTC as the server time zone.
- **The data lives in a named volume,** so stopping or recreating the container keeps it. Deleting the volume resets the database completely.
- **The passwords are local-only defaults** and can be overridden from a root `.env`. They never go anywhere near production.
- **Port conflict:** if MySQL or MariaDB already runs on your machine on 3306, set `DB_PORT` to another port.

### TypeORM connection

One function builds the connection options. `DatabaseModule` uses it for the app, and `data-source.ts` uses it for the migration commands, so the two can't drift apart.

```ts
// src/database/data-source.ts (shape, not final code)
export function buildDataSourceOptions(config: DbConfig): DataSourceOptions {
  return {
    type: 'mariadb',
    host: config.host,
    port: config.port,
    username: config.user,
    password: config.password,
    database: config.name,
    charset: 'utf8mb4',
    timezone: 'Z',                 // timestamps in UTC
    dateStrings: ['DATE'],         // due dates stay 'YYYY-MM-DD' strings
    entities: [],                  // listed explicitly from M1
    migrations: ['dist/database/migrations/*.js'],
    synchronize: false,            // never alter tables automatically
    migrationsRun: false,          // migrations run by an explicit command
    logging: ['error', 'warn', 'migration'],
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
  };
}
```

- **`synchronize: false`:** TypeORM can rewrite tables to match entities automatically, which can silently drop columns and their data. Only reviewed migrations change the schema.
- **`migrationsRun: false`:** migrations run as a deliberate step (`migration:run`), so starting the app never changes the database by surprise.
- **Entities listed explicitly** rather than found by a file pattern: patterns are fragile with ES modules and compiled paths.
- **Start-up retries:** NestJS's TypeORM module retries the connection a few times, so the API doesn't crash if it starts while the MariaDB container is still booting.

### Health check

`GET /api/health` runs `SELECT 1` with a 2-second limit. It returns 200 `{ "status": "ok", "database": "up" }`, or 503 `{ "status": "error", "database": "down" }` if MariaDB can't be reached. It's public, reveals no versions or configuration, and is the first end-to-end test.

## Steps and done criteria

### Order of work, after your approval

1. **Root:** create the repository, workspaces `package.json`, `.nvmrc`, EditorConfig, Prettier, Git files and README.
2. **Database:** Docker Compose and the init script; start MariaDB; confirm both databases exist.
3. **Shared:** create `taskflow-shared` and build it.
4. **Backend:** generate with the NestJS CLI as an ES-module project; remove the sample code; add configuration validation, the database module, health check, global filter, pipe, logging and security headers; the TypeORM lint rule; test setup and the health end-to-end test.
5. **Frontend:** generate from Vite's React + TypeScript template; remove the sample code; add Ant Design, the Redux store with `baseApi`, the router, the placeholder page and the `/api` proxy; test setup and one component test.
6. **CI:** the GitHub Actions workflow.
7. **Review:** commit on the `m0-foundation` branch, open a pull request, and walk through every file together.

### Done when

- [ ] A fresh clone installs with one `npm install`
- [ ] `npm run db:up` starts MariaDB and it reports healthy
- [ ] `GET /api/health` returns `ok` with the database `up`; with MariaDB stopped, it returns 503 with `down`
- [ ] Removing a required variable from `.env` stops the backend with a clear message
- [ ] An unknown route returns the standard JSON error shape, with no stack trace
- [ ] The frontend page shows "API reachable" through the proxy
- [ ] `lint`, `typecheck`, `test` and `build` all pass from the root, and CI is green
- [ ] No entities, tables, authentication or feature code exist yet
