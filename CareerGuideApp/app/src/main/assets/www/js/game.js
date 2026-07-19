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
  selections: [],
};

// Pre-compute how many times each tag appears (for normalising to 0-100 later)
[...SCENARIOS.flatMap((s) => s.options), ...SWIPE_CARDS].forEach((opt) => {
  state.tagAppearances[opt.tag] = (state.tagAppearances[opt.tag] || 0) + 10;
});

// Groq AI Integration Constants
const getGroqApiKey = () => {
  if (window.AndroidBridge && typeof window.AndroidBridge.getGroqApiKey === "function") {
    const key = window.AndroidBridge.getGroqApiKey();
    if (key) return key;
  }
  // Key is injected at build time via BuildConfig (AndroidBridge)
  return "";
};
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Returns true when the device has internet connectivity
const isOnline = () => navigator.onLine !== false;

// Backup classic questions for fallback
const CLASSIC_SCENARIOS = JSON.parse(JSON.stringify(SCENARIOS));
const CLASSIC_SWIPE_CARDS = JSON.parse(JSON.stringify(SWIPE_CARDS));
const CLASSIC_DUELS = JSON.parse(JSON.stringify(DUELS));

function restoreClassicQuestions() {
  SCENARIOS.length = 0;
  SCENARIOS.push(...CLASSIC_SCENARIOS);
  SWIPE_CARDS.length = 0;
  SWIPE_CARDS.push(...CLASSIC_SWIPE_CARDS);
  DUELS.length = 0;
  DUELS.push(...CLASSIC_DUELS);

  state.tagAppearances = {};
  [...SCENARIOS.flatMap((s) => s.options), ...SWIPE_CARDS].forEach((opt) => {
    state.tagAppearances[opt.tag] = (state.tagAppearances[opt.tag] || 0) + 10;
  });
  state.maxXp = SCENARIOS.length * 10 + SWIPE_CARDS.length * 8 + DUELS.length * 5 + 10;
}

function restoreClassicSwipeCards() {
  SWIPE_CARDS.length = 0;
  SWIPE_CARDS.push(...CLASSIC_SWIPE_CARDS);

  state.tagAppearances = {};
  [...SCENARIOS.flatMap((s) => s.options), ...SWIPE_CARDS].forEach((opt) => {
    state.tagAppearances[opt.tag] = (state.tagAppearances[opt.tag] || 0) + 10;
  });
  state.maxXp = SCENARIOS.length * 10 + SWIPE_CARDS.length * 8 + DUELS.length * 5 + 10;
}

async function fetchGroqSwipeCards(apiKey, model, selections, scores) {
  const systemPrompt = `You are a career guidance JSON generator. Your output must be a valid JSON object.
Generate exactly 12 custom swipe cards for Class 9-10 Indian students.

The tone must be frank, honest, and realistic. Make the statements brief, clear, natural, and easy to read.

### Content & Theme Guidelines:
Weave in activities and interests from Science (PCM/PCB), Commerce, and Arts/Humanities streams.
Based on the student's preferred tags in the story quest, you must bias the card selection:
- Generate more statements for tags they liked/selected in the scenarios.
- Generate fewer statements for tags they did not select/skipped.

Each card has a text statement and its matching interest tag.
Interest tags must be exactly one of: "problem_solving", "leading_managing", "creativity_design", "research_curiosity", "technology", "helping_people", "numbers_finance", "nature_biology".

### Output JSON Format:
{
  "swipeCards": [
    { "text": "[Brief activity statement or preference]", "tag": "[interest tag]" }
  ]
}

Do NOT include any markdown, backticks, or text before/after the JSON. Just output raw valid JSON.`;

  const userPrompt = `Student Profile and Scenario Selections:
- Academic Scores: ${JSON.stringify(scores)}
- Selected tags in Scenario Quest: ${JSON.stringify(selections)}

Please generate 12 swipe cards tailored specifically to these preferences.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const content = json.choices[0].message.content;
  return JSON.parse(content).swipeCards;
}

async function fetchGroqQuestions(apiKey, model) {
  const statusEl = document.getElementById("loadingStatus");
  if (statusEl) statusEl.textContent = "Connecting to Groq API...";
  
  const systemPrompt = `You are a career guidance JSON generator. Your output must be a valid JSON object.
Generate a custom career quest for Class 9-10 Indian students.

The tone must be frank, honest, and realistic. Make the scenarios and choices brief, clear, natural, and easy to read so they are highly attractive and engaging (avoiding wordy paragraphs or long interrogations).

### Content & Theme Guidelines:
Do not focus solely on software, apps, or game development. Scenarios and option choices must reflect the diversity of the three main streams in the Indian schooling system:
1. **Science (PCM/PCB)**: Physics/Chemistry lab experiments, Biology (nature, botany, medicine), Math puzzles, engineering systems, Space, and astronomy.
2. **Commerce**: Accountancy, budget management, pocket money decisions, school business stalls, trading, economics, and business organization.
3. **Arts / Humanities / Design**: Debates, journalism, historical research, public speaking, psychology, fine arts/design, civics, and legal arguments.

Avoid generic Yes/No choices. Make all options active, specific, and realistic actions.
### Good Examples of Scenario & Options:
- **Science (PCM/PCB)**: Title: "A classmate collapses in school. What is your immediate action?"
  - Option: "Perform basic first aid" (nature_biology / helping_people)
  - Option: "Diagnose symptoms logically" (problem_solving)
- **Commerce**: Title: "You have 500 Rs pocket money. How do you manage it?"
  - Option: "Invest it to grow" (numbers_finance)
  - Option: "Start a tiny tuck-shop" (leading_managing)
- **Arts / Humanities / Design**: Title: "Your school starts a new magazine. How do you contribute?"
  - Option: "Write editorial columns" (creativity_design)
  - Option: "Conduct investigative interviews" (research_curiosity)

Generate exactly 8 scenarios.

### Output JSON Format:
{
  "scenarios": [
    {
      "kicker": "Level 2 · [LOTS or HOTS or Critical Thinking]: [Short Name]",
      "title": "[Brief, realistic scenario question]",
      "type": "lots" | "hots" | "critical_thinking",
      "options": [
        { "text": "[Short active choice/response]", "tag": "[interest tag]" },
        ... (exactly 4 options)
      ]
    }
  ]
}

### Distribution Guidelines:
1. SCENARIOS (exactly 8):
   - 3 scenarios must be LOTS (Lower-Order Thinking Skills: basic preferences, simple choice).
   - 3 scenarios must be HOTS (Higher-Order Thinking Skills: creation, design, evaluation).
   - 2 scenarios must be Critical Thinking (resolving arguments, handling project failures, troubleshooting).
   - Each option must map to one of the 8 tags below. Across the 4 options of a scenario, you MUST use EXACTLY 4 distinct tags:
     - "problem_solving"
     - "leading_managing"
     - "creativity_design"
     - "research_curiosity"
     - "technology"
     - "helping_people"
     - "numbers_finance"
     - "nature_biology"

Do NOT include any markdown, backticks, or text before/after the JSON. Just output raw valid JSON.`;

  const userPrompt = `Generate a personalized career quest for a student with the following academic profile:
- Class: Class ${state.studentClass}
- Board: ${state.board.toUpperCase()}
- Mathematics score: ${state.scores.math}%
- Science score: ${state.scores.science}%
- English score: ${state.scores.english}%
- Social Science (SST) score: ${state.scores.sst}%
- Biology score: ${state.useSeparateBio ? state.scores.biology + "%" : "Combined with Science"}

Please automatically analyze these scores to infer the student's academic strengths and potential interests. Tailor the scenarios and swipe card statements to be highly relevant to their profile (e.g. if they have high math/science scores, weave in tech/science concepts; if they have high english/sst scores, weave in creative/social/arts concepts; if they have balanced scores, keep it diverse). Make sure the questions are frank, honest, and direct.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch (e) { }
    const msg = parsedErr?.error?.message || response.statusText || "HTTP Error";
    throw new Error(`Groq API Error: ${msg}`);
  }

  if (statusEl) statusEl.textContent = "Parsing generated quest...";
  const json = await response.json();
  const content = json.choices[0].message.content;
  return JSON.parse(content);
}

async function fetchGroqRecommendations(apiKey, model, payload) {
  const systemPrompt = `You are an expert career guidance counselor for Indian Class 9-10 students.
Analyze the student's academic profile, quest selections, and preferences to generate a highly personalized, deep career recommendation report.
Your output must be a valid JSON object matching the exact structure below.

The tone of your explanations, career paths, and advice must be frank, direct, honest, and realistic. Address real challenges, workloads, entrance exams, and compromises without sugarcoating or using exaggerated language. Avoid Gen Z slang.

### Expected JSON Output Schema:
{
  "primary_recommendation": {
    "stream": "[A specific stream, e.g. 'Science (PCM)', 'Science (PCB)', 'Commerce with Maths', 'Commerce without Maths', 'Arts / Humanities']",
    "tag": "science" | "commerce" | "arts",
    "confidence": [Match percentage, e.g., 88],
    "difficulty": "Moderate" | "High" | "Very High" | "Extremely High",
    "subjects": [List of core subjects, e.g. ["Physics", "Chemistry", "Mathematics", "English"]],
    "why": [
      "A list of 3-4 personalized, frank bullet points explaining WHY this stream fits them. Reference their actual quest choices and academic scores directly (e.g. 'Your high math score (95%) combined with your preference for technical model-building in scenarios shows a strong analytical bent.')"
    ],
    "top_careers": [
      {
        "name": "[Career name, e.g. 'Software Engineer', 'Data Scientist']",
        "exams": [List of common exams, e.g. ["JEE Main", "JEE Advanced"]],
        "duration": "[e.g. '4 years']",
        "scope": "[e.g. 'Very High']"
      }
    ],
    "next_steps": [
      "A list of 3-4 concrete, frank actionable steps starting this month tailored for this student."
    ]
  },
  "alternatives": [
    // You MUST include EXACTLY 3 alternative streams representing other potential pathways
    {
      "stream": "[Alternative stream name]",
      "tag": "science" | "commerce" | "arts",
      "confidence": [Match percentage, e.g., 75],
      "subjects": [List of core subjects],
      "top_careers": [
        { "name": "[Career name]" }
      ]
    }
  ],
  "general_advice": [
    "A list of 2-3 frank, direct general advice tips for this student."
  ]
}

Ensure that:
- The stream tags in primary_recommendation and alternatives must be exactly one of: "science", "commerce", "arts".
- The alternative streams match the student's secondary interests.
- You generate EXACTLY three different alternative stream options in the "alternatives" list (do not generate fewer or more).
- Return ONLY the raw valid JSON object. No markdown, no backticks.`;

  const userPrompt = `Student Profile and Quest Results:
- Class: Class ${payload.class}
- Board: ${payload.board.toUpperCase()}
- Academic Scores: ${JSON.stringify(payload.academic_scores)}
- Interest Weights from Quest: ${JSON.stringify(payload.interest_weights)}
- Preferences: ${JSON.stringify(payload.preferences)}
- Detailed Quest Choices: ${JSON.stringify(payload.selections)}`;

  // 30-second timeout so we never hang the spinner indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const content = json.choices[0].message.content;
    return JSON.parse(content);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Entry point for Level 2 — checks connectivity first, then routes to
 * AI-generated questions (online) or hardcoded classic questions (offline).
 */
function checkConnectivityAndStart() {
  if (!isOnline()) {
    // Device is offline — silently fall back to classic questions
    restoreClassicQuestions();
    addXp(10);
    showLevelBanner("Level 2 Unlocked!", "The Story Quest begins");
    setTimeout(renderLevel2, 250);
    return;
  }
  startAiQuest();
}

async function startAiQuest() {
  const apiKey = getGroqApiKey();

  stage.innerHTML = `
    <div class="quest-card" style="text-align: center; padding: 3.5rem 2rem;">
      <div class="spinner-container" style="margin-bottom: 1.5rem;">
        <div class="ai-spinner"></div>
      </div>
      <h2 class="quest-title" id="loadingTitle">Personalizing Your Quest...</h2>
      <p class="quest-sub" id="loadingSub">Analyzing your academic scores to tailor your story scenarios...</p>
      <div id="loadingStatus" style="font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: var(--teal); margin-top: 1rem; font-weight: 600;">Connecting to API...</div>
    </div>`;

  try {
    const data = await fetchGroqQuestions(apiKey, GROQ_MODEL);

    if (data && data.scenarios && data.scenarios.length === 8) {
      SCENARIOS.length = 0;
      SCENARIOS.push(...data.scenarios);

      state.tagAppearances = {};
      SCENARIOS.flatMap((s) => s.options).forEach((opt) => {
        state.tagAppearances[opt.tag] = (state.tagAppearances[opt.tag] || 0) + 10;
      });

      state.maxXp = SCENARIOS.length * 10 + 12 * 8 + DUELS.length * 5 + 10;
      state.scenarioIndex = 0;
      state.swipeIndex = 0;
      state.xp = 0;

      document.getElementById("loadingTitle").textContent = "Quest Ready!";
      document.getElementById("loadingSub").textContent = "Get ready for a highly customized career assessment.";
      document.getElementById("loadingStatus").textContent = "Launching Level 2...";

      setTimeout(() => {
        addXp(10);
        showLevelBanner("Level 2 Unlocked!", "The Story Quest begins");
        setTimeout(renderLevel2, 250);
      }, 1000);
    } else {
      throw new Error("Received invalid quest structure (expected 8 scenarios).");
    }
  } catch (err) {
    console.error("AI quest failed, falling back to classic questions:", err);
    // Auto-fallback: seamlessly continue with hardcoded questions instead of
    // showing an error screen. The user gets a smooth experience regardless.
    restoreClassicQuestions();
    addXp(10);
    showLevelBanner("Level 2 Unlocked!", "The Story Quest begins");
    setTimeout(renderLevel2, 250);
  }
}

const stage = document.getElementById("gameStage");

document.addEventListener("DOMContentLoaded", () => {
  if (stage) renderLevel1();

  // Exit Confirmation Modal Logic
  const backBtn = document.getElementById("navBackBtn");
  const exitModal = document.getElementById("exitModal");
  const confirmExitBtn = document.getElementById("confirmExitBtn");
  const cancelExitBtn = document.getElementById("cancelExitBtn");

  if (backBtn && exitModal) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      exitModal.classList.add("show");
    });
  }

  if (cancelExitBtn && exitModal) {
    cancelExitBtn.addEventListener("click", () => {
      exitModal.classList.remove("show");
    });
  }

  if (confirmExitBtn) {
    confirmExitBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (exitModal) {
    exitModal.addEventListener("click", (e) => {
      if (e.target === exitModal) {
        exitModal.classList.remove("show");
      }
    });
  }

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
    checkConnectivityAndStart();
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
    if (isOnline()) {
      stage.innerHTML = `
        <div class="quest-card" style="text-align: center; padding: 3.5rem 2rem;">
          <div class="spinner-container" style="margin-bottom: 1.5rem;">
            <div class="ai-spinner"></div>
          </div>
          <h2 class="quest-title" id="loadingTitle">Personalizing Swipe Cards...</h2>
          <p class="quest-sub" id="loadingSub">Generating activities tailored specifically to your quest choices...</p>
          <div id="loadingStatus" style="font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: var(--teal); margin-top: 1rem; font-weight: 600;">Connecting to API...</div>
        </div>`;

      const selectedTags = state.selections
        .filter(s => s.type === "scenario")
        .map(s => s.tag);

      fetchGroqSwipeCards(getGroqApiKey(), GROQ_MODEL, selectedTags, state.scores)
        .then((cards) => {
          if (cards && cards.length === 12) {
            SWIPE_CARDS.length = 0;
            SWIPE_CARDS.push(...cards);

            SWIPE_CARDS.forEach((opt) => {
              state.tagAppearances[opt.tag] = (state.tagAppearances[opt.tag] || 0) + 10;
            });
            state.maxXp = SCENARIOS.length * 10 + SWIPE_CARDS.length * 8 + DUELS.length * 5 + 10;
          } else {
            restoreClassicSwipeCards();
          }
          showLevelBanner("Level 3 Unlocked!", "Time for Like or Skip");
          setTimeout(renderLevel3, 250);
        })
        .catch((err) => {
          console.warn("Failed to generate custom swipe cards, falling back to classic:", err);
          restoreClassicSwipeCards();
          showLevelBanner("Level 3 Unlocked!", "Time for Like or Skip");
          setTimeout(renderLevel3, 250);
        });
    } else {
      restoreClassicSwipeCards();
      showLevelBanner("Level 3 Unlocked!", "Time for Like or Skip");
      setTimeout(renderLevel3, 250);
    }
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
      
      // Store selection
      state.selections.push({
        type: "scenario",
        scenario_title: scenario.title,
        chosen_option: opt.text,
        tag: opt.tag
      });

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
    
    // Store selection
    state.selections.push({
      type: "swipe_card",
      card_text: card.text,
      liked: true,
      tag: card.tag
    });

    addXp(8);
    advanceSwipe();
  });

  document.getElementById("skipBtn").addEventListener("click", () => {
    activeCard.classList.add("leaving-skip");
    
    // Store selection
    state.selections.push({
      type: "swipe_card",
      card_text: card.text,
      liked: false,
      tag: card.tag
    });

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

async function finishGame() {
  launchConfetti();
  stage.innerHTML = `
    <div class="quest-card" style="text-align:center;">
      <div class="quest-kicker">Quest complete!</div>
      <h2 class="quest-title" id="finishTitle">Analyzing your profile…</h2>
      <p class="quest-sub" id="finishSub">Evaluating your quest choices, academic scores, and preferences to build a custom career report.</p>
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
    selections: state.selections
  };

  // STEP 1: Always run the local hardcoded engine first — instant, works offline.
  // This guarantees the user always gets a result even if AI fails or times out.
  const localResult = CareerGuidanceEngine.getRecommendations(payload);

  if (!isOnline()) {
    // Offline: use local engine result only
    sessionStorage.setItem("careerGuideResults", JSON.stringify(localResult));
    setTimeout(() => (window.location.href = "results.html"), 900);
    return;
  }

  // STEP 2: Online — try to enhance local result with AI analysis.
  // The local engine result is already saved as a fallback. AI enriches the "why"
  // bullets and next_steps with personalized language referencing actual quest choices.
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    // No key available — just use local result
    sessionStorage.setItem("careerGuideResults", JSON.stringify(localResult));
    setTimeout(() => (window.location.href = "results.html"), 900);
    return;
  }

  try {
    // Merge AI's personalized "why" and "next_steps" into the local engine's
    // structurally-correct recommendation, so we get the best of both.
    const aiResult = await fetchGroqRecommendations(apiKey, GROQ_MODEL, payload);

    // Build a hybrid: use local engine's stream ranking (deterministic),
    // but use AI's richer personalized text for why/next_steps/general_advice.
    const hybridResult = JSON.parse(JSON.stringify(localResult)); // deep clone

    if (aiResult && aiResult.primary_recommendation) {
      const aiPrimary = aiResult.primary_recommendation;
      // Enrich the local primary recommendation with AI text
      if (aiPrimary.why && aiPrimary.why.length) {
        hybridResult.primary_recommendation.why = aiPrimary.why;
      }
      if (aiPrimary.next_steps && aiPrimary.next_steps.length) {
        hybridResult.primary_recommendation.next_steps = aiPrimary.next_steps;
      }
    }

    if (aiResult && aiResult.general_advice && aiResult.general_advice.length) {
      hybridResult.general_advice = aiResult.general_advice;
    }

    hybridResult.ai_enhanced = true;
    sessionStorage.setItem("careerGuideResults", JSON.stringify(hybridResult));
  } catch (err) {
    console.warn("AI enhancement failed, using local engine result:", err);
    // Fallback: the local engine result works fine on its own
    sessionStorage.setItem("careerGuideResults", JSON.stringify(localResult));
  }

  setTimeout(() => (window.location.href = "results.html"), 900);
}
