const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// necessary before to make plaid.js work
dotenv.config();

const app = express();
const plaidClient = require("./plaid");
const tasksRouter = require("./tasks");
const { saveItem, fetchTransactions, storeTransactions } = require("./plaidSync");
const { supabaseAdmin } = require("./supabaseAdmin");

app.use(cors());
app.use(express.json());
app.use("/api/tasks", tasksRouter);

app.get("/", (req, res) => {
  res.json({
    message: "running backend"
  });
});

// connecting with plaid
app.post("/api/create-link-token", async (req, res) => {
  try {
    const request = {
      user: {
        client_user_id: "demo-user",
      },
      client_name: "PLACEHOLDER TBD",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en"
    };

    const response = await plaidClient.linkTokenCreate(request);

    res.json({ link_token: response.data.link_token });
  }
  catch (error) {
    console.error("Error creating link token:", error.response?.data || error);

    res.status(500).json({ error: "Failed to create link token" });
  }
});

// Has this family already linked a bank? The access token itself stays server side.
app.get("/api/plaid-status", async (req, res) => {
  const { count, error } = await supabaseAdmin
    .from("plaid_items")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Error checking plaid status: ", error);

    return res.status(500).json({ error: "Could not check the bank connection" });
  }

  res.json({ linked: count > 0 });
});

// allowing frontend to talk with backend and plaid about plaid related matters
app.post("/api/exchange-public-token", async (req, res) => {
  try {
    const { public_token } = req.body;
    if (!public_token) return res.status(400).json({ error: "public_token is required" });

    // One parent in this prototype, so the server looks them up.
    const { data: parent, error } = await supabaseAdmin
      .from("users").select("id").eq("role", "parent").order("id").limit(1).single();
    if (error) throw error;

    // saveItem exchanges the token and stores access_token in plaid_items.
    await saveItem(parent.id, public_token);

    res.json({ message: "Bank account connected successfully" });
  }
  catch (error) {
    console.error("Error exchanging public token: ", error.response?.data || error);

    res.status(500).json({ error: "Failed to exchange public token" });
  }
});

// The linked accounts, and which one the parent marked as the kid's.
app.get("/api/plaid-accounts", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("plaid_accounts")
    .select("id, name, current_balance, kid_id")
    .order("id");

  if (error) {
    console.error("Error loading bank accounts: ", error);

    return res.status(500).json({ error: "Could not load the bank accounts" });
  }

  res.json(data);
});

// Parent picks the account the kid spends from. account_id null clears the pick.
// One kid and one account per kid in this prototype, so the old pick is cleared
// first: kid balance tracking has to read exactly one account, never two.
app.put("/api/kid-account", async (req, res) => {
  try {
    const { account_id } = req.body;
    if (account_id != null && !Number.isInteger(Number(account_id))) {
      return res.status(400).json({ error: "account_id must be an account id or null" });
    }

    const { data: kid, error: kidError } = await supabaseAdmin
      .from("users").select("id").eq("role", "kid").order("id").limit(1).single();
    if (kidError) throw kidError;

    // The new pick is set before the old one is cleared, so a bad id leaves the
    // parent's current choice alone instead of wiping it.
    if (account_id != null) {
      const { data, error } = await supabaseAdmin
        .from("plaid_accounts")
        .update({ kid_id: kid.id })
        .eq("id", Number(account_id))
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "That account is not linked" });
    }

    const clear = supabaseAdmin.from("plaid_accounts").update({ kid_id: null }).eq("kid_id", kid.id);
    const { error: clearError } = await (account_id == null ? clear : clear.neq("id", Number(account_id)));
    if (clearError) throw clearError;

    res.json({ account_id: account_id == null ? null : Number(account_id), kid_id: kid.id });
  }
  catch (error) {
    console.error("Error saving the kid's account: ", error);

    res.status(500).json({ error: "Could not save the kid's account" });
  }
});

// Spending for the linked bank, read live from Plaid. kid_id is set on the rows
// that belong to the account the parent designated as the kid's, so the frontend
// can split the kid's spending from the rest of the family's.
// Amounts follow the app's convention: a purchase is negative, money in is positive.
app.get("/api/transactions", async (req, res) => {
  try {
    const { data: item, error } = await supabaseAdmin
      .from("plaid_items").select("id").order("id").limit(1).maybeSingle();
    if (error) throw error;
    if (!item) return res.json([]);

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("plaid_accounts").select("plaid_account_id, name, kid_id").eq("item_id", item.id);
    if (accountsError) throw accountsError;

    const byAccount = new Map(accounts.map((a) => [a.plaid_account_id, a]));
    const rows = await fetchTransactions(item.id);

    res.json(rows.map((row) => ({
      ...row,
      kid_id: byAccount.get(row.account_id)?.kid_id ?? null,
      account_name: byAccount.get(row.account_id)?.name ?? null,
    })));
  }
  catch (error) {
    console.error("Error loading transactions: ", error.response?.data || error);

    // Plaid needs a moment after Link before transactions exist.
    if (error.response?.data?.error_code === "PRODUCT_NOT_READY") {
      return res.status(503).json({ error: "Plaid is still preparing this account. Try again in a moment." });
    }

    res.status(500).json({ error: "Could not load transactions" });
  }
});

// Pulls the linked bank's transactions into Supabase. Safe to call repeatedly:
// rows are upserted on plaid_transaction_id, so nothing is duplicated.
app.post("/api/plaid-sync", async (req, res) => {
  try {
    const { data: item, error } = await supabaseAdmin
      .from("plaid_items").select("id").order("id").limit(1).maybeSingle();
    if (error) throw error;
    if (!item) return res.status(409).json({ error: "No bank account is linked yet" });

    res.json(await storeTransactions(item.id));
  }
  catch (error) {
    console.error("Error syncing transactions: ", error.response?.data || error);

    if (error.response?.data?.error_code === "PRODUCT_NOT_READY") {
      return res.status(503).json({ error: "Plaid is still preparing this account. Try again in a moment." });
    }

    res.status(500).json({ error: "Could not sync transactions" });
  }
});

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
