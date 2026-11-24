# TaskFlow Requirements v1 (Phase 1)

Status: approved in Phase 1, as amended by Requirements v2 (17 November 2026). Where v2 changes an item, v2 applies.

## 1.3 Functional requirements

Each requirement has an ID. Later, user stories, tasks, tests and commits will refer to these IDs. That link from requirement to test is called traceability.

### Authentication (AUTH)

- FR-AUTH-1: A guest can register with name, email and password.
- FR-AUTH-2: Email must be unique (case-insensitive).
- FR-AUTH-3: Passwords are stored only as a hash, never as plain text.
- FR-AUTH-4: A user can log in with email and password and receives a JWT.
- FR-AUTH-5: A user can log out.
- FR-AUTH-6: Task pages are reachable only when logged in. Guests are redirected to login.
- FR-AUTH-7: Every task API endpoint rejects requests without a valid token (401).

### Tasks (TASK)

- FR-TASK-1: A user can create a task with title (required), description (optional), priority and due date (optional).
- FR-TASK-2: A user can view a list of their tasks and the details of one task.
- FR-TASK-3: A user can edit any field of their own task.
- FR-TASK-4: A user can delete their own task, after a confirmation step.
- FR-TASK-5: A user can toggle a task between Pending and Completed.
- FR-TASK-6: A user can never read, edit or delete another user's task.

### Organization (ORG)

- FR-ORG-1: Search tasks by text in the title or description.
- FR-ORG-2: Filter by status (All / Pending / Completed).
- FR-ORG-3: Filter by priority (All / Low / Medium / High).
- FR-ORG-4: Sort by due date, creation date or priority, ascending or descending.
- FR-ORG-5: Results are paginated.
- FR-ORG-6: Search, filters, sort and pagination can be combined.

### Dashboard (DASH)

- FR-DASH-1: Show counts of Total, Pending, Completed and Overdue tasks for the logged-in user.

## 1.4 Data rules

| Field | Rule |
| --- | --- |
| Title | Required, 1–100 characters, spaces trimmed |
| Description | Optional, maximum 1,000 characters |
| Priority | LOW, MEDIUM or HIGH. Default is MEDIUM. |
| Status | PENDING or COMPLETED. Default is PENDING. |
| Due date | Optional, date only (no time). Past dates are allowed. |
| Overdue | Due date is before today and status is PENDING |
| Password | At least 8 characters, with at least one letter and one number |
| Page size | 10 by default, 50 at most |

- "Overdue" depends on whose "today" is meant. Due dates are stored as date-only values and compared against the user's local date. (Finalized as architecture decision D16: the frontend sends the user's local date.)
- Accessing another user's task returns 404 Not Found, not 403 Forbidden. A 403 would confirm that the task exists, which leaks information.

## 1.5 Non-functional requirements

- **Security:** passwords hashed with bcrypt; JWT expires after 1 hour; secrets only in environment variables; all input validated on the server, because client-side validation is for user experience, not security.
- **Performance:** task list API responds in under 500 ms for a user with 1,000 tasks.
- **Usability:** responsive from 360 px (phone) to desktop; every data view has loading, empty and error states.
- **Reliability:** clear error messages; the backend never returns stack traces to the client.
- **Maintainability:** strict TypeScript, ESLint and Prettier, consistent folder structure.
- **Testability:** at least 70% coverage on backend services, with tests for every authorization rule.

## 1.6 User stories and acceptance criteria

| ID | Story |
| --- | --- |
| US-01 | As a guest, I want to register so that I get a private account. |
| US-02 | As a guest, I want to log in so that I can access my tasks. |
| US-03 | As a user, I want to log out so that others on my device can't see my tasks. |
| US-04 | As a user, I want my tasks to be invisible to everyone else so that my data stays private. |
| US-05 | As a user, I want to create a task with details so that I can record what I need to do. |
| US-06 | As a user, I want to see my task list so that I know what's on my plate. |
| US-07 | As a user, I want to edit a task so that I can fix or update it. |
| US-08 | As a user, I want to delete a task so that my list stays clean. |
| US-09 | As a user, I want to mark tasks completed or pending so that I can track progress. |
| US-10 | As a user, I want to search tasks so that I can find one quickly. |
| US-11 | As a user, I want to filter by status and priority so that I can focus. |
| US-12 | As a user, I want to sort tasks so that urgent ones come first. |
| US-13 | As a user, I want pagination so that long lists stay manageable. |
| US-14 | As a user, I want a dashboard summary so that I see my workload at a glance. |

### US-01 Register

Superseded by Requirements v2 (US-01 updated).

1. Given valid details, when I submit, then my account is created and I'm taken to the login page with a success message.
2. Given an email that's already registered (in any letter case), when I submit, then I see "Email already in use" and no account is created.
3. Given a password that breaks the rules, when I submit, then I see what's wrong and the form isn't sent.
4. Given a successful registration, when the database is checked, then the password column contains a hash, not my password.

### US-02 Log in

Superseded by Requirements v2 (US-02 updated).

1. Given correct credentials, when I log in, then I'm taken to the dashboard.
2. Given a wrong email or a wrong password, when I log in, then I see the same message: "Invalid email or password". This avoids revealing which emails are registered.
3. Given I'm logged in, when I visit /login, then I'm redirected to the dashboard.

### US-04 Data isolation (the most important story)

1. Given users A and B, when A requests the task list, then only A's tasks are returned.
2. Given task T belongs to B, when A requests, updates or deletes T by its ID, then the API returns 404 and T is unchanged.
3. Given no token or an expired token, when any task endpoint is called, then the API returns 401.

### US-05 Create task

1. Given a valid title, when I save, then the task appears in my list with status Pending and priority Medium unless I chose otherwise.
2. Given an empty or whitespace-only title, when I save, then I see "Title is required".
3. Given the server is down, when I save, then I see an error message and my form input isn't lost.

### US-08 Delete a task

Superseded by Requirements v2 (US-08 is now "Move to Trash", AC-08.1 to AC-08.8).

### US-11 Filter tasks

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-11.1 | I have Pending and Completed tasks | I select the Pending status filter | Only Pending tasks are displayed |
| AC-11.2 | I have tasks with Low, Medium and High priorities | I select High priority | Only High-priority tasks are displayed |
| AC-11.3 | I have tasks with different statuses and priorities | I select Pending and High priority together | Only tasks matching both conditions are displayed |
| AC-11.4 | A filter is currently applied | I clear the filter | All my tasks are displayed again |
| AC-11.5 | I apply a filter that matches no tasks | The filtering request completes | An appropriate empty-state message is displayed instead of an error |
| AC-11.6 | Another user has tasks matching my selected filters | I apply a filter | Only my own matching tasks are returned |
| AC-11.7 | I am logged out or my token has expired | I attempt to filter tasks | The API returns 401 and no private task data is returned |
| AC-11.8 | I select an unsupported status or priority value through a modified API request | The filtering request reaches the backend | The API returns 400 Bad Request and does not return unfiltered task data |

Decisions: filters apply immediately; multiple priorities can be selected; changing filters resets pagination to page 1 (recorded in v2 as FR-ORG-3 and FR-ORG-7).

### US-14 Dashboard

1. Given 5 tasks (2 completed, 3 pending, 1 of which is past its due date), when I open the dashboard, then I see Total 5, Completed 2, Pending 3, Overdue 1. An overdue task is also counted as pending.
2. Given no tasks, when I open the dashboard, then all counts show 0 and I see a prompt to create my first task.

## Phase 1 decisions

- Assumptions 1 to 7 approved, including JWT expiry of 1 hour and 70% backend service coverage.
- Password reset and email verification added to scope (specified in Requirements v2).
- Deleted tasks are recoverable; a confirmation is shown every time; a deleted task disappears only after the server confirms (specified in Requirements v2).
