/* =========================================================
   game.js — "The Crossroads Quest"
   A game-based version of the career assessment. Collects the
   exact same signals as the old form (academic marks, interest
   weights, preferences) but through a story quest, a swipe-card
   game, and a this-or-that duel round. Submits to /analyze and
   redirects to /results exactly like the plain form did.
   ========================================================= */

/* ---------------- Content data ---------------- */

const SCENARIOS = [
  {
    kicker: "Quest 1 · Science Fair",
    title: "Your class forms teams for the Annual Science Fair. What's your role?",
    options: [
      { text: "Build & debug the actual working model", tag: "problem_solving" },
      { text: "Manage the budget & team schedule", tag: "leading_managing" },
      { text: "Design the poster & the booth", tag: "creativity_design" },
      { text: "Dig deep into the background theory", tag: "research_curiosity" },
    ],
  },
  {
    kicker: "Quest 2 · Late-Night Crisis",
    title: "A friend's laptop crashes the night before a big exam. What do you do?",
    options: [
      { text: "Try to fix the software issue yourself", tag: "technology" },
      { text: "Calm them down and build a study plan together", tag: "helping_people" },
      { text: "Find a clever workaround so they can still revise", tag: "problem_solving" },
      { text: "Get curious about why it actually crashed", tag: "research_curiosity" },
    ],
  },
  {
    kicker: "Quest 3 · Dream Trip",
    title: "Your school announces a 3-day trip. Pick your dream stop.",
    options: [
      { text: "A stock exchange / business hub tour", tag: "numbers_finance" },
      { text: "A forest & wildlife sanctuary trek", tag: "nature_biology" },
      { text: "A hands-on robotics lab", tag: "technology" },
      { text: "An art & design museum", tag: "creativity_design" },
    ],
  },
  {
    kicker: "Quest 4 · Group Project",
    title: "Your group project is chaos and nobody knows their role. You naturally...",
    options: [
      { text: "Start assigning tasks & deadlines", tag: "leading_managing" },
      { text: "Just quietly solve the trickiest part yourself", tag: "problem_solving" },
      { text: "Check in on how stressed everyone is first", tag: "helping_people" },
      { text: "Take on the research nobody else wants", tag: "research_curiosity" },
    ],
  },
  {
    kicker: "Quest 5 · Fest Committee",
    title: "Sign-ups are open for the school fest committee. Which desk do you join?",
    options: [
      { text: "Ticket sales & budgeting desk", tag: "numbers_finance" },
      { text: "Stage design & decoration desk", tag: "creativity_design" },
      { text: "Guest coordination & hospitality desk", tag: "helping_people" },
      { text: "Eco-friendly waste-management stall", tag: "nature_biology" },
    ],
  },
  {
    kicker: "Quest 6 · Free Weekend",
    title: "You've got a completely free Saturday. What actually excites you?",
    options: [
      { text: "Building a small app or game", tag: "technology" },
      { text: "Volunteering at an animal shelter", tag: "nature_biology" },
      { text: "Helping family track shop accounts", tag: "numbers_finance" },
      { text: "Organising a neighbourhood tournament", tag: "leading_managing" },
    ],
  },
  {
    kicker: "Quest 7 · Newsfeed",
    title: "Which headline would you actually click on?",
    options: [
      { text: "\"Scientists discover a surprising new material\"", tag: "research_curiosity" },
      { text: "\"This building's design is breaking the internet\"", tag: "creativity_design" },
      { text: "\"How one community rebuilt itself together\"", tag: "helping_people" },
      { text: "\"Can you crack this viral logic puzzle?\"", tag: "problem_solving" },
    ],
  },
  {
    kicker: "Quest 8 · Free Elective Hour",
    title: "Your school adds one free elective hour. You pick...",
    options: [
      { text: "Managing the elective's budget & records", tag: "numbers_finance" },
      { text: "An independent research project", tag: "research_curiosity" },
      { text: "The school garden / eco club", tag: "nature_biology" },
      { text: "The coding club", tag: "technology" },
    ],
  },
];

const SWIPE_CARDS = [
  { text: "Debugging tricky code until it finally works", tag: "technology" },
  { text: "Reading about how the stock market moves", tag: "numbers_finance" },
  { text: "Redesigning your room's whole layout", tag: "creativity_design" },
  { text: "Tutoring a junior who's stuck on a topic", tag: "helping_people" },
  { text: "Bird-watching or exploring a nature trail", tag: "nature_biology" },
  { text: "Leading your team's presentation to the class", tag: "leading_managing" },
  { text: "Solving a Sudoku or logic puzzle for fun", tag: "problem_solving" },
  { text: "Reading a deep-dive article just out of curiosity", tag: "research_curiosity" },
  { text: "Managing your own pocket money / a small budget", tag: "numbers_finance" },
  { text: "Sketching, doodling, or editing videos", tag: "creativity_design" },
  { text: "Volunteering at a health camp or donation drive", tag: "helping_people" },
  { text: "Building something with your hands — model, gadget, robot", tag: "technology" },
];

const DUELS = [
  {
    prompt: "Which future sounds more like you?",
    left: { text: "Grinding through JEE/NEET-style mock tests for 2 years", key: "competitive_exam_willingness", value: true },
    right: { text: "A path with fewer high-pressure entrance exams", key: "competitive_exam_willingness", value: false },
  },
  {
    prompt: "What matters more for your family right now?",
    left: { text: "Keeping course & coaching costs low", key: "budget_constraint", value: true },
    right: { text: "Cost isn't the biggest factor for us", key: "budget_constraint", value: false },
  },
];

/* ---------------- Game state ---------------- */

const state = {
  level: 1,
  xp: 0,
  maxXp: SCENARIOS.length * 10 + SWIPE_CARDS.length * 8 + DUELS.length * 5 + 10, // +10 for character stats
  studentClass: "10",
  board: "cbse",
  scores: { math: 60, science: 60, biology: 0, english: 60, sst: 60 },
  useSeparateBio: false,
  scenarioIndex: 0,
  swipeIndex: 0,
  tagPoints: {},
  tagAppearances: {},
  preferences: {},
};

// Pre-compute how many times each tag appears (for normalising to 0-100 later)
[...SCENARIOS.flatMap((s) => s.options), ...SWIPE_CARDS].forEach((opt) => {
  state.tagAppearances[opt.tag] = (state.tagAppearances[opt.tag] || 0) + 10;
});

const stage = document.getElementById("gameStage");

document.addEventListener("DOMContentLoaded", () => {
  if (stage) renderLevel1();
});

/* ---------------- Shared helpers ---------------- */

function addXp(amount) {
  state.xp = Math.min(state.xp + amount, state.maxXp);
  const pct = Math.round((state.xp / state.maxXp) * 100);
  document.getElementById("xpFill").style.width = pct + "%";
  document.getElementById("xpValue").textContent = state.xp;
  showXpToast("+" + amount + " XP");
}

function showXpToast(text) {
  const toast = document.getElementById("xpToast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showXpToast._t);
  showXpToast._t = setTimeout(() => toast.classList.remove("show"), 900);
}

function setHudLevel(level) {
  document.querySelectorAll(".hud-dot").forEach((dot) => {
    const n = Number(dot.dataset.level);
    dot.classList.toggle("active", n === level);
    dot.classList.toggle("done", n < level);
  });
}

function showLevelBanner(title, sub) {
  const banner = document.getElementById("levelBanner");
  banner.innerHTML = `${title}<small>${sub}</small>`;
  banner.classList.add("show");
  setTimeout(() => banner.classList.remove("show"), 1100);
}

function launchConfetti() {
  const colors = ["#E8A33D", "#2F6F6B", "#C1495F", "#16213A"];
  const layer = document.getElementById("confettiLayer");
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 2 + Math.random() * 1.5 + "s";
    piece.style.animationDelay = Math.random() * 0.4 + "s";
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

/* ---------------- LEVEL 1: Character stats ---------------- */

function renderLevel1() {
  setHudLevel(1);
  stage.innerHTML = `
    <div class="quest-card">
      <div class="quest-kicker">Level 1 · Build your character</div>
      <h2 class="quest-title">Set your academic stats</h2>
      <p class="quest-sub">Use your most recent term / practice-exam marks. Drag each slider — think of it as building your character sheet.</p>

      <div class="form-row">
        <div class="form-group">
          <label for="studentClass">Class</label>
          <select id="studentClass">
            <option value="9">Class 9</option>
            <option value="10" selected>Class 10</option>
          </select>
        </div>
        <div class="form-group">
          <label for="board">Board</label>
          <select id="board">
            <option value="cbse" selected>CBSE</option>
            <option value="icse">ICSE</option>
            <option value="state">State Board</option>
          </select>
        </div>
      </div>

      ${statRow("math", "🔢 Mathematics", state.scores.math)}
      ${statRow("science", "🔬 Science", state.scores.science)}
      ${statRow("english", "📖 English", state.scores.english)}
      ${statRow("sst", "🌍 Social Science", state.scores.sst)}

      <label class="check-card" style="margin-bottom:1rem;">
        <input type="checkbox" id="bioToggle">
        <span>I have a separate Biology mark (different from combined Science)</span>
      </label>
      <div id="bioRow" style="display:none;">${statRow("biology", "🧬 Biology", 60)}</div>

      <div class="power-meter">
        <span class="label">CHARACTER POWER LEVEL</span>
        <span class="value" id="powerValue">--</span>
      </div>

      <div class="game-nav">
        <span></span>
        <button class="btn-primary btn-large" id="toLevel2">Begin the quest →</button>
      </div>
    </div>`;

  ["math", "science", "english", "sst"].forEach(wireSlider);

  document.getElementById("studentClass").addEventListener("change", (e) => (state.studentClass = e.target.value));
  document.getElementById("board").addEventListener("change", (e) => (state.board = e.target.value));

  document.getElementById("bioToggle").addEventListener("change", (e) => {
    state.useSeparateBio = e.target.checked;
    document.getElementById("bioRow").style.display = e.target.checked ? "block" : "none";
    if (e.target.checked) wireSlider("biology");
    updatePower();
  });

  updatePower();

  document.getElementById("toLevel2").addEventListener("click", () => {
    addXp(10);
    showLevelBanner("Level 2 Unlocked!", "The Story Quest begins");
    setTimeout(renderLevel2, 250);
  });
}

function statRow(id, label, value) {
  return `
    <div class="stat-row">
      <div class="stat-row-head">
        <label for="${id}">${label}</label>
        <span class="stat-val" id="${id}Val">${value}%</span>
      </div>
      <input type="range" id="${id}" min="0" max="100" value="${value}">
    </div>`;
}

function wireSlider(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    state.scores[id] = v;
    document.getElementById(id + "Val").textContent = v + "%";
    updatePower();
  });
}

function updatePower() {
  const vals = [state.scores.math, state.scores.science, state.scores.english, state.scores.sst];
  if (state.useSeparateBio) vals.push(state.scores.biology);
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const el = document.getElementById("powerValue");
  if (el) el.textContent = avg + " / 100";
}

/* ---------------- LEVEL 2: Story quest ---------------- */

function renderLevel2() {
  setHudLevel(2);
  if (state.scenarioIndex >= SCENARIOS.length) {
    showLevelBanner("Level 3 Unlocked!", "Time for Like or Skip");
    setTimeout(renderLevel3, 250);
    return;
  }
  const scenario = SCENARIOS[state.scenarioIndex];

  stage.innerHTML = `
    <div class="quest-card">
      <div class="quest-kicker">${scenario.kicker}</div>
      <div class="quest-counter">Scenario ${state.scenarioIndex + 1} of ${SCENARIOS.length}</div>
      <h2 class="quest-title">${scenario.title}</h2>
      <div class="option-grid">
        ${scenario.options
          .map((opt, i) => `<button class="option-btn" data-i="${i}">${opt.text}</button>`)
          .join("")}
      </div>
    </div>`;

  stage.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = scenario.options[Number(btn.dataset.i)];
      state.tagPoints[opt.tag] = (state.tagPoints[opt.tag] || 0) + 10;
      addXp(10);
      state.scenarioIndex++;
      renderLevel2();
    });
  });
}

/* ---------------- LEVEL 3: Swipe / Like or Skip ---------------- */

function renderLevel3() {
  setHudLevel(3);
  if (state.swipeIndex >= SWIPE_CARDS.length) {
    showLevelBanner("Level 4 Unlocked!", "Choose Your Path");
    setTimeout(renderLevel4, 250);
    return;
  }
  const card = SWIPE_CARDS[state.swipeIndex];

  stage.innerHTML = `
    <div class="quest-card">
      <div class="quest-kicker">Level 3 · Like or Skip</div>
      <div class="quest-counter">Card ${state.swipeIndex + 1} of ${SWIPE_CARDS.length}</div>
      <h2 class="quest-title" style="margin-bottom:1.25rem;">Would you enjoy this?</h2>
      <div class="swipe-deck">
        <div class="swipe-card" id="activeCard">${card.text}</div>
      </div>
      <div class="swipe-actions">
        <button class="swipe-btn skip" id="skipBtn" title="Skip">✕</button>
        <button class="swipe-btn like" id="likeBtn" title="Like">♥</button>
      </div>
      <p class="swipe-hint">Tap ♥ if this sounds fun to you, ✕ if it really doesn't</p>
    </div>`;

  const activeCard = document.getElementById("activeCard");

  document.getElementById("likeBtn").addEventListener("click", () => {
    activeCard.classList.add("leaving-like");
    state.tagPoints[card.tag] = (state.tagPoints[card.tag] || 0) + 10;
    addXp(8);
    advanceSwipe();
  });

  document.getElementById("skipBtn").addEventListener("click", () => {
    activeCard.classList.add("leaving-skip");
    addXp(3);
    advanceSwipe();
  });
}

function advanceSwipe() {
  state.swipeIndex++;
  setTimeout(renderLevel3, 260);
}

/* ---------------- LEVEL 4: Duel (this-or-that) ---------------- */

function renderLevel4(duelIndex = 0) {
  setHudLevel(4);
  if (duelIndex >= DUELS.length) {
    finishGame();
    return;
  }
  const duel = DUELS[duelIndex];

  stage.innerHTML = `
    <div class="quest-card">
      <div class="quest-kicker">Level 4 · Choose Your Path</div>
      <div class="quest-counter">Duel ${duelIndex + 1} of ${DUELS.length}</div>
      <h2 class="quest-title">${duel.prompt}</h2>
      <div class="duel-row">
        <button class="duel-side" id="leftSide">${duel.left.text}</button>
        <div class="duel-vs">VS</div>
        <button class="duel-side" id="rightSide">${duel.right.text}</button>
      </div>
    </div>`;

  document.getElementById("leftSide").addEventListener("click", () => {
    state.preferences[duel.left.key] = duel.left.value;
    addXp(5);
    renderLevel4(duelIndex + 1);
  });
  document.getElementById("rightSide").addEventListener("click", () => {
    state.preferences[duel.right.key] = duel.right.value;
    addXp(5);
    renderLevel4(duelIndex + 1);
  });
}

/* ---------------- Finish: build payload & submit ---------------- */

function finishGame() {
  launchConfetti();
  stage.innerHTML = `
    <div class="quest-card" style="text-align:center;">
      <div class="quest-kicker">Quest complete!</div>
      <h2 class="quest-title">Building your Explorer Profile…</h2>
      <p class="quest-sub">Crunching your stats, quest choices and preferences into a recommendation.</p>
    </div>`;

  // Normalise tag points (0-100) using how many times each tag appeared
  const interestWeights = {};
  Object.keys(state.tagAppearances).forEach((tag) => {
    const earned = state.tagPoints[tag] || 0;
    const possible = state.tagAppearances[tag];
    interestWeights[tag] = Math.round((earned / possible) * 100);
  });

  const payload = {
    class: state.studentClass,
    board: state.board,
    academic_scores: {
      math: state.scores.math,
      science: state.scores.science,
      biology: state.useSeparateBio ? state.scores.biology : 0,
      english: state.scores.english,
      sst: state.scores.sst,
    },
    interest_weights: interestWeights,
    preferences: {
      competitive_exam_willingness: state.preferences.competitive_exam_willingness !== false,
      budget_constraint: !!state.preferences.budget_constraint,
    },
  };

  // Fully offline: call the local JS engine directly, no server needed.
  try {
    const resultData = CareerGuidanceEngine.getRecommendations(payload);
    sessionStorage.setItem("careerGuideResults", JSON.stringify(resultData));
    setTimeout(() => (window.location.href = "results.html"), 900);
  } catch (err) {
    stage.innerHTML = `
      <div class="quest-card">
        <p>Something went wrong generating your report: ${err.message}</p>
        <button class="btn-primary" onclick="location.reload()">Try again</button>
      </div>`;
  }
}
