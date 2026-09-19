# SASE Hack Hackathon Project

A mobile-friendly web app designed to help kids build financial responsibility through schoolwork. Parents create tasks with monetary rewards, kids claim and complete them, and parents approve submissions to increase the kid's virtual balance.

The project focuses on one parent and one kid, with a simple task-to-reward workflow and a dashboard for tracking rewards and spending. Plaid Sandbox will provide fake banking and transaction data for the demo. All rewards are virtual; no real money is transferred.

## Setup

1. Install the current LTS version of [Node.js](https://nodejs.org/), which includes npm.
2. Clone this repository if you have not already, then open a terminal in the project folder containing `package.json`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Open the local URL printed in the terminal. Changes will update in the browser as you save. Press **Ctrl+C** to stop the server.

To build and preview the production version locally:

```bash
npm run build
npm run preview
```

These instructions cover the React + Vite frontend. Supabase and Plaid setup will be added as those integrations are implemented.
