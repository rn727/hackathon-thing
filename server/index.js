const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// necessary before to make plaid.js work
dotenv.config();

const app = express();
const plaidClient = require("./plaid");
const tasksRouter = require("./tasks");
const { saveItem } = require("./plaidSync");
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

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
