/* =========================================================
   main.js — renders the results.html report from the JSON
   produced by career_engine.js (via game.js). Offline app —
   no server calls anywhere in this file.
   ========================================================= */

const STREAM_COLORS = {
  science: "#E8A33D",
  commerce: "#2F6F6B",
  arts: "#C1495F",
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("resultsRoot")) renderResults();
});

function renderResults() {
  const raw = sessionStorage.getItem("careerGuideResults");

  if (!raw) {
    document.getElementById("primaryContainer").innerHTML =
      `<div class="primary-card"><p>No assessment data found. Please
      <a href="/assessment">take the assessment</a> first.</p></div>`;
    return;
  }

  const data = JSON.parse(raw);
  const primary = data.primary_recommendation;
  const alternatives = data.alternatives || [];
  const advice = data.general_advice || [];

  if (primary) {
    document.getElementById("primaryContainer").innerHTML = buildPrimaryCard(primary);
    document.getElementById("timelineList").innerHTML = primary.next_steps
      .map((step, i) => `
        <div class="timeline-item">
          <div class="timeline-number">${i + 1}</div>
          <div class="timeline-content">${escapeHtml(step)}</div>
        </div>`)
      .join("");
    document.getElementById("actionPlanSection").style.display = "block";
  }

  if (alternatives.length) {
    document.getElementById("alternativesGrid").innerHTML = alternatives
      .map((alt) => buildAlternativeCard(alt))
      .join("");
    document.getElementById("alternativesSection").style.display = "block";
  }

  document.getElementById("adviceList").innerHTML = advice
    .map((tip) => `<li>${escapeHtml(tip)}</li>`)
    .join("");
}

function buildPrimaryCard(rec) {
  const color = STREAM_COLORS[rec.tag] || STREAM_COLORS.science;
  return `
    <div class="primary-card" style="--stream-color:${color}">
      <div class="match-badge"><span class="pct">${rec.confidence}%</span><span class="lbl">match</span></div>
      <h2 class="stream-title">${escapeHtml(rec.stream)}</h2>
      <div class="stream-meta">
        <span>Difficulty: ${escapeHtml(rec.difficulty)}</span>
        <span>${rec.subjects.length} core subjects</span>
      </div>
      <p><strong>Why this fits you:</strong></p>
      <ul class="why-list">
        ${rec.why.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
      </ul>
      <p><strong>Top career paths:</strong></p>
      <div class="careers-grid">
        ${rec.top_careers.map(buildCareerCard).join("")}
      </div>
    </div>`;
}

function buildCareerCard(career) {
  return `
    <div class="career-card">
      <h5>${escapeHtml(career.name)}</h5>
      <p><strong>Exams:</strong> ${escapeHtml((career.exams || []).join(", "))}</p>
      <p><strong>Duration:</strong> ${escapeHtml(career.duration || "—")}</p>
      <p><strong>Scope:</strong> ${escapeHtml(career.scope || "—")}</p>
    </div>`;
}

function buildAlternativeCard(alt) {
  const color = STREAM_COLORS[alt.tag] || STREAM_COLORS.science;
  return `
    <div class="alternative-card" style="--stream-color:${color}">
      <span class="alt-match" style="background:${color}">${alt.confidence}% match</span>
      <h4>${escapeHtml(alt.stream)}</h4>
      <p class="alt-subjects">${escapeHtml(alt.subjects.join(", "))}</p>
      <ul class="alt-careers">
        ${alt.top_careers.slice(0, 3).map((c) => `<li>${escapeHtml(c.name)}</li>`).join("")}
      </ul>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}
