const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// necessary before to make plaid.js work
dotenv.config();

const app = express();
const plaidClient = require("./plaid");

app.use(cors());
app.use(express.json());

let accessToken = null;

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

// allowing frontend to talk with backend and plaid about plaid related matters
app.post("/api/exchange-public-token", async (req, res) => {
  try {
    const public_token = req.body;

    const response = await plaidClient.itemPublicTokenExchange({ public_token });

    accessToken = response.data.access_token;

    res.json({ message: "Bank account connect successfully" });
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
