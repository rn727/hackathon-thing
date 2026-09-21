# AGENTS.md

## Project Context

This repository is for a 3-person, 3-day hackathon project.

We are building a finance-oriented web app that helps parents motivate kids to complete schoolwork by tying tasks to monetary rewards.

The intended product flow is:

1. Parent creates a task with a reward.
2. Kid sees available tasks.
3. Kid claims a task.
4. Kid marks the task complete.
5. Parent approves or rejects the task.
6. If approved, the kid's in-app balance increases.
7. Parent can view the kid's balance and spending activity.
8. Plaid Sandbox may be used to show simulated financial transactions.

This is a prototype, not a production banking product.

The team is new to hackathons and has limited experience with the stack. Optimize for simplicity, reliability, and demo readiness.

---

## Primary Goal

Build the smallest working version of the core product loop first.

Priority order:

1. Core task flow works end-to-end.
2. UI is understandable.
3. Supabase persistence works.
4. Plaid Sandbox works independently.
5. Integrate Plaid into the dashboard.
6. Add polish only after the above is stable.

All six priorities above are now in place. See **Current State** for what exists today.

Do not sacrifice a working demo for architecture, abstraction, or extra features.

---

## Current State

The core task loop, Supabase persistence and Plaid Sandbox all work. Treat this as a
baseline to preserve, not as a greenfield.

### Architecture

Two processes:

- **Frontend** (Vite + React, port 5173) reads from Supabase directly, with the publishable key.
- **Server** (Express, port 8000) does every create / update / delete, with the Supabase
  secret key. It is also the only place that talks to Plaid.

This split matters. Money-changing writes go through the server so they can be validated
there. Do not move approve / claim / submit into the browser.

### Screens

- `/` - `src/Home.jsx`, role selector
- `/parent` - `src/parent/ParentDashboard.jsx`, balance, create task, approvals, task list, bank, spending
- `/kid` - `src/kid/KidDashboard.jsx`, balance, available tasks, claimed tasks, spending

### Server routes

All under `http://localhost:8000`.

- `POST /api/tasks` - create a task
- `DELETE /api/tasks/:id` - delete an `available` or `claimed` task
- `POST /api/tasks/:id/claim` - `available` to `claimed`
- `POST /api/tasks/:id/submit` - `claimed` to `submitted`
- `POST /api/tasks/:id/redo` - `submitted` back to `claimed`
- `POST /api/tasks/:id/reject` - `submitted` to `rejected`
- `POST /api/tasks/:id/approve` - `submitted` to `approved`, and pays the reward
- `POST /api/create-link-token` - Plaid Link token
- `POST /api/exchange-public-token` - store the Plaid access token server side
- `GET /api/plaid-status` - is a bank linked?
- `GET /api/plaid-accounts` - linked accounts, and which one is the kid's
- `PUT /api/kid-account` - mark one account as the kid's, or clear the choice
- `POST /api/plaid-sync` - pull the bank's transactions into Supabase

Every status move returns `409` when the task is not in the status it expects. That guard is
what stops a second approve from paying the same reward twice. Keep it.

### Prototype shortcuts to know about

- One parent and one kid. The server looks each of them up by `role`.
- The kid screen is hardcoded to `users.id = 2` (`KID_ID` in `src/kid/KidDashboard.jsx`).
- No login. The role selector only routes.
- `.parent-page` is a fixed-width column (`width: 100%`, `max-width: 480px`). Its width must
  never depend on its contents, or the whole page resizes as tasks are added and cleared.

---

## Preferred Stack

Use the existing project stack whenever possible.

Preferred technologies:

- React
- React Router (`react-router-dom`)
- Vite
- JavaScript
- CSS
- Supabase
- Node.js
- Express
- Plaid Sandbox

Avoid adding technologies unless there is a clear, immediate need.

Do not introduce these unless explicitly requested:

- React Native
- Next.js
- TypeScript
- Redux
- Zustand
- Tailwind
- Prisma
- Docker
- GraphQL
- Kubernetes
- large UI frameworks
- custom authentication systems
- complex state-management libraries

If a library is not already installed, prefer solving the problem without adding one.

---

## Instructions for Coding Agents

These rules are especially important for smaller or local models such as Qwen-family coding models.

### 1. Work in Small Steps

Do not attempt to build the entire feature or app at once.

Prefer one focused change at a time.

Good:

- add a task card
- wire one button
- fetch tasks from Supabase
- fix one error
- add one route

Bad:

- rewrite the whole frontend
- replace the project architecture
- migrate the app to a new framework
- add multiple unrelated features in one change

Keep diffs small and easy to review.

---

### 2. Preserve Existing Code

Before changing a file:

1. Read the relevant code.
2. Identify how the current implementation works.
3. Make the smallest change needed.
4. Preserve working behavior unless the task requires changing it.

Do not delete or rewrite unrelated code.

Do not rename files, components, variables, routes, or database fields unless necessary.

Do not perform "cleanup" or refactors unless explicitly asked.

---

### 3. Prefer Simple Code

The team should be able to explain the code during judging.

Prefer:

- plain React components
- `useState`
- `useEffect`
- straightforward props
- small helper functions
- explicit conditional rendering
- simple fetch/query logic
- readable CSS

Avoid clever abstractions.

Do not create generic factories, complex hooks, elaborate class hierarchies, dependency injection, or advanced patterns unless the project already uses them.

A little duplication is acceptable during the hackathon if it keeps the code understandable.

---

### 4. Do Not Overengineer

This is a hackathon prototype.

Do not optimize prematurely for:

- massive scale
- multi-region deployment
- event sourcing
- microservices
- complex caching
- advanced security architecture
- elaborate testing infrastructure
- generic reusable frameworks

When choosing between a simple prototype solution and a theoretically cleaner production solution, prefer the simple prototype solution unless there is a meaningful correctness or security problem.

---

### 5. Code First, Comments Only When Necessary

Always write the code first.

Add a comment only when it is completely necessary to understand the code:

- a non-obvious business rule (for example, why the same task is not awarded twice)
- a workaround for a bug or a platform limitation
- a security or money-related check that needs to explain itself

Do not add comments that just repeat what the code already says.

Good:

```js
// Guard: only submitted tasks can be approved, so a task is never paid twice
if (task.status !== 'submitted') return
```

Bad:

```js
// set status to approved
task.status = 'approved'
```

---

## Core Product Behavior

The core task lifecycle should remain simple.

Recommended task statuses:

- `available`
- `claimed`
- `submitted`
- `approved`
- `rejected`

Expected flow:

```text
available
   |
   v
claimed <------+
   |           |
   v           | redo
submitted -----+
   |
   +------> rejected
   |
   v
approved
```

When a task is approved:

- mark the task as approved
- add the reward to `users.balance` for that kid
- insert a matching row in `transactions`
- avoid awarding the same task twice

The in-app balance is a prototype balance.

Do not implement real money transfers.

---

## Data Model

This is the actual Supabase schema. Use these exact table and column names.

Do not invent columns that are not listed here.

### users

- `id`
- `name`
- `role` — `parent` or `kid`
- `balance` — the kid's in-app balance

### tasks

- `id`
- `title`
- `reward`
- `status` — `available`, `claimed`, `submitted`, `approved`, `rejected`
- `kid_id` — the assigned/claiming kid, null while unassigned
- `type` — task category
- `duration_minutes` — estimated time to complete

### transactions

Holds two kinds of row, told apart by `source`: approved task rewards, and bank spending
synced from Plaid.

- `id`
- `amount` - money in is positive, money out is negative, so a purchase is stored negative
- `created_at`
- `kid_id` - NOT NULL
- `name` - merchant name; Plaid rows only
- `source` - `plaid` on synced bank rows
- `pending` - Plaid rows only
- `plaid_transaction_id` - unique; the sync upserts on it, so a repeat run never duplicates
- `plaid_account_id` - the `plaid_accounts` row the spending came from

### plaid_items

One linked bank. The access token stays server side and is never sent to the browser.

- `id`
- `parent_id`
- `plaid_item_id` - unique; the exchange upserts on it
- `access_token`

### plaid_accounts

The accounts inside a linked bank. Unique on (`item_id`, `plaid_account_id`).

- `id`
- `item_id`
- `plaid_account_id`
- `name`
- `current_balance`
- `kid_id` - set on the one account the parent marked as the kid's, otherwise null

### Relationships

```text
users (role = 'kid')
  |
  +-- tasks.kid_id
  +-- transactions.kid_id
  +-- plaid_accounts.kid_id

users (role = 'parent')
  |
  +-- plaid_items.parent_id
        |
        +-- plaid_accounts.item_id
              |
              +-- transactions.plaid_account_id
```

### Approval writes

Approving a task touches more than one table. Keep it in this order and keep it simple:

1. Set `tasks.status` to `approved` (only if it is currently `submitted`).
2. Add `tasks.reward` to that kid's `users.balance`.
3. Insert a `transactions` row with `amount` = the reward and `kid_id` = the kid.

Guard against double-awarding by checking the current status before updating.

Do not redesign the schema. If a feature seems to need a new column, say so and ask first.

---

## Authentication Guidance

Authentication is not the first priority.

There is no login. `src/Home.jsx` is a role selector that routes to `/parent` or `/kid`, and
the server identifies the single parent and the single kid by `users.role`. That is the
accepted hackathon answer here; do not replace it with real auth unless asked.

```text
Choose account

[ Parent ]
[ Kid ]
```

Do not spend large amounts of time building:

- forgot password
- email verification
- OAuth providers
- advanced role management
- multi-factor authentication

unless required by the hackathon or explicitly requested.

---

## Plaid Guidance

Plaid should be treated as an isolated integration.

The task/reward system must continue working even if Plaid fails.

This is already built and isolated that way:

```text
Core app                     Plaid (server/plaid.js, server/plaidSync.js)
- tasks                      - connect a Sandbox account through Plaid Link
- approvals                  - store the access token in plaid_items
- balance                    - sync transactions into the transactions table
                             - display spending (SpendingList)
```

`ConnectBank` opens Plaid Link in the browser, but only ever handles a public token. The
server exchanges it and keeps the access token. The parent then marks one linked account as
the kid's, and only that account's spending is stored.

Use Plaid Sandbox.

Do not attempt to:

- move real money
- create real bank accounts
- control debit cards
- enforce real-world spending limits
- infer which family member made a real transaction without reliable data

Keep Plaid secrets on the server.

Never expose secret credentials in frontend code.

---

## Secrets and Environment Variables

Never hardcode secrets.

Never print secrets in logs.

Never commit secrets.

Sensitive values belong in environment variables.

There are two env files, and both already have a committed `.env.example`. These are the
variables the code actually reads; do not invent others.

`.env` in the project root, read by the frontend (and by the server for the Supabase URL):

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

`server/.env`, read only by the server:

```text
PORT
SUPABASE_SECRET_KEY
PLAID_CLIENT_ID
PLAID_SECRET
```

Anything prefixed `VITE_` is bundled into the frontend and is public. The Supabase secret key
and the Plaid credentials must never get a `VITE_` prefix.

Do not include real credentials in `.env.example`.

---

## UI Guidance

Optimize for a clear mobile-looking web interface.

The app does not need to be React Native.

Prefer responsive web layouts that look good on a phone.

Important screens:

1. Role selection
2. Parent dashboard
3. Create task
4. Kid dashboard
5. Parent approval
6. Optional spending history

The main demo should be understandable without explanation.

Use obvious labels and buttons.

Good:

- `Create Task`
- `Claim Task`
- `Mark Complete`
- `Approve`
- `Reject`

Avoid ambiguous controls.

---

## Feature Priority

### Must Have

All of these are done. Do not regress them.

- parent view
- kid view
- create task
- display task
- claim task
- submit/complete task
- approve task
- update in-app balance
- display balance

### Strong Nice-to-Have

Supabase persistence and Plaid Sandbox transactions are done. Still open:

- photo proof
- spending categories
- progress bar

### Only If Time Remains

- timers
- multiple kids
- notifications
- charts
- animations
- confetti
- advanced authentication

### Do Not Build Unless Explicitly Requested

- real banking
- real money movement
- real debit cards
- KYC systems
- production fintech compliance systems
- AI-based homework verification

---

## How to Handle New Feature Requests

Before coding, classify the request.

### Core feature

If it directly improves the primary demo flow, implement it simply.

### Nice-to-have

Implement only if it does not destabilize the core flow.

### Scope expansion

If it introduces a new framework, service, or major architectural change, do not implement it automatically.

Explain the tradeoff and prefer the existing stack.

---

## Debugging Protocol

When something breaks:

1. Read the exact error message.
2. Identify the smallest relevant code path.
3. Form 1-3 likely causes.
4. Check those causes in order.
5. Make the smallest fix.
6. Re-test the original behavior.
7. Avoid unrelated rewrites.

Do not respond to a bug by replacing the entire file unless the file is clearly unsalvageable.

Prefer root-cause fixes over hiding errors.

If unsure, add temporary logging around the failing code path.

Remove noisy debug logging after the issue is understood.

---

## Error Handling

For hackathon UX, fail clearly.

Examples:

- show `Could not load tasks`
- show `Could not connect to Plaid`
- disable a button while a request is running
- prevent duplicate submissions

Do not silently ignore errors.

Use simple user-facing messages and log useful technical details to the console or server.

---

## API and Data Rules

Validate important inputs.

At minimum:

- task title must not be empty
- reward must be a valid non-negative number
- `duration_minutes` must be a positive number if provided
- task must exist before updating it
- approval should not award the same task twice (check `status` is `submitted` first)

Prefer server-side validation for sensitive or money-related actions.

Treat the in-app balance as important state even though it is simulated.

---

## Git Rules

Keep commits small.

Prefer commit messages such as:

```text
Add parent task creation form
Wire kid task claiming
Save approved rewards to Supabase
Display Plaid Sandbox transactions
Fix duplicate task approval
```

Avoid commits such as:

```text
stuff
changes
final
fix
```

Before changing several files, make sure the change is actually necessary.

Do not force-push shared branches unless the team explicitly agrees.

Do not commit:

- `.env`
- secrets
- API keys
- build artifacts
- large generated files

---

## Agent Response Style

When proposing code changes:

1. State the goal in one sentence.
2. Mention the files that need changes.
3. Make the smallest implementation.
4. Explain any non-obvious logic briefly.
5. Mention how to test it.

Do not provide long theoretical explanations unless asked.

Do not overwhelm the team with multiple competing approaches.

Choose the simplest reasonable approach and implement it consistently.

---

## Qwen-Oriented Instructions

When operating as a smaller local coding model:

- reason from the code that is actually present
- do not assume files or APIs exist
- inspect before editing
- prefer explicit code over abstraction
- avoid inventing dependencies
- avoid inventing environment variables
- avoid inventing database columns
- avoid inventing routes
- keep each task narrow
- do not silently change project architecture
- do not create extra files unless they are needed
- do not rewrite working code merely to match personal preferences

If information is missing, prefer a conservative implementation based on the existing repository.

When making assumptions, state them briefly.

If the requested change can be implemented in one file, do not modify five.

If a task can be completed without a new dependency, do not add one.

If generated code is more complex than a beginner could reasonably explain, simplify it.

---

## Before Writing Code

Check:

- What is the exact requested behavior?
- Which existing file owns that behavior?
- What existing patterns does the repo use?
- Is a new dependency actually necessary?
- Can this be done in a smaller way?
- Could this break the core demo?

Then proceed.

---

## Before Finishing a Task

Verify:

- the requested behavior works
- existing behavior still works
- there are no obvious console errors
- no secrets were exposed
- no unnecessary dependencies were added
- no unrelated files were changed
- the code is understandable by a beginner

End with a short test checklist.

---

## Demo Reliability Rule

The demo is more important than architectural perfection.

If an advanced feature threatens the stability of the core demo:

1. simplify it
2. mock it
3. isolate it
4. or remove it

A reliable working prototype is the priority.

---

## Final Principle

Build this project in layers:

```text
Layer 1: Working UI with mock data      done
Layer 2: Core task flow                 done
Layer 3: Supabase persistence           done
Layer 4: Plaid Sandbox                  done
Layer 5: Polish                         current
```

Layers 1 to 4 are in place, so polish is now the right layer to work in. Polish must not
break the layers underneath it.

The best contribution is usually the smallest change that makes the current demo more complete, stable, or understandable.
