/**
 * server.js
 * 
 * This JavaScript file handles interaction with the polling server.
 * 
 * Endpoints used:
 * - POST /poll    → Create a new poll
 * - GET /poll     → Fetch the current poll
 * - POST /vote    → Submit a vote by option ID
 * - POST /reset   → Reset the current poll
 */

const API = "http://localhost:3000";

/**
 * Creates a poll by sending a question and array of options
 */
async function createPoll() {
  const question = document.getElementById("question").value;
  const options = document.getElementById("options").value
    .split('\n')
    .map(o => o.trim())
    .filter(o => o);

  const res = await fetch(`${API}/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, options })
  });

  const data = await res.json();
  alert(JSON.stringify(data, null, 2));
  loadPoll();
}

/**
 * Loads and displays the current poll
 */
async function loadPoll() {
  const res = await fetch(`${API}/poll`);
  const data = await res.json();

  const container = document.getElementById("poll-display");
  container.innerHTML = "";

  if (data.error) {
    container.textContent = data.error;
    return;
  }

  const question = document.createElement("h3");
  question.textContent = data.question;
  container.appendChild(question);

  data.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = `${option.label} (${option.votes} votes)`;
    btn.className = "option-button";
    btn.onclick = () => vote(option.id);
    container.appendChild(btn);
  });
}

/**
 * Submits a vote for a specific option ID
 */
async function vote(optionId) {
  const res = await fetch(`${API}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId })
  });

  const data = await res.json();
  alert(data.message || JSON.stringify(data));
  loadPoll();
}

/**
 * Sends a request to reset the current poll
 */
async function resetPoll() {
  const res = await fetch(`${API}/reset`, { method: "POST" });
  const data = await res.json();
  alert(data.message);
  loadPoll();
}
