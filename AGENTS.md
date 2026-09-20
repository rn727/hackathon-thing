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

Do not sacrifice a working demo for architecture, abstraction, or extra features.

---

## Preferred Stack

Use the existing project stack whenever possible.

Preferred technologies:

- React
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
claimed
   |
   v
submitted
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

- `id`
- `amount`
- `created_at`
- `kid_id`

### Relationships

```text
users (role = 'kid')
  |
  +-- tasks.kid_id
  |
  +-- transactions.kid_id
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

If the project already has working authentication, preserve it.

If not, a simple hackathon demo role selector is acceptable:

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

Recommended structure:

```text
Core app
- tasks
- approvals
- balance

Plaid
- connect Sandbox account
- retrieve simulated transactions
- display spending
```

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

Examples:

```text
PLAID_CLIENT_ID
PLAID_SECRET
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

Commit a `.env.example` with placeholders if useful.

Example:

```text
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
```

Do not include real credentials.

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

- Supabase persistence
- Plaid Sandbox transactions
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
Layer 1: Working UI with mock data
Layer 2: Core task flow
Layer 3: Supabase persistence
Layer 4: Plaid Sandbox
Layer 5: Polish
```

Do not skip directly to Layer 5.

The best contribution is usually the smallest change that makes the current demo more complete, stable, or understandable.
