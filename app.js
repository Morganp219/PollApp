// polling_app_server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/**
 * API Documentation
 *
 * POST /poll
 * Creates or overwrites the current poll
 * Body:
 * {
 *   "question": "Your question here",
 *   "options": ["Option 1", "Option 2", ...]
 * }
 * Response:
 * {
 *   "message": "Poll created!",
 *   "poll": { question, options, createdAt, _id, __v }
 * }
 *
 * GET /poll
 * Retrieves the current active poll
 * Response:
 * {
 *   "question": "...",
 *   "options": [ { id, label, votes }, ... ],
 *   "createdAt": "...",
 *   "_id": "...",
 *   "__v": 0
 * }
 *
 * POST /vote
 * Submits a vote for an option
 * Body:
 * {
 *   "optionId": 1
 * }
 * Response:
 * {
 *   "message": "Vote recorded",
 *   "poll": { question, options, createdAt, _id, __v }
 * }
 *
 * POST /reset
 * Deletes the current poll
 * Response:
 * {
 *   "message": "Poll has been reset."
 * }
 */

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/pollingapp")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Poll model
const optionSchema = new mongoose.Schema({
  id: Number,
  label: String,
  votes: { type: Number, default: 0 }
});

const pollSchema = new mongoose.Schema({
  question: String,
  options: [optionSchema],
  createdAt: { type: Date, default: Date.now }
});

const Poll = mongoose.model("Poll", pollSchema);

// Create or overwrite the current poll
app.post("/poll", async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question) {
      return res.status(400).json({ error: "No question entered." });
    }

    if (!Array.isArray(options)) {
      return res.status(400).json({ error: "Options is not valid." });
    }

    if (options.length < 2) {
      return res.status(400).json({ error: "Please enter at least 2 options." });
    }

    await Poll.deleteMany({});

    const newPoll = await Poll.create({
      question,
      options: options.map((label, index) => ({
        id: index + 1,
        label,
        votes: 0
      }))
    });

    res.status(201).json({ message: "Poll created!", poll: newPoll });
  } catch (err) {
    res.status(500).json({ error: "Server error creating poll." });
  }
});

// Fetch current poll
app.get("/poll", async (req, res) => {
  const poll = await Poll.findOne().sort({ createdAt: -1 });
  if (!poll) return res.status(404).json({ error: "No active poll" });
  res.json(poll);
});

// Submit a vote
app.post("/vote", async (req, res) => {
  const { optionId } = req.body;

  const poll = await Poll.findOne().sort({ createdAt: -1 });
  if (!poll) return res.status(404).json({ error: "No active poll" });

  const option = poll.options.find(o => o.id === optionId);
  if (!option) return res.status(400).json({ error: "Invalid option ID" });

  option.votes += 1;
  await poll.save();

  res.json({ message: "Vote recorded", poll });
});

// Reset poll
app.post("/reset", async (req, res) => {
  try {
    await Poll.deleteMany({});
    res.json({ message: "Poll has been reset." });
  } catch (err) {
    res.status(500).json({ error: "Error resetting poll." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🗳️ Polling server running at http://localhost:${PORT}`);
});