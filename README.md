# SASE Hack Hackathon Project

A mobile-friendly web app designed to help kids build financial responsibility through schoolwork. Parents create tasks with monetary rewards, kids claim and complete them, and parents approve submissions to increase the kid's virtual balance.

The project focuses on one parent and one kid, with a simple task-to-reward workflow and a dashboard for tracking rewards and spending. Plaid Sandbox provides the fake banking and transaction data for the demo. All rewards are virtual; no real money is transferred.

The app is two processes: a React + Vite frontend, and an Express server. The frontend reads from Supabase directly. Every create, update and delete goes through the server, which is also the only place that talks to Plaid. `AGENTS.md` has the full architecture, route list and database schema.

## Setup

1. Install the current LTS version of [Node.js](https://nodejs.org/), which includes npm.
2. Clone this repository if you have not already, then open a terminal in the project folder containing `package.json`.
3. Install the frontend dependencies:

   ```bash
   npm install
   ```

4. Install the backend dependencies:

   ```bash
   cd server
   npm install
   ```

5. Create the environment files. There are two of them, one per app:

   - `.env` in the project root holds the Supabase URL and publishable key. The frontend uses both; the server reads the URL from here too. Copy `.env.example` to `.env` and fill in your values.
   - `server/.env` holds the Supabase secret key and the Plaid Sandbox credentials. Copy `server/.env.example` to `server/.env` and fill in your values.

   Never commit a `.env` file. Anything prefixed `VITE_` is bundled into the frontend and is public, so the Supabase secret key and the Plaid credentials must stay in `server/.env` without that prefix. The frontend never sees them.

6. Set up the Supabase database. The app expects the tables listed under **Data Model** in `AGENTS.md`: `users`, `tasks`, `transactions`, `plaid_items` and `plaid_accounts`. Seed `users` with one row where `role` is `parent` and one where `role` is `kid`. The kid screen is currently hardcoded to `users.id = 2`, so give the kid that id.

7. Start both apps. Each one has its own `npm run dev`, so you need two terminals:

   - **Terminal 1 (frontend):** from the project root:

     ```bash
     npm run dev
     ```

   - **Terminal 2 (backend):** from the `server` folder:

     ```bash
     npm run dev
     ```

   The frontend runs on the Vite dev server URL printed in Terminal 1 (default `http://localhost:5173`). The backend runs on `http://localhost:8000` and serves the task and Plaid API endpoints. The task screens still render without the backend, but nothing can be created, claimed, approved or synced until it is running.

Open the local URL printed in the terminal. Changes will update in the browser as you save. Press **Ctrl+C** in each terminal to stop its server.

## Demo walkthrough

1. Open `/`, choose **Log in as Parent**.
2. Create a task with a reward.
3. Go back and choose **Log in as Child**. Claim the task, then **Mark Complete**.
4. Back on the parent dashboard, **Approve** it. The kid's balance goes up and a transaction is recorded.
5. Optional: **Connect Bank** links a Plaid Sandbox account. Pick which account is the child's, then **Refresh** under Recent spending to pull its transactions in.

## Other commands

```bash
npm run lint      # ESLint over the frontend and the server
npm run build     # production build
npm run preview   # serve the production build locally
```
