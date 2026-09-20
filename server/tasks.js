const express = require("express");
const { supabaseAdmin } = require("./supabaseAdmin");

const router = express.Router();

// Moves a task only while it is still in `from`. That filter is what stops a
// second approve from paying the same reward twice.
async function move(res, id, from, to, extra) {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update({ status: to, ...extra })
    .eq("id", id)
    .eq("status", from)
    .select()
    .maybeSingle();
  if (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update the task" });
    return null;
  }
  if (!data) {
    res.status(409).json({ error: `Task is not ${from}` });
    return null;
  }
  return data;
}

// Parent: create a task.
router.post("/", async (req, res) => {
  const { title, reward, type, duration_minutes } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!(Number(reward) >= 0)) return res.status(400).json({ error: "Reward must be a non-negative number" });
  if (duration_minutes != null && !(Number(duration_minutes) > 0)) {
    return res.status(400).json({ error: "Duration must be a positive number" });
  }

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({ title: title.trim(), reward: Number(reward), type, duration_minutes, status: "available" })
    .select()
    .single();
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not create the task" });
  }
  res.status(201).json(data);
});

// Parent: delete a task the kid has not submitted yet.
router.delete("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .delete()
    .eq("id", req.params.id)
    .in("status", ["available", "claimed"])
    .select()
    .maybeSingle();
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not delete the task" });
  }
  if (!data) return res.status(409).json({ error: "Task cannot be deleted" });
  res.json(data);
});

// Kid: claim a task. One kid in this prototype, so the server looks them up.
router.post("/:id/claim", async (req, res) => {
  const { data: kid } = await supabaseAdmin.from("users").select("id").eq("role", "kid").single();
  const task = await move(res, req.params.id, "available", "claimed", { kid_id: kid.id });
  if (task) res.json(task);
});

// Kid: send the task for approval. Parent: send it back, or close it unpaid.
for (const [path, from, to] of [
  ["submit", "claimed", "submitted"],
  ["redo", "submitted", "claimed"],
  ["reject", "submitted", "rejected"],
]) {
  router.post(`/:id/${path}`, async (req, res) => {
    const task = await move(res, req.params.id, from, to);
    if (task) res.json(task);
  });
}

// Parent: approve and pay. The status moves first, so a repeat click finds
// nothing to move and pays nothing.
router.post("/:id/approve", async (req, res) => {
  const task = await move(res, req.params.id, "submitted", "approved");
  if (!task) return;

  // ponytail: read-then-write balance, safe with one parent. Use a Postgres
  // function if several people ever approve at once.
  const { data: kid } = await supabaseAdmin.from("users").select("balance").eq("id", task.kid_id).single();
  await supabaseAdmin
    .from("users")
    .update({ balance: Number(kid.balance) + Number(task.reward) })
    .eq("id", task.kid_id);
  await supabaseAdmin.from("transactions").insert({ amount: task.reward, kid_id: task.kid_id });

  res.json(task);
});

module.exports = router;
