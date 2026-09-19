# SASE Hack Hackathon Project

A mobile-friendly web app designed to help kids build financial responsibility through schoolwork. Parents create tasks with monetary rewards, kids claim and complete them, and parents approve submissions to increase the kid's virtual balance.

The project focuses on one parent and one kid, with a simple task-to-reward workflow and a dashboard for tracking rewards and spending. Plaid Sandbox will provide fake banking and transaction data for the demo. All rewards are virtual; no real money is transferred.

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

5. Create the environment files. The app has two of them, one per app:

   - `.env` in the project root holds Supabase settings (used by the frontend). Copy `.env.example` to `.env` and fill in your values.
   - `server/.env` holds Plaid Sandbox credentials. Copy `server/.env.example` to `server/.env` and fill in your values.

   Never commit a `.env` file. The Plaid credentials must only ever live in `server/.env`; the frontend never sees them.

6. Start both apps. Each one has its own `npm start`, so you need two terminals:

   - **Terminal 1 (frontend):** from the project root:

     ```bash
     npm run dev
     ```

   - **Terminal 2 (backend):** from the `server` folder:

     ```bash
     npm run dev
     ```

   The frontend runs on the Vite dev server URL printed in Terminal 1 (default `http://localhost:5173`). The backend runs on `http://localhost:8000` and serves the Plaid API endpoints. The two apps are separate processes: the backend is the only place that talks to Plaid, so Plaid stays out of all frontend code.

Open the local URL printed in the terminal. Changes will update in the browser as you save. Press **Ctrl+C** in each terminal to stop its server.

To build and preview the production version locally:

```bash
npm run build
npm run preview
```

The frontend is a React + Vite app. Supabase setup will be added as that integration is implemented.
