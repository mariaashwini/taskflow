# TaskFlow

A personal task manager: register and verify your email, log in, create and organise tasks, recover deleted tasks from a Trash for 30 days, and see a dashboard.

The project is being built milestone by milestone. **Current milestone: M0, Project Initialization.** Sections marked _(added in a later step)_ describe parts that don't exist yet.

## Repository layout

One Git repository with three projects, linked by [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces):

```text
taskflow/
├── taskflow-backend/     NestJS API                        (added in a later step)
├── taskflow-frontend/    React app                         (added in a later step)
├── taskflow-shared/      TypeScript shared by both apps    (added in a later step)
├── docs/                 requirements, architecture and plans
└── .github/workflows/    CI                                (added in a later step)
```

## Prerequisites

### Node.js 26

The required version is in `.nvmrc` and in `engines` in `package.json`.

On a machine that also needs other Node.js versions, use a version manager. On Windows with [nvm-windows](https://github.com/coreybutler/nvm-windows), in a terminal opened as Administrator:

```powershell
nvm use 26.13.1
node --version   # v26.x
npm --version
```

### MariaDB 11.4 LTS, installed locally (no Docker)

The backend expects a MariaDB 11.4 server that is already running and set up:

| Setting                     | Value                                                                   |
| --------------------------- | ----------------------------------------------------------------------- |
| Server time zone            | `default_time_zone = '+00:00'` (UTC)                                    |
| Character set and collation | `utf8mb4` / `utf8mb4_uca1400_ai_ci`                                     |
| Development database        | `taskflow`                                                              |
| Test database               | `taskflow_test` (automated tests empty its tables)                      |
| User                        | `taskflow`@`localhost`, with all privileges on those two databases only |
| Connection                  | `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_SSL=false`                     |

The database password belongs only in your local `.env` files, which are never committed.

To check the server manually (the `--skip-ssl` flag is needed only if your MariaDB client requires TLS and the server has none):

```powershell
mariadb -h 127.0.0.1 -P 3307 -u taskflow -p --skip-ssl -e "SELECT @@version, @@time_zone, @@collation_server;"
```

Run the query to check the server version: `mariadb --version` reports only the client's version.

### Git

Any recent version.

## Setup

```powershell
git clone <repository-url> taskflow
cd taskflow
npm install
```

`npm install` at the root installs all three projects at once and records exact versions in the single `package-lock.json`.

Copying the `.env.example` files and starting the apps is _(added in a later step)_.

## Root scripts

Run from the repository root:

| Script                 | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `npm run build`        | Builds `taskflow-shared` first, then the backend and frontend   |
| `npm run lint`         | Runs ESLint in every project that has it                        |
| `npm run typecheck`    | Runs the TypeScript check in every project that has it          |
| `npm test`             | Runs the tests in every project that has them                   |
| `npm run format`       | Formats every file with Prettier                                |
| `npm run format:check` | Reports formatting problems without changing files (used by CI) |

`build`, `lint`, `typecheck` and `test` do something only once the projects exist.

## Documentation

- `docs/requirements-v1.md` and `docs/requirements-v2.md`: requirements (v2 overrides v1 where they differ)
- `docs/technical-architecture.md`: approved architecture and milestones M0 to M8
- `docs/sign-off.md`: sign-off report and decisions P1 to P4
- `docs/project-initialization-plan.md`: the plan for M0
