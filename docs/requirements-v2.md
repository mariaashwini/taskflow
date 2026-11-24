# TaskFlow Requirements v2 (approved)

Nov 17, 2026 · @Ashwini

This version adds soft delete with Trash, email verification and password reset, using the decisions you approved. All six open decisions are now resolved. Approved on 17 November 2026. This is the baseline for the technical architecture and implementation.

## Decisions (resolved)

All six decisions are resolved. D5 changed from the original recommendation, based on your concern.

| # | Topic | Decision | Why |
| --- | --- | --- | --- |
| D1 | Verification link | Approved. The link opens a page with a "Verify my email" button that sends the request. | Email security scanners open links automatically and would use up a single-use link before the user clicks it. |
| D2 | Login rate limiting | Approved. Limit by email + IP: after 5 failed attempts in 15 minutes, block that combination for 15 minutes. The account itself is never locked. | Locking the account would let an attacker lock out any user on purpose. |
| D3 | Rate-limit storage | Approved for the initial version: counters in memory. Valid only while TaskFlow runs on a single backend server. Move to Redis before running more than one instance. | With several servers, each would keep its own counts, so an attacker would get more attempts. Counts also reset on restart. |
| D4 | Re-registering an unverified email | Approved. Show the generic message and resend verification; never change the stored name or password. | Otherwise anyone could overwrite the password of an unverified account. |
| D5 | Invalidating sessions after a reset | **Changed: use `tokenVersion`.** Each user has a `tokenVersion` integer starting at 0. Every JWT carries the version current at login. A password reset increments it in the same database transaction as the password change. A request whose JWT version is missing or doesn't match the user's current version gets 401. | Your concern was correct: with whole-second timestamps, a JWT issued in the same second as the reset would pass the check. A version number has no ties. An old JWT always carries a smaller number; a fresh login always gets the current one. |
| D6 | Scheduled jobs | Approved. The Trash purge and unverified-account cleanup run once daily inside the backend and are idempotent. | Each run deletes only records matching the rule at that moment, so a repeat run deletes nothing extra, and restored or verified records are never touched. |

One trade-off, not a decision: checking `tokenVersion` means every authenticated request reads the user's record, so the JWT is no longer fully self-contained. The cost is one primary-key lookup per request, small for TaskFlow. `passwordChangedAt` stays as a record of when the password last changed, but is no longer used to check sessions.

## Data model changes

Task status stays PENDING or COMPLETED. Trash is tracked only by `deletedAt`.

| Entity | Field | Rule |
| --- | --- | --- |
| Task | `deletedAt` | Timestamp, null by default. Null = active; set = in Trash. |
| User | `email` | Stored lowercased so uniqueness is case-insensitive. |
| User | `emailVerifiedAt` | Timestamp, null until verified. Null = unverified. |
| User | `tokenVersion` | Integer, starts at 0. Incremented on every password reset. Every JWT carries it, and a JWT with a different or missing version is rejected. |
| User | `passwordChangedAt` | Timestamp, set on registration and on every password reset. A record only; not used to check sessions. |
| AuthToken (new) | `userId` | The user the token belongs to. |
| AuthToken | `type` | EMAIL\_VERIFICATION or PASSWORD\_RESET. |
| AuthToken | `tokenHash` | SHA-256 hash of the token. The raw token is never stored. |
| AuthToken | `expiresAt` | 30 minutes after creation. |
| AuthToken | `usedAt` | Null until used. A used token is never accepted again. |

A token is valid only if its hash matches, `usedAt` is null, and `expiresAt` is in the future.

## Functional requirements: Authentication

| ID | Requirement | Change |
| --- | --- | --- |
| FR-AUTH-1 | A guest can register with name, email and password. The account is created unverified and a verification email is sent. | Updated |
| FR-AUTH-2 | Email must be unique (case-insensitive). | Unchanged |
| FR-AUTH-3 | Passwords are stored only as a bcrypt hash, never as plain text. | Unchanged |
| FR-AUTH-4 | A verified user can log in with email and password and receives a JWT containing their current `tokenVersion`. | Updated |
| FR-AUTH-5 | A user can log out. | Unchanged |
| FR-AUTH-6 | Task pages are reachable only when logged in. Guests are redirected to login. | Unchanged |
| FR-AUTH-7 | Every task and Trash API endpoint rejects requests without a valid token (401). | Updated |
| FR-AUTH-8 | Registration always shows "Check your email to continue", whether or not the email exists. Existing verified email: send an "account already exists" email with a reset link. Existing unverified email: resend verification without changing the stored name or password. | New |
| FR-AUTH-9 | The verification email contains a link to a page where the user confirms verification with a button. | New |
| FR-AUTH-10 | An unverified user cannot log in. With a correct password, they see "Please verify your email first" and a resend option. With a wrong password, they see "Invalid email or password". | New |
| FR-AUTH-11 | A user can request another verification email. The response is the same whether or not the email exists or is already verified. | New |
| FR-AUTH-12 | A user can request a password reset by email. The response is always "If an account exists with this email address, you will receive instructions to reset your password." | New |
| FR-AUTH-13 | Using a valid reset link, a user can set a new password that meets the password rules. In one database transaction: the password hash is updated, `tokenVersion` is incremented, `passwordChangedAt` is set, the reset token is marked used, and the email is marked verified if it wasn't. Then a "Your password was changed" email is sent and the user is redirected to login. | New |
| FR-AUTH-14 | Every authenticated request compares the JWT's `tokenVersion` with the user's current value and returns 401 if it's missing or different. If refresh tokens are added later, a password reset revokes all of them. | New |
| FR-AUTH-15 | Verification and reset tokens are secure random values, stored as SHA-256 hashes, expire after 30 minutes and work once. Issuing a new token invalidates earlier unused tokens of the same type for that user. | New |
| FR-AUTH-16 | Expired, invalid or already-used links show a clear page explaining what happened, with a way to request a new link. A verification link for an already-verified account says "Your email is already verified" and links to login. | New |
| FR-AUTH-17 | Unverified accounts are deleted automatically by a daily job once they are more than 7 days old. | New |
| FR-AUTH-18 | If sending an email fails, the account is kept and the user can request another email. | New |

## Functional requirements: Tasks, Trash and Organization

Only changed and new requirements are listed. FR-TASK-1, 2, 3 and 5 and the other ORG requirements are unchanged, except that they apply to active tasks only (FR-TASK-12).

| ID | Requirement | Change |
| --- | --- | --- |
| FR-TASK-4 | A user can move their own task to Trash after confirming in a dialog. This sets `deletedAt` and shows "Task moved to Trash". | Updated |
| FR-TASK-6 | A user can never read, edit, restore or delete another user's task, active or in Trash. Attempts return 404. | Updated |
| FR-TASK-7 | A user can view their Trash: tasks newest-deleted first, paginated, with the banner "Tasks in Trash are permanently deleted after 30 days" and a countdown on each task (e.g. "Deletes in 4 days"). | New |
| FR-TASK-8 | A user can restore a task from Trash. It returns to the task list with all its fields, including status, unchanged. | New |
| FR-TASK-9 | A user can permanently delete one task from Trash after a confirmation that says the task will be permanently deleted and cannot be recovered. On success, show "Task permanently deleted". Permanent delete works only on tasks in Trash; for an active task it returns 404. | New |
| FR-TASK-10 | A user can empty their Trash. The confirmation states how many tasks will be permanently deleted and that this cannot be undone. It deletes all of that user's trashed tasks, not only the current page. | New |
| FR-TASK-11 | Tasks that have been in Trash for more than 30 days are permanently deleted by a daily job. A missed run catches up on the next run. | New |
| FR-TASK-12 | Tasks in Trash are excluded from the task list, details, edit, toggle, search, filters, sort, pagination and dashboard counts. Normal task endpoints return 404 for them. | New |
| FR-ORG-3 | Filter by priority, selecting one or more of Low, Medium and High. No selection means all priorities. | Updated |
| FR-ORG-7 | Filters apply immediately. Search input is debounced. Changing any search, filter or sort resets to page 1. | New |

## Non-functional requirements

New and updated items only; the rest of section 1.5 stands.

| ID | Requirement | Change |
| --- | --- | --- |
| NFR-SEC-1 | Rate limits: login, 5 failed attempts per email + IP per 15 minutes, then a 15-minute block for that combination. Resend verification and forgot password, 3 requests per email per hour, with the normal generic response when the limit is hit. | New |
| NFR-SEC-2 | Tokens are generated with a cryptographically secure random generator (at least 32 bytes). | New |
| NFR-SEC-3 | Links in emails are built from a configured base URL (environment variable), never from the incoming request's Host header. | New |
| NFR-SEC-4 | URLs containing tokens are never written to logs. Pages that receive tokens send the header `Referrer-Policy: no-referrer`. | New |
| NFR-SEC-5 | Login for an unknown email takes about as long as for a known one (run a dummy bcrypt comparison). | New |
| NFR-SCALE-1 | Rate-limit counters are kept in the backend's memory. This is valid only while TaskFlow runs as a single backend server; counters must move to a shared store such as Redis before a second instance is added. | New |
| NFR-REL-1 | Scheduled jobs (Trash purge, unverified-account cleanup) run once daily inside the backend and are idempotent: each run deletes only records matching the rule at that moment, so repeated runs delete nothing extra, and missed runs are caught up by the next one. | New |
| NFR-MAINT-1 | All active-task queries go through one shared function that excludes trashed tasks. | New |
| NFR-MAINT-2 | Email sending sits behind one interface, so switching between Mailpit (development) and a real provider is configuration only. | New |
| NFR-TEST-1 | Tests cover: a trashed task appears in no active view; every token rule (expiry, single use, invalidation); every rate limit; JWT rejection on a missing or old `tokenVersion`; a fresh login right after a reset succeeding; job idempotency. | New |

## User stories

| ID | Story | Covers | Change |
| --- | --- | --- | --- |
| US-01 | As a guest, I want to register so that I get a private account. | FR-AUTH-1, 2, 3, 8 | Updated |
| US-02 | As a verified user, I want to log in so that I can access my tasks. | FR-AUTH-4, 10, NFR-SEC-1 | Updated |
| US-08 | As a user, I want to move a task to Trash so that my list stays clean without losing it for good. | FR-TASK-4 | Updated |
| US-15 | As a guest, I want to verify my email so that I can start using my account. | FR-AUTH-9, 15, 16 | New |
| US-16 | As a guest, I want to request a new verification email so that I can verify even if the first one was lost or expired. | FR-AUTH-11, 18 | New |
| US-17 | As a user, I want to reset a forgotten password so that I can get back into my account. | FR-AUTH-12, 13, 14, 15, 16 | New |
| US-18 | As a user, I want to see my Trash so that I know what I deleted and when it will be gone. | FR-TASK-7 | New |
| US-19 | As a user, I want to restore a task from Trash so that I can undo a mistaken delete. | FR-TASK-8 | New |
| US-20 | As a user, I want to permanently delete a task from Trash so that it's gone for good when I'm sure. | FR-TASK-9 | New |
| US-21 | As a user, I want to empty my Trash so that I can clear everything at once. | FR-TASK-10 | New |

The 30-day purge (FR-TASK-11) and unverified-account cleanup (FR-AUTH-17) are system behaviour, not user goals, so they're tested directly from their FRs.

## Acceptance criteria: authentication

### US-01 Register (updated)

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-01.1 | Valid details and a new email | I submit | An unverified account is created, a verification email is sent, and I see "Check your email to continue" |
| AC-01.2 | An email that already has a verified account (any letter case) | I submit | I see the same message as AC-01.1, no account is created, and the owner gets an "account already exists" email with a reset link |
| AC-01.3 | An email that has an unverified account | I submit | I see the same message, the verification email is resent, and the stored name and password are unchanged |
| AC-01.4 | A password that breaks the rules | I submit | I see what's wrong and the form isn't sent |
| AC-01.5 | A successful registration | The database is checked | The password column holds a bcrypt hash and `emailVerifiedAt` is null |
| AC-01.6 | The email service fails | I submit valid details | The account still exists and I can request a new verification email |

### US-02 Log in (updated)

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-02.1 | A verified account and correct credentials | I log in | I'm taken to the dashboard |
| AC-02.2 | A wrong email or wrong password | I log in | I see "Invalid email or password" |
| AC-02.3 | An unverified account and the correct password | I log in | I see "Please verify your email first" with a resend option, and receive no JWT |
| AC-02.4 | An unverified account and a wrong password | I log in | I see "Invalid email or password" |
| AC-02.5 | 5 failed attempts for one email from one IP within 15 minutes | I try again | I'm blocked for 15 minutes; the same email from another IP is not blocked |
| AC-02.6 | I'm logged in | I visit /login | I'm redirected to the dashboard |

### US-15 Verify email

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-15.1 | A valid, unused verification link | I open it | I see a page with a "Verify my email" button; nothing is verified yet |
| AC-15.2 | That page | I click the button | My email is verified, the token is marked used, and I'm sent to login with a success message |
| AC-15.3 | A link older than 30 minutes | I use it | I see "This link has expired" with a button to request a new one |
| AC-15.4 | A link that was already used, and my email is verified | I open it | I see "Your email is already verified" with a link to login |
| AC-15.5 | A link with a made-up or altered token | I use it | I see "This link is invalid" with a way to request a new one |
| AC-15.6 | I requested a second verification email | I use the first link | It's rejected as invalid; only the newest link works |

### US-16 Resend verification

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-16.1 | Any email (unverified, verified or unknown) | I request a resend | I see the same generic message; only an unverified account gets an email |
| AC-16.2 | 3 requests for one email within an hour | I request again | I see the same generic message and no email is sent |

### US-17 Reset password

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-17.1 | Any email | I submit "forgot password" | I see "If an account exists with this email address, you will receive instructions to reset your password." Only an existing account gets an email |
| AC-17.2 | A valid reset link | I set a new password that meets the rules | My password changes, my `tokenVersion` goes up by 1, I get a "Your password was changed" email, and I'm redirected to login |
| AC-17.3 | A valid reset link | I enter a password that breaks the rules | I see what's wrong; the token stays usable and `tokenVersion` is unchanged |
| AC-17.4 | The link was already used, or is older than 30 minutes | I open it | I see a clear expired or used message with a way to request a new link |
| AC-17.5 | I was logged in on another device before the reset | That device calls any task endpoint, even within the same second as the reset | The API returns 401 |
| AC-17.6 | My account was unverified | I complete a password reset | My email is marked verified and I can log in |
| AC-17.7 | 3 reset requests for one email within an hour | I request again | I see the same generic message and no email is sent |
| AC-17.8 | A reset page is opened | The server logs are checked | The token does not appear in any log line |
| AC-17.9 | I just completed a reset | I log in immediately with the new password | Login succeeds and task endpoints accept my new JWT |
| AC-17.10 | A JWT with no `tokenVersion` claim, or a version lower than mine | It's used on any task endpoint | The API returns 401 |
| AC-17.11 | The database fails partway through a reset | The reset is attempted | Nothing changes: old password, old `tokenVersion`, token still unused |

## Acceptance criteria: delete and Trash

### US-08 Move to Trash (updated)

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-08.1 | My task, on the task list or the details page | I choose Delete | A confirmation dialog asks me to confirm moving it to Trash |
| AC-08.2 | The confirmation dialog | I confirm | After the server confirms, the task leaves my list, appears in Trash, and I see "Task moved to Trash" |
| AC-08.3 | The confirmation dialog | I cancel | The task is unchanged and stays in my list |
| AC-08.4 | A task belonging to another user | I try to move it to Trash by ID | The API returns 404 and the task is unchanged |
| AC-08.5 | No token or an expired token | I try to move a task to Trash | The API returns 401 and nothing changes |
| AC-08.6 | A task ID that doesn't exist or is already in Trash | I call the move-to-Trash endpoint | The API returns 404; the UI shows "This task no longer exists" |
| AC-08.7 | The server fails during the request | I confirm | I see an error message and the task stays in my list |
| AC-08.8 | A task in Trash | I check the list, search, filters, details, edit, toggle and dashboard | It appears in none of them; its details, edit and toggle endpoints return 404 |

### US-18 View Trash

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-18.1 | Several tasks in my Trash | I open Trash | They show newest-deleted first, paginated, with the 30-day banner and a countdown on each |
| AC-18.2 | An empty Trash | I open Trash | I see an empty-state message |
| AC-18.3 | Another user has tasks in Trash | I open Trash | Only my own trashed tasks appear |

### US-19 Restore

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-19.1 | A Completed High-priority task in Trash | I restore it | It returns to my task list still Completed and High priority, and leaves Trash |
| AC-19.2 | A task in another user's Trash | I try to restore it by ID | The API returns 404 |
| AC-19.3 | An active task (not in Trash) | I call the restore endpoint for it | The API returns 404 |

### US-20 Permanently delete

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-20.1 | A task in my Trash | I choose Delete permanently | A dialog warns that the task will be permanently deleted and cannot be recovered |
| AC-20.2 | That dialog | I confirm | After the server confirms, the task is removed from the database and I see "Task permanently deleted" |
| AC-20.3 | That dialog | I cancel | The task stays in Trash |
| AC-20.4 | An active task | I call the permanent-delete endpoint for it | The API returns 404 and the task is unchanged |
| AC-20.5 | A task in another user's Trash | I call the permanent-delete endpoint for it | The API returns 404 and the task is unchanged |

### US-21 Empty Trash

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-21.1 | 23 tasks in my Trash across 3 pages | I choose Empty Trash | The dialog says 23 tasks will be permanently deleted and this cannot be undone |
| AC-21.2 | That dialog | I confirm | All 23 are permanently deleted, my active tasks and other users' Trash are untouched, and I see a success message |
| AC-21.3 | An empty Trash | I view Trash | The Empty Trash button is disabled |

### Automatic purge (FR-TASK-11)

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-P.1 | Tasks moved to Trash 31 days ago and 29 days ago | The daily job runs | The 31-day task is permanently deleted; the 29-day task remains |
| AC-P.2 | The job already ran today | It runs again | Nothing breaks and nothing extra is deleted |
| AC-P.3 | A task deleted 35 days ago but restored yesterday | The job runs | The task is untouched, because it is no longer in Trash |
| AC-P.4 | Active tasks of any age | The job runs | None are deleted |

### Unverified-account cleanup (FR-AUTH-17)

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-C.1 | An unverified account 8 days old and one 6 days old | The daily job runs | The 8-day account and its tokens are deleted; the 6-day account remains |
| AC-C.2 | A verified account 8 days old | The job runs | It is untouched |
| AC-C.3 | The job already ran today | It runs again | Nothing breaks and nothing extra is deleted |

## Security decisions explained

Most of these decisions protect against one of three attacks: finding out who has an account, guessing or stealing a way in, and staying in after the owner has locked the door.

### 1. Don't reveal who has an account

Attackers collect lists of valid emails to target with phishing or password guessing. Any page that answers differently for "exists" and "doesn't exist" hands them that list. So registration, resend verification and forgot password all give the same answer, and the real information goes to the inbox, which only the owner can read.

The "verify your email first" message is the one exception, and it's safe: it only appears after the correct password, which only the owner knows.

### 2. Rate limiting

Without limits, a script can try thousands of passwords a minute, or use your forgot-password form to flood someone's inbox. Limits make guessing too slow to be worthwhile.

We limit by email + IP rather than locking the account. Otherwise an attacker could lock *you* out just by failing 5 times with your email.

### 3. Tokens: random, hashed, short-lived, single-use

A reset link works like a temporary key to the account, so we treat it like one.

- **Random:** it must be impossible to guess, so it comes from a secure random generator, not a timestamp or user ID.
- **Hashed:** if someone steals a database backup, they get hashes, not working links. It's the same idea as password hashing.
- **SHA-256, not bcrypt:** bcrypt is deliberately slow so that guessable passwords take ages to crack. A 32-byte random token can't be guessed anyway, so a fast hash is enough, and it lets us look the token up directly.
- **30 minutes, single use, newest only:** every rule shrinks the window in which a leaked link is useful.

### 4. Logging out stolen sessions after a reset

A JWT is like a signed day pass: the server checks the signature, not a list. That makes it fast, but the server can't take a pass back once it's issued.

The typical reason someone resets a password is that they think someone else got in. If old passes kept working for up to an hour, the attacker would stay in. So each pass now carries a version number, `tokenVersion`, and a reset bumps the user's number. The server rejects any pass whose number doesn't match. Think of it as changing the locks: every old key stops working at once, and the new key handed out at the next login fits. Unlike comparing times, there is no tie, so no old key can slip through in the same second. Refresh tokens, if we add them, must be revoked for the same reason.

### 5. The "your password was changed" email

If an attacker resets your password, this email is how you find out. It turns a silent takeover into one you can act on.

### 6. Keeping tokens out of logs and referrers

A reset URL contains the key. Logs are read by many people and tools, so the URL must not land there. When a page links to another site, the browser can send the current URL along as the "referrer"; the no-referrer header stops that.

### 7. Building email links from configuration

If the server built links from the Host header of the incoming request, an attacker could send a forgot-password request with a fake host. The victim would get a real email from TaskFlow containing a link to the attacker's site, carrying a valid token. Building links from a fixed setting closes that door.

### 8. Cleaning up unverified accounts

Someone could register your email before you do. Because they can't verify it, the account sits unused. Deleting unverified accounts after 7 days frees the email for its real owner.

## Limitations and future improvements

The initial version makes five deliberate simplifications. Each is safe at TaskFlow's current size and has a known upgrade path.

| Limitation in the initial version | When it becomes a problem | Future improvement |
| --- | --- | --- |
| Rate-limit counters live in one server's memory and reset on restart. | When a second backend instance is added, or if restarts become frequent. | Move counters to Redis, shared by all instances. |
| Scheduled jobs run inside the backend process. | With several instances, each would run the job; the jobs are idempotent, so this is wasteful rather than harmful. | Run jobs in one dedicated worker, or use a scheduler with a lock so only one instance runs them. |
| Logout is client-side only: the JWT is discarded by the browser but stays valid until it expires (up to 1 hour). | If a token is copied before logout, for example on a shared computer. | Add "Log out of all devices" by incrementing `tokenVersion`, or keep a short list of revoked tokens. |
| One access JWT with a 1-hour lifetime; no refresh tokens. | Users are logged out every hour. | Short-lived access tokens plus refresh tokens. A password reset must revoke all refresh tokens (FR-AUTH-14). |
| Every request reads the user record to check `tokenVersion`. | Only at very high traffic. | Cache the version briefly, accepting a short delay before revocation takes effect. |
