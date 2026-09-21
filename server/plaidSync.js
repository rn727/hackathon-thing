const plaidClient = require("./plaid");
const { supabaseAdmin } = require("./supabaseAdmin");

// Plaid reports money leaving an account as a positive amount. transactions.amount
// is a change in money in this app, where task rewards are positive, so a purchase
// has to be stored negative for the two sources to add up.
function toRow(t) {
  return {
    plaid_transaction_id: t.transaction_id,
    account_id: t.account_id,
    amount: -Number(t.amount),
    name: t.merchant_name || t.name || null,
    pending: Boolean(t.pending),
    created_at: t.datetime || t.date,
  };
}

// Called after Link succeeds. Stores the access token server side and records the
// item's accounts so transactions have something to hang off.
async function saveItem(parentId, publicToken) {
  const exchange = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchange.data.access_token;

  const { data: item, error: itemError } = await supabaseAdmin
    .from("plaid_items")
    .upsert(
      {
        parent_id: parentId,
        plaid_item_id: exchange.data.item_id,
        access_token: accessToken,
      },
      { onConflict: "plaid_item_id" }
    )
    .select("id")
    .single();
  if (itemError) throw itemError;

  const accounts = await plaidClient.accountsGet({ access_token: accessToken });

  // kid_id is left out on purpose: reconnecting a bank must not wipe the
  // account-to-kid mapping the parent already chose.
  const { error: accountsError } = await supabaseAdmin.from("plaid_accounts").upsert(
    accounts.data.accounts.map((a) => ({
      item_id: item.id,
      plaid_account_id: a.account_id,
      name: a.name,
      current_balance: a.balances.current,
    })),
    { onConflict: "item_id,plaid_account_id" }
  );
  if (accountsError) throw accountsError;

  return item.id;
}

// Pulls everything Plaid has for one item since the stored cursor and applies it.
async function syncItem(itemId) {
  const { data: item, error } = await supabaseAdmin
    .from("plaid_items")
    .select("id, access_token, sync_cursor")
    .eq("id", itemId)
    .single();
  if (error) throw error;

  let cursor = item.sync_cursor || undefined;
  const added = [];
  const modified = [];
  const removed = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await plaidClient.transactionsSync({
      access_token: item.access_token,
      cursor,
    });
    added.push(...data.added.map(toRow));
    modified.push(...data.modified.map(toRow));
    removed.push(...data.removed.map((t) => t.transaction_id));
    cursor = data.next_cursor;
    hasMore = data.has_more;
  }

  // ponytail: the whole sync is buffered and applied in one call. Fine for a
  // sandbox account; apply page by page if an item ever has a long history.
  const { data: result, error: applyError } = await supabaseAdmin.rpc("plaid_apply_transactions", {
    p_item_id: item.id,
    p_added: added,
    p_modified: modified,
    p_removed: removed,
    p_cursor: cursor,
  });
  if (applyError) throw applyError;

  return { itemId: item.id, added: added.length, modified: modified.length, removed: removed.length, ...result };
}

// Reads one item's transactions straight from Plaid, without storing them. A null
// cursor returns the whole history as `added`, so nothing else has to be merged.
async function fetchTransactions(itemId) {
  const { data: item, error } = await supabaseAdmin
    .from("plaid_items")
    .select("id, access_token")
    .eq("id", itemId)
    .single();
  if (error) throw error;

  const rows = [];
  let cursor;
  let hasMore = true;
  while (hasMore) {
    const { data } = await plaidClient.transactionsSync({ access_token: item.access_token, cursor });
    rows.push(...data.added.map(toRow));
    cursor = data.next_cursor;
    hasMore = data.has_more;
  }

  return rows;
}

// Re-reads the item's accounts from Plaid so the stored balances are current.
async function refreshBalances(itemId) {
  const { data: item, error } = await supabaseAdmin
    .from("plaid_items")
    .select("access_token")
    .eq("id", itemId)
    .single();
  if (error) throw error;

  const accounts = await plaidClient.accountsGet({ access_token: item.access_token });

  // kid_id is left out for the same reason as saveItem: a refresh must not wipe
  // the account-to-kid mapping the parent already chose.
  const { error: upsertError } = await supabaseAdmin.from("plaid_accounts").upsert(
    accounts.data.accounts.map((a) => ({
      item_id: itemId,
      plaid_account_id: a.account_id,
      name: a.name,
      current_balance: a.balances.current,
    })),
    { onConflict: "item_id,plaid_account_id" }
  );
  if (upsertError) throw upsertError;

  return accounts.data.accounts.length;
}

// Writes an item's transactions into the transactions table. Every run refetches
// the full history and upserts on plaid_transaction_id, so a run that dies partway
// just repeats itself next time. No cursor is stored on purpose: a cursor that
// moved past rows that were never written would lose them for good.
// ponytail: full refetch every run, fine for a sandbox item. Move to the stored
// cursor if an item ever has enough history for the refetch to hurt.
async function storeTransactions(itemId) {
  // Balances first: a new account shows up in the read below, and the stored
  // balance stays in step with the transactions written in the same run.
  const balances = await refreshBalances(itemId);

  const { data: accounts, error } = await supabaseAdmin
    .from("plaid_accounts")
    .select("id, plaid_account_id, kid_id")
    .eq("item_id", itemId);
  if (error) throw error;

  const byPlaidId = new Map(accounts.map((a) => [a.plaid_account_id, a]));
  const transactions = await fetchTransactions(itemId);

  const rows = [];
  for (const t of transactions) {
    const account = byPlaidId.get(t.account_id);

    // transactions.kid_id is NOT NULL, and only the kid's spending belongs here,
    // so accounts the parent has not designated are skipped rather than stored.
    if (!account || account.kid_id == null) continue;

    rows.push({
      plaid_transaction_id: t.plaid_transaction_id,
      plaid_account_id: account.id,
      kid_id: account.kid_id,
      amount: t.amount,
      name: t.name,
      pending: t.pending,
      created_at: t.created_at,
      source: "plaid",
    });
  }

  if (rows.length === 0) return { stored: 0, balances };

  const { error: upsertError } = await supabaseAdmin
    .from("transactions")
    .upsert(rows, { onConflict: "plaid_transaction_id" });
  if (upsertError) throw upsertError;

  return { stored: rows.length, balances };
}

async function syncAll() {
  const { data, error } = await supabaseAdmin.from("plaid_items").select("id");
  if (error) throw error;
  return Promise.all(data.map((item) => syncItem(item.id)));
}

module.exports = { saveItem, syncItem, syncAll, fetchTransactions, storeTransactions, refreshBalances, toRow };
