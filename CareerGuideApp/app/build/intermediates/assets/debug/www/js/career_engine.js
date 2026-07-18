/* =========================================================
   career_engine.js
   -----------------
   Offline JS port of career_engine.py — identical scoring logic,
   so the Android app needs no server/internet connection at all.
   ========================================================= */

const CareerGuidanceEngine = (function () {
  const streamData = {
    science_pcm: {
      name: "Science (PCM – Physics, Chemistry, Maths)",
      tag: "science",
      subjects: ["Physics", "Chemistry", "Mathematics", "English", "Optional"],
      difficulty: "High",
      careers: [
        { name: "Engineering (B.Tech / B.E.)", exams: ["JEE Main", "JEE Advanced", "State CETs"], duration: "4 years", scope: "Very High", avg_salary: "₹4–12 LPA (starting)" },
        { name: "Architecture (B.Arch)", exams: ["NATA", "JEE Paper 2"], duration: "5 years", scope: "Medium", avg_salary: "₹3–8 LPA" },
        { name: "Data Science & AI", exams: ["JEE / State CUET"], duration: "3–4 years", scope: "Very High", avg_salary: "₹5–15 LPA" },
        { name: "Defence Services (NDA)", exams: ["NDA (UPSC)", "SSB Interview"], duration: "3 yrs training + service", scope: "High", avg_salary: "Salary + pension" },
        { name: "Pure Sciences (B.Sc → M.Sc → PhD)", exams: ["CUET", "IISc / IIT-JAM"], duration: "3 years", scope: "Medium", avg_salary: "Research/teaching track" },
      ],
    },
    science_pcb: {
      name: "Science (PCB – Physics, Chemistry, Biology)",
      tag: "science",
      subjects: ["Physics", "Chemistry", "Biology", "English", "Optional"],
      difficulty: "Very High",
      careers: [
        { name: "MBBS (Doctor)", exams: ["NEET-UG"], duration: "5.5 years", scope: "Very High", avg_salary: "High long-term, high competition" },
        { name: "BDS (Dental Surgeon)", exams: ["NEET-UG"], duration: "5 years", scope: "High", avg_salary: "Moderate–High" },
        { name: "B.Pharm (Pharmacy)", exams: ["State entrance exams"], duration: "4 years", scope: "High", avg_salary: "₹3–7 LPA" },
        { name: "B.Sc Nursing", exams: ["AIIMS Nursing", "State entrance"], duration: "4 years", scope: "High (overseas demand)", avg_salary: "₹3–6 LPA + abroad options" },
        { name: "BVSc (Veterinary Science)", exams: ["NEET / State vet exams"], duration: "5 years", scope: "Medium", avg_salary: "Govt jobs available" },
        { name: "Biotechnology / Microbiology", exams: ["CUET"], duration: "3–4 years", scope: "High", avg_salary: "₹3–8 LPA" },
      ],
    },
    science_pcmb: {
      name: "Science (PCMB – all four subjects)",
      tag: "science",
      subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
      difficulty: "Extremely High",
      careers: [
        { name: "Keeps Engineering + Medical both open", exams: ["JEE / NEET"], duration: "—", scope: "Very High", avg_salary: "—" },
        { name: "Biomedical Engineering", exams: ["JEE / CUET"], duration: "4 years", scope: "High", avg_salary: "₹4–9 LPA" },
        { name: "Bioinformatics", exams: ["CUET"], duration: "3 years", scope: "Growing", avg_salary: "₹3–8 LPA" },
      ],
    },
    commerce: {
      name: "Commerce (with/without Maths)",
      tag: "commerce",
      subjects: ["Accountancy", "Business Studies", "Economics", "English", "Maths/Optional"],
      difficulty: "Medium",
      careers: [
        { name: "Chartered Accountant (CA)", exams: ["CA Foundation → Inter → Final"], duration: "4.5–5 years", scope: "Very High", avg_salary: "₹7–20 LPA (post-qualification)" },
        { name: "Company Secretary (CS)", exams: ["CSEET → Executive → Professional"], duration: "3–4 years", scope: "High", avg_salary: "₹5–12 LPA" },
        { name: "B.Com (Hons) / B.Com", exams: ["CUET"], duration: "3 years", scope: "High", avg_salary: "₹3–6 LPA, then MBA/M.Com" },
        { name: "BBA + MBA (Integrated)", exams: ["IPMAT", "NPAT", "SET"], duration: "5 years", scope: "High", avg_salary: "₹6–15 LPA" },
        { name: "Banking & Finance", exams: ["IBPS PO/Clerk", "SBI PO"], duration: "After graduation", scope: "High job security", avg_salary: "₹4–10 LPA" },
      ],
    },
    arts_humanities: {
      name: "Arts / Humanities",
      tag: "arts",
      subjects: ["History", "Political Science", "Psychology", "Sociology", "Geography", "Languages"],
      difficulty: "Moderate (conceptual)",
      careers: [
        { name: "Law (BA LLB)", exams: ["CLAT", "AILET", "LSAT"], duration: "5 years", scope: "Very High", avg_salary: "₹5–15 LPA (top firms higher)" },
        { name: "Civil Services (IAS/IPS/IFS)", exams: ["UPSC CSE (after graduation)"], duration: "1+ yrs prep", scope: "Highest prestige", avg_salary: "Government pay scale" },
        { name: "Psychology", exams: ["CUET"], duration: "3+2 years", scope: "Growing rapidly", avg_salary: "₹3–10 LPA" },
        { name: "Journalism & Mass Comm.", exams: ["IIMC", "XIC OET", "SET"], duration: "3 years", scope: "Medium (digital growing)", avg_salary: "₹3–8 LPA" },
        { name: "Design (NID/NIFT/UX)", exams: ["NID DAT", "NIFT", "UCEED"], duration: "4 years", scope: "High", avg_salary: "₹4–10 LPA" },
      ],
    },
  };

  const interestMapping = {
    problem_solving: ["science_pcm", "science_pcmb"],
    numbers_finance: ["commerce", "science_pcm"],
    technology: ["science_pcm", "science_pcmb"],
    helping_people: ["science_pcb", "arts_humanities"],
    creativity_design: ["arts_humanities", "commerce"],
    nature_biology: ["science_pcb"],
    leading_managing: ["commerce", "arts_humanities"],
    research_curiosity: ["science_pcm", "science_pcb", "arts_humanities"],
  };

  const nextStepsData = {
    science_pcm: [
      "Get the JEE Main/Advanced syllabus and cross-check with your board syllabus",
      "Start NCERT Class 11 Physics/Chemistry/Maths as soon as boards finish",
      "Solve HC Verma Vol. 1 for Physics fundamentals",
      "Shortlist a coaching mode: offline, or online (Physics Wallah, Unacademy, etc.)",
    ],
    science_pcb: [
      "Get the NEET syllabus and mark chapters common with your board",
      "Read every line and diagram in NCERT Biology — NEET draws heavily from it",
      "Join a test series from Class 11 itself to build exam temperament",
      "Start subject-wise notes from day one",
    ],
    science_pcmb: [
      "Talk to your school about PCMB workload before committing — it's intense",
      "Decide by mid-Class-11 whether you're leaning Engineering or Medical",
      "Prioritise strong fundamentals over speed in the first year",
    ],
    commerce: [
      "Learn the golden rules of accounting before Class 11 starts",
      "Practice mental maths / Vedic maths shortcuts",
      "Read a financial newspaper for 15 minutes daily",
      "If CA interests you, skim the CA Foundation syllabus now",
    ],
    arts_humanities: [
      "Choose your electives based on your target career, not just marks",
      "Build a daily newspaper reading habit (The Hindu / Indian Express)",
      "If Law interests you, start basic CLAT prep (reasoning, GK, reading)",
      "Explore short hobby/certificate courses in your area of interest",
    ],
  };

  function getRecommendations(profile) {
    const scores = profile.academic_scores || {};
    const interests = profile.interests || [];
    const interestWeights = profile.interest_weights || {};
    const preferences = profile.preferences || {};

    const streamScores = {};
    const reasons = {};

    function bump(stream, amount, reason) {
      streamScores[stream] = Math.min((streamScores[stream] ?? 50) + amount, 98);
      if (!reasons[stream]) reasons[stream] = [];
      reasons[stream].push(reason);
    }

    const math = scores.math || 0;
    const sci = scores.science || 0;
    const bio = scores.biology || 0;
    const eng = scores.english || 0;
    const sst = scores.sst || 0;

    if (math >= 75 && sci >= 70) {
      bump("science_pcm", 30, `Strong Maths (${math}%) and Science (${sci}%) scores`);
    } else if (math >= 60 && sci >= 55) {
      bump("science_pcm", 15, `Decent Maths (${math}%) and Science (${sci}%) scores`);
    }

    const bioEffective = bio > 0 ? bio : sci;
    if (bioEffective >= 75) {
      bump("science_pcb", 35, `Strong Biology/Science aptitude (${bioEffective}%)`);
    } else if (bioEffective >= 60) {
      bump("science_pcb", 18, `Decent Biology/Science aptitude (${bioEffective}%)`);
    }

    if (math >= 70 && bioEffective >= 70 && sci >= 65) {
      bump("science_pcmb", 25, "Strong across Maths, Biology and Science");
    }

    if (math >= 60) {
      bump("commerce", 20, `Good Maths score (${math}%) supports Commerce with Maths`);
    } else {
      bump("commerce", 10, "Commerce without Maths is still a solid option");
    }

    const artsAvg = eng || sst ? (eng + sst) / 2 : 50;
    bump("arts_humanities", artsAvg * 0.4, `English/SST average of ${Math.round(artsAvg)}%`);

    // Plain interest list (legacy path)
    interests.forEach((interest) => {
      (interestMapping[interest] || []).forEach((stream) => {
        bump(stream, 12, `Matches your interest in ${interest.replace(/_/g, " ")}`);
      });
    });

    // Weighted interests from the game (story quest + swipe cards)
    Object.keys(interestWeights).forEach((interest) => {
      let weight = interestWeights[interest];
      weight = Math.max(0, Math.min(100, weight));
      if (weight < 15) return;
      const label = interest.replace(/_/g, " ");
      const scaled = (weight / 100) * 22;
      (interestMapping[interest] || []).forEach((stream) => {
        bump(stream, scaled, `Scored ${Math.round(weight)}% on the '${label}' challenges in your quest`);
      });
    });

    if (preferences.competitive_exam_willingness === false) {
      ["science_pcm", "science_pcb", "science_pcmb"].forEach((s) => {
        if (s in streamScores) {
          streamScores[s] = Math.max(streamScores[s] - 20, 20);
          reasons[s].push("Lower ranking: you'd prefer to avoid heavy competitive-exam prep");
        }
      });
    }

    if (preferences.budget_constraint) {
      bump("arts_humanities", 6, "Lower average course cost fits your budget preference");
      bump("commerce", 4, "Lower average course cost fits your budget preference");
    }

    Object.keys(streamData).forEach((key) => {
      if (!(key in streamScores)) streamScores[key] = 40;
    });

    const ranked = Object.entries(streamScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const recommendations = ranked.map(([streamKey, score]) => {
      const data = streamData[streamKey];
      return {
        stream_key: streamKey,
        stream: data.name,
        tag: data.tag,
        confidence: Math.round(Math.min(score, 98)),
        subjects: data.subjects,
        top_careers: data.careers.slice(0, 3),
        why: reasons[streamKey] || ["Balanced general fit based on your profile"],
        next_steps: nextStepsData[streamKey] || ["Research thoroughly", "Talk to seniors in the field", "Visit career fairs"],
        difficulty: data.difficulty,
      };
    });

    return {
      primary_recommendation: recommendations[0] || null,
      alternatives: recommendations.slice(1),
      general_advice: generalAdvice(profile),
      generated_at: new Date().toISOString(),
    };
  }

  function generalAdvice(profile) {
    const classLevel = profile.class || "10";
    return [
      `As a Class ${classLevel} student, keep prioritising consistent board-exam performance.`,
      "Stream choice matters, but most boards allow subject changes within the first 2–3 months of Class 11.",
      "Do 2–3 informational interviews with people already working in fields you're curious about.",
      "Don't pick Science purely due to family or peer pressure — mismatch here is a common cause of stress.",
      "Look into scholarships such as NTSE or KVPY if you're strong academically.",
      "YouTube channels (Khan Academy, Physics Wallah, etc.) are great supplements, not replacements, for coaching.",
    ];
  }

  function getStreamDetails(streamKey) {
    return streamData[streamKey] || {};
  }

  return { getRecommendations, getStreamDetails };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CareerGuidanceEngine;
}
