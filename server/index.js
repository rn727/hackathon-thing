const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    }
  }
});

const plaidClient = new PlaidApi(configuration);

const PORT = process.env.PORT || 8000

let accessToken = null;

app.get("/", (req, res) => {
  res.json({
    message: "running backend"
  });
});

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

app.post("/api/exchange-public-token", async (req, res) => {
  try {
    const public_token = req.body;

    const response = await plaidClient.itemPublicTokenExchange({ public_token: public_token });

    accessToken = response.data.access_token;

    res.json({ message: "Bank account connect successfully" });
  }
  catch (error) {
    console.error("Error exchanging public token: ", error.response?.data || error);

    res.status(500).json({ error: "Failed to exchange public token" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
