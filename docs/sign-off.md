# TaskFlow Requirements Sign-off

Nov 18, 2026 · @Ashwini

## Verdict

> **Signed off on 18 November 2026.** D1 to D22 and P1 to P4 are approved. The requirements and the Technical Architecture are approved for development, and Project Initialization (M0) can begin. The Requirements v2.1 addendum follows separately.

**The requirements are complete, consistent and approved. Development can start as soon as one round of architecture decisions is approved.**

- **Requirements:** v1 (Phase 1) and v2 are approved, and together cover every feature without contradictions. Every approved business rule is preserved in the architecture.
- **Architecture:** the review is complete, but its 22 decisions (D1 to D22) have not yet been formally approved. The architecture document still says "draft". This is the only thing blocking a full sign-off.
- **Project initialization:** four new setup decisions (P1 to P4) arise from your request for two separate projects and from tool releases since the architecture was written. They are explained in the second tab, Project Initialization Plan.

Once you approve D1 to D22 and P1 to P4, or tell me which to change, this report becomes an unconditional sign-off and initialization can begin.

## Documents and versions

| Document | Version | Status | Contains |
| --- | --- | --- | --- |
| Requirements v1 (Phase 1) | Sections 1.3 to 1.6 | Approved (Phase 1 homework: assumptions 1 to 7 approved, password reset and email verification added to scope) | FR-AUTH-1 to 7, FR-TASK-1 to 6, FR-ORG-1 to 6, FR-DASH-1, data rules, non-functional requirements, US-01 to US-14 and their acceptance criteria, AC-11.1 to 11.8 |
| [Requirements v2](https://claude.ai/artifact/AhQ983GETG8jvdH2WXo9p2) | 17 November 2026 | **Approved** | Soft delete and Trash, email verification, password reset, `tokenVersion`; FR-AUTH-8 to 18, FR-TASK-7 to 12, FR-ORG-7, NFR-SEC-1 to 5, NFR-SCALE-1, NFR-REL-1, NFR-MAINT-1 and 2, NFR-TEST-1; US-15 to US-21; updated US-01, US-02, US-08 |
| [Technical Architecture](https://claude.ai/artifact/SQdKLAtrLRWSDGZBjoRzMk) | Revision 2, 18 November 2026 (after review round 2) | **Reviewed; decisions D1 to D22 awaiting approval** | Stack, NestJS modules, security design, MariaDB schema, API, frontend, testing, milestones |
| Phase 1 homework review | 17 November 2026 | Reference only | Feedback that led to v2 |

**Which document wins:** where v2 changes a v1 item, v2 applies. Examples: FR-AUTH-1, 4 and 7, FR-TASK-4 and 6, FR-ORG-3, US-01 criterion 1 (now "Check your email" instead of going to login), and the US-08 criteria (now Trash instead of deletion). Everything in v1 that v2 doesn't touch still stands.

**Recommended follow-up:** once D10, D11, D12 and D19 to D22 are approved, record them in a short Requirements v2.1 addendum. They add small rules (password byte limit, sort tie-breakers, search ignoring accents, and so on), and the requirements should stay the single source of truth for business rules.

## Confirmed scope

### In scope

| Area | Features | Requirements | Stories |
| --- | --- | --- | --- |
| Accounts | Register; email verification and resend; log in; log out; forgot and reset password; generic responses that never reveal which emails exist; rate limits; old sessions end after a password reset | FR-AUTH-1 to 18 | US-01, 02, 03, 15, 16, 17 |
| Privacy | Every task visible only to its owner; another user's task returns 404 | FR-TASK-6, FR-AUTH-6, 7 | US-04 |
| Tasks | Create, view, edit, toggle Pending/Completed, move to Trash with confirmation | FR-TASK-1 to 5 | US-05 to 09 |
| Trash | View with 30-day countdown; restore; permanently delete one; empty Trash; automatic purge after 30 days | FR-TASK-7 to 12 | US-18 to 21 |
| Organization | Search; filter by status and by one or more priorities; sort; paginate; all combinable, applied immediately, back to page 1 on change | FR-ORG-1 to 7 | US-10 to 13 |
| Dashboard | Total, Pending, Completed and Overdue counts; first-task prompt | FR-DASH-1 | US-14 |
| Quality | bcrypt, 1-hour JWT, secrets in environment variables, server-side validation, under 500 ms for 1,000 tasks, 360 px to desktop, loading/empty/error states, no stack traces, strict TypeScript, 70% service coverage, and the v2 security, scaling, reliability and testing requirements | Section 1.5, NFR-\* |  |

### Not in scope

These are not in any approved requirement, so they won't be built unless you add them:

- Sharing tasks, teams, roles or administrators
- Editing a profile, changing email address or deleting an account
- Refresh tokens and "log out of all devices" (listed as later improvements)
- Reminders, notifications or emails beyond verification, reset, "account exists" and "password changed"
- Labels, categories, attachments, subtasks or recurring tasks
- Production hosting, deployment pipeline and choice of production email provider (needed before release, not for development)

## Confirmed technology stack

Your latest message listed the core of the stack. For completeness, this is the full approved stack, with the versions that are current today. Exact versions get locked in `package-lock.json` when the projects are created.

| Layer | Technology | Version to use | Note |
| --- | --- | --- | --- |
| Runtime | Node.js | **26 LTS** \[P2\] | Long-term support since 28 October 2026, until April 2029 |
| Language | TypeScript | The version NestJS 12 requires | Strict mode in all projects |
| Backend | NestJS | **12** | Released August 2026; packages are now ES modules \[P3\] |
| ORM | TypeORM | **1.x** | Released May 2026; first major release since 0.3 |
| Database | MariaDB | **11.4 LTS** \[D1\] | Supported until May 2029 |
| Frontend | React | 19 | Recommended by Ant Design 6 |
| Build tool | Vite | Current stable |  |
| UI | Ant Design | **6** | Released November 2025; requires React 18 or later |
| State and API | Redux Toolkit with RTK Query | Current stable |  |
| Routing | React Router | Current stable |  |
| Forms | React Hook Form | Current stable |  |
| Tests | Jest, React Testing Library, Supertest | Current stable | Test runner choice under review \[P4\] |
| API testing | Postman |  | \[D15\] |
| Local services | Docker Compose |  | MariaDB now; Mailpit added in M2 |
| Version control | Git and GitHub, GitHub Actions |  |  |

**What changed since the architecture was written:** NestJS 12, TypeORM 1.0, Ant Design 6 and Node.js 26 LTS were not specifically named in the architecture document. None changes a design decision. Two practical effects are covered in the initialization plan: NestJS 12's move to ES modules \[P3\], and its effect on Jest \[P4\].

## Alignment check: requirements vs architecture

Every requirement was traced to the part of the architecture that implements it and the tests that prove it.

| Requirements | Implemented by | Proven by | Status |
| --- | --- | --- | --- |
| FR-AUTH-1 to 3, 8 (registration) | `AuthModule`, bcrypt, generic response, verification token at registration | AC-01.x end-to-end tests | Covered |
| FR-AUTH-4, 5, 10 (login, logout) | Login steps, session cookie, logout clearing cookies | AC-02.x tests, rate limiter tests | Covered |
| FR-AUTH-6, 7 (protected pages and API) | Global `JwtAuthGuard`; `RequireAuth` route guard | 401 tests, isolation suite | Covered |
| FR-AUTH-9, 11, 15, 16 (verification and tokens) | `TokensRepository` with one row per type, claim statement, link pages | AC-15.x, AC-16.x, concurrency tests | Covered |
| FR-AUTH-12 to 14 (reset and sessions) | Reset transaction, `tokenVersion`, post-commit email | AC-17.1 to 17.11 | Covered |
| FR-AUTH-17, 18 (cleanup, email failure) | Daily cleanup job; account kept on send failure | AC-C.x, AC-01.6 | Covered |
| FR-TASK-1 to 6 (tasks and privacy) | `TasksRepository` with ownership on every method | Isolation suite, task tests | Covered |
| FR-TASK-7 to 12 (Trash) | Trash module, `@DeleteDateColumn`, purge job | AC-08.x, 18.x to 21.x, AC-P.x | Covered |
| FR-ORG-1 to 7 (organization) | List query DTO, LIKE escaping, URL-driven filters, debounced search | AC-11.x, filter and sort tests | Covered |
| FR-DASH-1 (dashboard) | One covering-index count query with `today` \[D16\] | US-14 tests | Covered |
| Data rules (1.4) | DTO validation, column types, shared limits | Validation and contract tests | Covered |
| Overdue time zone (deferred from Phase 1) | Client sends its local date \[D16\] | Overdue boundary test | Covered, pending D16 |
| Security (1.5, NFR-SEC-1 to 5) | bcrypt, 1-hour JWT, env secrets, server validation, rate limits, secure tokens, link building from config, log redaction, equal-time login | Security test areas | Covered |
| Performance (500 ms) | Indexes checked per query | Performance test, M5 and M8 | Covered |
| Usability (360 px; loading, empty, error states) | Ant Design responsive layout; RTK Query states | Component tests, M8 review | Covered |
| Reliability (no stack traces) | Global exception filter | Error tests | Covered |
| Maintainability (strict TS, ESLint, Prettier; NFR-MAINT-1, 2) | Project setup; repositories; mail interface | Lint in CI | Covered |
| Testability (70% services; NFR-TEST-1) | Testing strategy | Coverage report, CI | Covered |
| NFR-SCALE-1, NFR-REL-1 | In-memory limiter behind an interface; idempotent jobs | Limiter and job tests | Covered |

**Result:** no requirement is missing from the architecture, and the architecture builds nothing the requirements don't ask for. The only additions are the small clarifying rules in D10 to D12 and D19 to D22, which await your approval.

## Business rules preserved

Each approved rule was checked against the architecture. All are preserved unchanged.

| Approved rule | Source | Where the architecture keeps it |
| --- | --- | --- |
| Email unique, case-insensitive | FR-AUTH-2 | Lowercased by the app; unique column |
| Password: 8+ characters, a letter and a number | Data rules | Shared `checkPassword` (D20, D21 only clarify) |
| Same message for wrong email or wrong password | US-02 | Login steps 3 to 5 |
| Registration, resend and forgot never reveal whether an email exists | FR-AUTH-8, 11, 12 | Generic responses, also when rate-limited |
| Unverified users can't log in; "verify first" only after the correct password | FR-AUTH-10 | Login step 6 |
| Links expire after 30 minutes, work once; a new link invalidates older ones | FR-AUTH-15 | Claim statement; one row per type (D19) |
| Reset: change password, end old sessions, verify email, notify, go to login | FR-AUTH-13, 14 | Reset transaction, `tokenVersion` |
| Unverified accounts deleted after 7 days | FR-AUTH-17 | Daily job |
| Another user's task returns 404, not 403 | Phase 1, FR-TASK-6 | Ownership in every query; isolation suite |
| Title required, 1 to 100 characters, trimmed; description up to 1,000 | Data rules | DTOs, columns, shared limits |
| Priority defaults to Medium; status defaults to Pending | Data rules | Column defaults, DTO |
| Due date optional, date only, past dates allowed | Data rules | `DATE` column as string |
| Overdue = due before today and Pending; counted as Pending too | Data rules, US-14 | Dashboard query |
| Page size 10 by default, 50 at most | Data rules | Query DTO |
| Delete moves to Trash with confirmation; removed from list only after the server confirms | FR-TASK-4, Phase 1 | No optimistic updates |
| Trash: newest first, 30-day countdown, restore keeps all fields | FR-TASK-7, 8 | Trash query and response |
| Permanent delete and Empty Trash: explicit "cannot be recovered" confirmation | FR-TASK-9, 10 | Confirmation dialogs |
| Filters apply immediately; multiple priorities; page resets to 1 | FR-ORG-3, 7 | URL-driven filters |
| JWT expires after 1 hour | Section 1.5 | Session cookie and JWT |
| Rate limits: 5 failed logins per email + IP per 15 minutes; 3 resends or resets per email per hour | NFR-SEC-1 | Rate limiter |
| Logout does not end other sessions | Requirements v2 decision | Logout section |

## Findings

No contradictions remain between the approved requirements. These are the open points.

| # | Finding | Type | Blocks | Resolution |
| --- | --- | --- | --- | --- |
| F1 | Architecture decisions D1 to D22 are not yet formally approved; the document is still marked draft | Unresolved decisions | Sign-off | Approve them, or name the ones to change |
| F2 | You asked for two separate projects, `taskflow-backend` and `taskflow-frontend`. The architecture assumed one repository with a shared package (`packages/shared`), which several decisions depend on (D7, R9, R17) | Structural difference | Initialization | P1: one repository holding `taskflow-backend`, `taskflow-frontend` and a small `taskflow-shared` |
| F3 | NestJS 12 ships as ES modules; the architecture assumed the older CommonJS format | Toolchain change | Initialization | P3: use ES modules in all three projects |
| F4 | Jest needs extra configuration to test ES-module code and Vite's `import.meta.env`; NestJS 12's own samples moved to Vitest | Toolchain risk | Initialization | P4: your choice between Vitest and Jest |
| F5 | NestJS 12 changed `@nestjs/config` validation to the Standard Schema format; the architecture validates configuration with class-validator | Toolchain change | No | Use `@nestjs/config`'s custom validate function with class-validator; no new library. Verified during initialization. |
| F6 | Rules added during architecture (D10 to D12, D19 to D22) are not yet in the requirements | Documentation | No | Requirements v2.1 addendum after approval |
| F7 | Production hosting, deployment pipeline and production email provider are undecided | Gap outside development scope | No (needed before release) | Decide before M8 |

## Outstanding decisions

### From the Technical Architecture (details there)

| Group | Decisions |
| --- | --- |
| Infrastructure | D1 MariaDB 11.4 LTS · D2 one web address · D4 native UUIDs · D5 email lowercased, exact collation |
| Security | D3 session cookie and signed CSRF token · D8 `@nestjs/jwt` with global guard · D9 in-memory rate limiter · D18 token in URL fragment |
| Code organization | D6 TypeORM soft-delete column · D7 shared package |
| Small rules (to record in v2.1) | D10 old-token cleanup · D11 72-byte password limit · D12 sort tie-breakers, empty due dates last · D19 one token per user and type · D20 password normalization · D21 meaning of letter and number · D22 search ignores case and accents |
| Tools | D13 MSW · D14 Playwright later · D15 Postman |
| Carried over | D16 client sends today's date · D17 name 1 to 50 characters |

### From project initialization (details in the second tab)

| # | Decision | Recommendation |
| --- | --- | --- |
| P1 | Repository layout | One Git repository with three projects: `taskflow-backend`, `taskflow-frontend`, `taskflow-shared` |
| P2 | Node.js version | 26 LTS |
| P3 | Module format | ES modules in all three projects |
| P4 | Test runner | Vitest (replaces Jest; same test style). Or keep Jest with extra configuration. |

## Sign-off

The requirements (v1 as amended by v2) are complete, internally consistent and fully covered by the architecture, with all approved business rules preserved. **They are ready for development**, subject to the approvals below.

- [x] Architecture decisions D1 to D22 approved, or changes named
- [x] Initialization decisions P1 to P4 approved, or changes named
- [ ] Requirements v2.1 addendum recorded (can follow, doesn't block initialization)

When the first two are ticked, the Technical Architecture is marked approved, and Project Initialization (milestone M0) begins.
