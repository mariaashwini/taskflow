# Building Software with Claude: A Practical Handbook

A reusable guide for taking any project idea, such as a task manager, a grocery delivery app, an online shop or a library system, from first idea to a deployed application, using Claude chat and Claude Code.

Examples from **TaskFlow** (a task manager built this way) appear in boxes marked **Example**. They illustrate the process; your next project can use completely different features and technologies.

---

## 1. The big picture

### The stages

| # | Stage | You end with |
| --- | --- | --- |
| 1 | Idea | A clear one-paragraph description |
| 2 | Requirements | Numbered features, rules, user stories |
| 3 | Requirements review | Approved requirements |
| 4 | Architecture | Approved stack, design and milestones |
| 5 | Environment setup | A computer ready to build |
| 6 | Claude Code setup | A project folder Claude Code understands |
| 7 | Development | Working features, one milestone at a time |
| 8 | Code review | Changes you understand and approve |
| 9 | Testing and debugging | Proof that it works |
| 10 | Git and GitHub | Safe history of every change |
| 11 | Documentation | Up-to-date docs and progress |
| 12 | Deployment | The app running for real users |

**The golden rule:** decide *what* to build before *how*, and decide *how* before writing code. Fixing a mistake in a document costs minutes; fixing it in code costs days.

### Which tool for which job

| Tool | Use it for | Don't use it for |
| --- | --- | --- |
| **Claude chat** (app or browser) | Thinking: requirements, architecture, explaining concepts, reviewing plans, second opinions | Changing files on your computer (it can't reach them) |
| **Claude Code** (in a terminal) | Doing: creating and editing project files, running commands, installing packages, running tests | Long-term planning without documents to work from |
| **PowerShell / Terminal** | Starting Claude Code, quick checks (`node -v`), running the app | Editing code by hand |
| **VS Code** | Reading and reviewing code, viewing diffs, small manual edits | Replacing your review of what Claude Code did |
| **Browser** | Using the running app, reading docs, GitHub | |
| **Git and GitHub** | Saving history, branches, pull requests, CI checks | Storing secrets (never) |

**How chat and Claude Code work together:** they don't share memory. Chat produces the documents; you save them in your project's `docs/` folder; Claude Code reads them. When Claude Code produces something you're unsure about, paste it into chat for a second opinion.

---

## 2. Stage 1: Start with an idea

Write a short description: who it's for, the main problem it solves, and the few things a user must be able to do. Don't worry about technology yet.

**Prompt:**

```text
Act as an experienced Business Analyst. I want to build [one-paragraph idea].
Ask me questions, a few at a time, to understand the users, their goals, the main
features and the business rules. Don't suggest technology yet. When you have enough,
summarize your understanding and list anything still unclear.
```

**Why "a few at a time":** answering 30 questions at once leads to rushed answers.

---

## 3. Stage 2: Requirements gathering

Good requirements documents contain:

| Part | What it is | Example of the idea |
| --- | --- | --- |
| **Functional requirements** | What the app does, each with an ID | `FR-ORDER-3: A customer can cancel an order before it ships.` |
| **Data rules** | Limits and formats | "Title required, 1–100 characters" |
| **Non-functional requirements** | How well: security, speed, usability | "List loads in under 500 ms" |
| **User stories** | *As a [user], I want [goal], so that [benefit]* | |
| **Acceptance criteria** | *Given / When / Then* checks that become tests | "Given an expired link, when I open it, then I see 'Link expired'" |
| **Assumptions** | Anything decided without you, marked for approval | |

**IDs matter.** They link requirements to tests, commits and pull requests, so you can always trace why a piece of code exists. This is called *traceability*.

**Prompt:**

```text
Turn what we agreed into a requirements document: numbered functional requirements
by area, data rules, non-functional requirements, user stories with Given/When/Then
acceptance criteria for the important ones, and a list of assumptions for me to approve.
Mark every assumption clearly. Don't invent features I didn't ask for.
```

> **Example (TaskFlow):** The first draft assumed "delete" removed a task permanently. Asking "should deleted tasks be recoverable?" turned it into a Trash feature with 30-day recovery. That's a business decision only you can make, which is why assumptions must be marked.

---

## 4. Stage 3: Review and approve requirements

**Checklist:**

- [ ] Every feature you need is there; nothing you don't need is
- [ ] Error cases are covered (wrong input, server down, no data, someone else's data)
- [ ] Security cases are covered (not logged in, wrong user, repeated attempts)
- [ ] No two rules contradict each other
- [ ] Every assumption is approved or changed
- [ ] You can explain each requirement in your own words

**Get a critical second look:**

```text
Act as a QA engineer. Find gaps, contradictions and missing edge cases in these
requirements. Don't rewrite them; list issues only, most serious first.
```

Then **judge each issue yourself**: AI reviews contain good catches and irrelevant ones. Decide, then record the decision in the document. Save the approved version with a version number (v1, v2…).

> **Example (TaskFlow):** A review caught that the login page hid whether an email was registered, but the registration page revealed it ("Email already in use"). Small contradictions like this are much cheaper to fix on paper.

---

## 5. Stage 4: Technical architecture

**Prompt:**

```text
Act as a Solution Architect. Based on these approved requirements, recommend a
technology stack and architecture. For each important decision, give the options,
your recommendation and the reason in beginner-friendly language. Cover: frontend,
backend, database, security, folder structure, API design, testing strategy, and
a milestone plan where each milestone delivers one working feature end to end.
List every decision I need to approve. Don't add technology without explaining why.
```

**What a good architecture document contains:** the stack with versions; how the parts connect (a diagram helps); the database tables; the API endpoints; security choices; testing strategy; milestones; and a **decisions table** (D1, D2…) you approve one by one.

**Two habits that save pain:**

1. **Check versions are current.** Tools release new major versions often. Ask Claude to search for current versions before you approve a stack, and ask Claude Code to check again before installing.
2. **Review in rounds.** Ask a fresh QA-style review of the architecture too. Expect a second round of corrections; that's normal.

> **Example (TaskFlow):** The first architecture recommended one database version. A review found the vendor had shortened support for that version, so an older long-term release was actually supported longer. Always check facts that change over time.

**Sign-off:** before coding, write a short sign-off: approved documents and versions, confirmed scope, out-of-scope list, outstanding decisions (should be none).

---

## 6. Stage 5: Environment setup

**Checklist:**

- [ ] **Runtime** your stack needs (e.g. Node.js, Python, Java), at the approved version
- [ ] **Git** installed, and a **GitHub** account
- [ ] **VS Code** (or another editor)
- [ ] **Database** installed and configured, *or* Docker to run it
- [ ] **Claude Code** installed and signed in
- [ ] A project folder, e.g. `D:\Projects\my-app`

**Verify each tool in a new terminal:** `node -v`, `git --version`, `claude --version`, and your database client's version command.

**Database setup basics (any project):**

- Create a **dedicated database user** for the app. Never let the app use the admin (root) account.
- Create **two databases**: one for development, one for automated tests. Tests wipe data; keep them away from data you're using.
- Apply the server settings your architecture requires (time zone, character set) and **verify them with a query**, not by assuming.
- Keep the database reachable **only from your computer** during development.

**Windows lessons:**

| Problem | Cause | Fix |
| --- | --- | --- |
| "command not recognized" after installing | The tool's folder isn't on PATH | Add the folder to PATH, then **open a new terminal** |
| Works in Command Prompt but not PowerShell | You were *inside* the program's folder; PowerShell doesn't run programs from the current folder without `.\` | Fix PATH |
| Wrong version runs | Two installs; the other comes first on PATH | `where.exe <tool>` shows which one runs |
| Settings file edits do nothing | Edited the wrong file, wrong section, or didn't restart | Find the file the service really reads; restart; verify with a query |

> **Example (TaskFlow):** The computer had two database installs. The app's database turned out to run on port 3307 inside WampServer, while 3306 belonged to a different server. Checking `SELECT @@version, @@port;` avoided connecting to the wrong one.

---

## 7. Stage 6: Claude Code setup

### Prepare the project folder

```text
my-app/
├── CLAUDE.md        ← brief that Claude Code reads automatically every session
└── docs/
    ├── requirements.md
    ├── architecture.md
    └── PROJECT_DEVELOPMENT_GUIDE.md   ← this handbook
```

**Export documents carefully:** if a document has several tabs or sections, check each exported file contains what you expect before relying on it.

**What `CLAUDE.md` should contain** (ask Claude chat to draft it):

- One paragraph about the project and the current milestone
- A table of documents in `docs/` and which one wins if they disagree
- **How you want to work:** step by step, stop for review, explain decisions, never add unrequested features or packages, stop and explain if the plan doesn't work as written
- The approved stack and key rules
- Your machine's specifics (ports, paths, unusual setup)

### Start a session

```powershell
cd D:\Projects\my-app
claude                 # new session
claude --continue      # continue the most recent session in this folder
```

Type `/exit` to leave.

### Permission modes

| Mode | What runs without asking | When to use |
| --- | --- | --- |
| **Manual** (`default`) | Reading files only | **While learning**, sensitive work |
| Accept edits | File edits too | When you review with `git diff` afterwards |
| Plan | Reading and exploring; no edits until you approve a plan | Big or unclear changes |
| Auto | Most things, checked by a safety classifier | Experienced users, routine work |

Switch with **Shift+Tab**, or make Manual the default for a project in `.claude/settings.json`:

```json
{ "permissions": { "defaultMode": "default" } }
```

**Test it:** ask Claude Code to create a test file; in Manual mode it must ask first. Say No.

### Answering permission prompts

| Approve | Read carefully first | Say No and ask why |
| --- | --- | --- |
| Read-only commands: versions, `npm view`, `git status`, `git diff`, listing files | Installs, file edits, commits | Deletes, anything outside the project folder, anything you don't understand |

Avoid broad "don't ask again" options (like "all npm commands") while learning. They would also allow installs and publishing.

**The first prompt of any project:**

```text
Read CLAUDE.md and everything in docs/. Summarize what the current milestone includes
and excludes, list anything in the plan that won't work as written with today's tool
versions, and wait for my go-ahead before creating or editing any file.
```

> **Example (TaskFlow):** This first prompt alone caught three problems before any file existed: the wrong Node.js version installed, a too-new TypeScript release the lint tools didn't support yet, and a document exported from the wrong tab.

---

## 8. Stage 7: Develop in milestones

**Milestone 0 is the foundation:** projects created, tools configured, database connected, one health check, tests and CI running, but no features. Then each milestone adds **one feature end to end** (database, backend, frontend, tests). This is called a *vertical slice*. You get something working early, and problems show up while they're small.

### The loop for every step

1. **Ask for a plan.** *"Do step X only. First tell me what you'll create or change and why."*
2. **Approve or adjust** the plan.
3. **Let it work**, approving each action.
4. **Review** the result (Stage 8).
5. **Test** (Stage 9).
6. **Commit** (Stage 10).
7. Move to the next step.

**Useful prompts:**

```text
Do step [n] of milestone [M] only, as described in docs/. Tell me your plan first and
wait for my approval. Stop after the step and summarize what you created and why.
```

```text
Explain this change as if I'm a beginner: what each new file does, how the pieces
connect, and which requirement IDs it covers.
```

```text
The plan says [X], but you're proposing [Y]. Why? What are the options and trade-offs?
```

**Stay in scope.** If Claude Code proposes something not in the plan, ask why. Accept it only if it's genuinely needed, and record the decision.

---

## 9. Stage 8: Review AI-generated code

You don't need to understand every line, but you must understand **what changed and why**.

**Checklist:**

- [ ] I know which files were added, changed or deleted (`git status`, `git diff`, or VS Code's Source Control view)
- [ ] The change matches the plan and the requirement IDs
- [ ] No new packages or features I didn't approve
- [ ] No secrets, passwords or keys in code
- [ ] Errors are handled; nothing obviously skipped (empty catch blocks, commented-out tests)
- [ ] Tests were added or updated, and they pass
- [ ] I can explain the change in one or two sentences

**Prompts:**

```text
Review your own changes against the requirements and architecture. List anything
missing, risky or inconsistent. Don't fix anything yet.
```

```text
Walk me through the diff file by file. Flag anything you're unsure about.
```

For important changes, paste the summary or diff into **Claude chat** for an independent second opinion. If a change is wrong, say so specifically; you can reject it and ask for another approach.

---

## 10. Stage 9: Test and debug

| Test type | Checks | Typical tools |
| --- | --- | --- |
| Unit | One function or rule | The project's test runner |
| Integration | Code + real database | Test runner with the test database |
| API end-to-end | Whole backend through HTTP | Supertest-style tools, Postman |
| Component | One screen or widget | React Testing Library or similar |
| Manual | Real use in the browser | You |

**Always test the unhappy paths:** wrong input, not logged in, someone else's data, empty lists, server down.

### Debugging with Claude Code

1. **Reproduce** the problem and copy the **exact** error message.
2. Give it to Claude Code:

```text
This fails: [command or steps]. Exact error: [paste]. Expected: [what should happen].
Investigate the cause first and explain it. Don't change any code until I agree.
```

3. **Approve the fix only once the cause makes sense to you.**
4. **Ask for a test** that would have caught the bug, so it can't return.

**Investigate before fixing.** A fix without a known cause often hides the real problem.

---

## 11. Stage 10: Git and GitHub

**Simple, safe workflow:**

1. `main` always works. Protect it on GitHub so changes arrive only through pull requests.
2. One branch per milestone or feature: `m2-login`, `fix-date-display`.
3. Small commits with clear messages: `type: summary (IDs)`, e.g. `feat: cancel order (FR-ORDER-3)`. Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`.
4. Open a pull request; CI (automatic checks on GitHub) must pass; review; merge.

**Never commit:** `.env` files and other secrets, `node_modules` or other installed dependencies, build output. A `.gitignore` file handles this; check it early.

**Always commit:** the lock file (e.g. `package-lock.json`), so everyone installs identical versions, and example config files (`.env.example`).

**Prompt:**

```text
Show me git status, then propose a commit message for these changes with the
requirement IDs. Don't commit until I approve.
```

**Never approve without thinking:** force pushes, `git reset --hard`, or deleting branches. They can destroy work.

---

## 12. Stage 11: Documentation and continuity

**Keep these up to date:**

| Document | Updated when |
| --- | --- |
| Requirements (versioned) | A business rule changes, with your approval |
| Architecture and decisions | A technical decision changes |
| `CLAUDE.md` | Current milestone, working rules or machine setup changes |
| `docs/PROGRESS.md` (optional) | After each step: done, next, open questions |
| This handbook | You learn a practice useful for *future* projects |

**Continuing across sessions:** Claude Code starts each new session fresh, except for what's in files. So before you stop:

```text
Update docs/PROGRESS.md: what we finished, what's next, and any open decisions.
```

Next time, use `claude --continue`, or start fresh with:

```text
Read CLAUDE.md and docs/PROGRESS.md and tell me where we are and what's next.
```

**When documents and code disagree,** decide which is right, then fix the other. Never leave them contradicting each other.

---

## 13. Stage 12: Deployment

**Before the first release:**

- [ ] Choose hosting for the app and the database, and an email service if needed
- [ ] Separate **production settings**: real secrets stored in the host's secret storage, never in files or Git
- [ ] Encrypted connections (HTTPS for users; TLS for the database)
- [ ] Database changes applied through **migrations**, never by hand
- [ ] A **health check** endpoint the host can monitor
- [ ] Backups of the production database, with a tested restore
- [ ] Logs that don't contain passwords or tokens
- [ ] A **rollback plan**: how to return to the previous version if something breaks

**Prompt (chat, then Claude Code):**

```text
Act as a DevOps engineer. Given our architecture, compare 2–3 hosting options for a
small production deployment: cost, effort and limits. Then give me a step-by-step
deployment checklist including secrets, database migrations, monitoring and rollback.
```

Deploy first to a **staging** (test) environment that mirrors production, then to production.

---

## 14. Lessons worth remembering

| Lesson | Why |
| --- | --- |
| Ask Claude Code to summarize and find problems before it changes anything | Catches wrong versions, missing files and misunderstandings early |
| Use Manual mode while learning | You see every action before it happens |
| Verify, don't assume | A config edit or install isn't done until a command proves it |
| One step at a time, then stop | Small changes are easy to review and undo |
| Separate dev and test databases | Tests destroy data |
| Record decisions with IDs | You'll forget why something was chosen |
| Get a second opinion on important changes | AI is confident even when wrong |
| Open a new terminal after installing tools | Old terminals don't see PATH changes |
| Check current versions before installing | Tools change faster than plans |

---

*Keep this handbook short. When adding a lesson, replace or merge outdated content instead of growing it. Record only practices useful for future projects, not details of one project.*
