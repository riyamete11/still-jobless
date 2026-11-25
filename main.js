document.documentElement.classList.add("js");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

const data = await fetch("./data.json").then((r) => r.json());
const { jd, me } = data;

// ---------- fill numbers into the copy ----------
const lookup = {
  "jd.n": jd.n, "jd.companies": jd.companies,
  "mostAI.aiCount": jd.mostAI.aiCount, "mostAI.words": jd.mostAI.words.toLocaleString("en-US"),
  "me.sent": me.sent, "me.rejected": me.rejected, "me.silent": me.silent,
  "me.resumeVersions": me.resumeVersions, "me.coverLetters": me.coverLetters,
};
for (const t of jd.terms) lookup[`term.${t.label}`] = t.pct;
const Y = data.years;
Object.assign(lookup, { "years.n": Y.n, "years.median": Y.median, "years.myYears": Y.myYears, "years.max": Y.max });
document.querySelectorAll("[data-k]").forEach((el) => { const v = lookup[el.dataset.k]; if (v != null) el.textContent = v; });
$("#everyN").textContent = Math.round(jd.mostAI.words / jd.mostAI.aiCount);

const level = (name) => jd.levels.find((l) => l.level === name) || { n: 0, aiPct: 0 };
$("#juniorN").textContent = level("Junior").n;
$("#staffPct").textContent = Math.round((100 * level("Staff/Lead+").n) / jd.n);
$("#aiJunior").textContent = level("Junior").aiPct;
$("#aiLead").textContent = level("Staff/Lead+").aiPct;
const nov = me.perMonth.at(-1);
$("#novN").textContent = nov.sent;
$("#busyN").textContent = me.busiestDay.n;
$("#busyDay").textContent = new Date(me.busiestDay.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" });

$("#y02").textContent = Y.buckets[0].n;
$("#midPct").textContent = Math.round((100 * Y.midWanting5) / Y.midTotal);

const start = new Date("2026-01-01T00:00:00");
const day = Math.min(365, Math.floor((Date.now() - start) / 864e5) + 1);
$("#clock").textContent = `DAY ${day} OF 2026 · STILL LOOKING`;

// ---------- boot screen ----------
const bootLines = [
  "JOBLESS-OS v2026.11",
  "(c) 1994-2026  no rights reserved, no offers received",
  "",
  "Checking memory ............ 640K OK",
  "Checking portfolio ......... OK",
  "Checking resume ............ 30 VERSIONS FOUND",
  "Checking cover letters ..... 20 FOUND",
  "Checking AI readiness ...... REQUIRED BY 86% OF JOBS",
  "Checking employment ........ NOT FOUND",
  "",
  "Loading career ............. ",
];
async function boot() {
  const out = $("#bootText");
  for (const line of bootLines) {
    for (const ch of line) { out.textContent += ch; if (!reduced && ch !== " ") await sleep(14); }
    if (line !== bootLines.at(-1)) out.textContent += "\n";
    await sleep(line.includes("NOT FOUND") ? 700 : 120);
  }
  for (let i = 0; i < 3; i++) { out.textContent += "."; await sleep(380); }
  out.textContent += " ERROR\n\nPress any key to keep applying.";
  $("#bootHint").classList.add("on");
}
boot();

// ---------- builders ----------
const termBars = $("#termBars");
jd.terms.forEach((t, i) => {
  const row = document.createElement("div");
  row.className = "bar" + (i === 0 ? " bar--hot" : "");
  row.innerHTML = `<span>${t.label}</span><span class="bar__track"><span class="bar__fill" data-w="${t.pct}"></span></span><span class="bar__pct">${t.pct}%</span>`;
  termBars.append(row);
});

const order = ["Junior", "Mid", "Senior", "Staff/Lead+"];
const names = { Junior: "Junior", Mid: "Mid-level", Senior: "Senior", "Staff/Lead+": "Staff, Lead or higher" };
const cls = { Junior: "l-Junior", Mid: "l-Mid", Senior: "l-Senior", "Staff/Lead+": "l-Staff" };
const grid = $("#levelGrid");
const cells = [];
order.forEach((lv) => { for (let i = 0; i < level(lv).n; i++) cells.push(cls[lv]); });
// scatter the junior squares so readers have to hunt for them
for (let i = cells.length - 1; i > 0; i--) { const j = (i * 7919 + 13) % (i + 1); [cells[i], cells[j]] = [cells[j], cells[i]]; }
cells.forEach(() => { const p = document.createElement("span"); p.className = "pix"; grid.append(p); });
$("#levelLegend").innerHTML = order.map((lv) => `<li><span class="sw pix ${cls[lv]}"></span>${names[lv]} · ${level(lv).n}</li>`).join("");

const cols = $("#monthCols");
const monthName = (m) => new Date(m + "-01T12:00:00").toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
me.perMonth.forEach((m) => {
  const c = document.createElement("div");
  c.className = "col" + (m === nov ? " hot" : "");
  c.innerHTML = `<span class="col__n">${m.sent}</span><div class="col__stack">${'<span class="col__blk"></span>'.repeat(m.sent)}</div><span class="col__m">${monthName(m.month)}</span>`;
  cols.append(c);
});

const envs = $("#envelopes");
for (let i = 0; i < me.sent; i++) { const e = document.createElement("span"); e.className = "env"; envs.append(e); }

const ycols = $("#yearCols");
const ymax = Math.max(...Y.buckets.map((b) => b.n));
Y.buckets.forEach((b) => {
  const mine = b.label === "3-4";
  ycols.insertAdjacentHTML("beforeend", `<div class="ycol${mine ? " mine" : ""}">${mine ? '<span class="ycol__me">ME</span>' : ""}<span class="ycol__n">${b.n}</span><span class="ycol__bar" data-h="${Math.round((b.n / ymax) * 78)}"></span><span class="ycol__l">${b.label} YRS</span></div>`);
});

const pct = (label) => jd.terms.find((t) => t.label === label)?.pct;
const logRows = [
  ["added", "ADDED", `AI, in ${pct("AI")}% of job descriptions`],
  ["added", "ADDED", `Prototype in code, ${pct("Prototype in code")}%`],
  ["added", "ADDED", `"AI-native" ${pct("AI-native / AI-first")}%, agents ${pct("Agents")}%`],
  ["chg", "CHANGED", `Median experience asked: ${Y.median} years`],
  ["dep", "DEPRECATED", `Junior roles: ${level("Junior").n} of ${jd.n}`],
  ["kept", "KEPT", `Craft, ${pct("Craft")}%`],
  ["kept", "KEPT", `User research, ${pct("User research")}%`],
];
$("#logList").innerHTML = logRows.map(([c, t, txt]) => `<li><span class="tag tag--${c}">${t}</span><span>${txt}</span></li>`).join("");

const tbody = $("#repeatTbl tbody");
me.repeat.slice(0, 3).forEach((r) => {
  tbody.insertAdjacentHTML("beforeend", `<tr><td>${r.company}</td><td>${"|".repeat(r.n)} ${r.n}</td><td>0</td></tr>`);
});

// ---------- scroll-triggered animations ----------
const runs = {
  scan: async () => {
    const fill = $("#scanFill");
    for (let p = 0; p <= 100; p += 4) { fill.style.width = p + "%"; $("#scanStatus").textContent = `> reading... ${Math.round((p / 100) * jd.n)} / ${jd.n}`; await sleep(45); }
    $("#scanStatus").textContent = "> done. the word AI found in most of them.";
    termBars.querySelectorAll(".bar__fill").forEach((f, i) => setTimeout(() => (f.style.width = f.dataset.w + "%"), reduced ? 0 : i * 90));
  },
  levels: async () => {
    const pixes = [...grid.children];
    const batch = 14;
    for (let i = 0; i < pixes.length; i += batch) {
      for (let k = i; k < Math.min(i + batch, pixes.length); k++) pixes[k].classList.add("on", cells[k]);
      await sleep(16);
    }
  },
  apply: async () => {
    const blocks = [...cols.querySelectorAll(".col")];
    cols.classList.add("go");
    if (reduced) return;
    // build each column block by block
    const stacks = blocks.map((b) => [...b.querySelectorAll(".col__blk")]);
    stacks.flat().forEach((b) => (b.style.opacity = 0));
    blocks.forEach((b) => (b.querySelector(".col__n").style.opacity = 0));
    const max = Math.max(...stacks.map((s) => s.length));
    for (let h = 0; h < max; h++) {
      stacks.forEach((s, i) => { if (s[h]) s[h].style.opacity = 1; if (h === s.length - 1 || (s.length === 0 && h === 0)) blocks[i].querySelector(".col__n").style.opacity = 1; });
      await sleep(28);
    }
    blocks.forEach((b) => (b.querySelector(".col__n").style.opacity = 1));
  },
  years: async () => {
    ycols.querySelectorAll(".ycol__bar").forEach((b, i) => setTimeout(() => (b.style.height = b.dataset.h + "%"), reduced ? 0 : i * 120));
  },
  changelog: async () => {
    const list = $("#logList");
    list.classList.add("go");
    if (reduced) return;
    const items = [...list.children];
    items.forEach((li) => (li.style.opacity = 0));
    for (const li of items) { await sleep(260); li.style.opacity = 1; }
  },
  planb: async () => {
    await sleep(400);
    $("#planbLine").textContent = "> learning AI... in progress. project 001 shipped.";
    for (const d of document.querySelectorAll("#planb .day")) { d.classList.add("on"); await sleep(120); }
  },
  inbox: async () => {
    const all = [...envs.children];
    const idx = all.map((_, i) => i).sort((a, b) => ((a * 37) % 121) - ((b * 37) % 121)).slice(0, me.rejected);
    await sleep(500);
    for (const i of idx) { all[i].classList.add("rej"); await sleep(55); }
  },
};

// ---------- loading dialog before each window opens ----------
const loader = document.createElement("div");
loader.className = "loader";
loader.setAttribute("aria-hidden", "true");
loader.innerHTML = `<div class="loader__bar"><span>PLEASE WAIT</span></div><div class="loader__body"><span class="loader__glass"></span><div><p class="loader__t"></p><div class="loader__prog"><span></span></div></div></div>`;
document.body.append(loader);
const loadingQuips = ["Loading", "Opening", "Defragmenting", "Buffering feelings for", "Asking permission to open", "Reticulating"];
let busy = Promise.resolve();
function showLoader(name) {
  if (reduced) return Promise.resolve();
  busy = busy.then(async () => {
    loader.querySelector(".loader__t").textContent = `${loadingQuips[Math.floor(Math.random() * loadingQuips.length)]} ${name}...`;
    const fill = loader.querySelector(".loader__prog span");
    fill.style.width = "0%";
    loader.classList.add("on");
    document.body.classList.add("waiting");
    for (const p of [18, 34, 35, 35, 61, 88, 100]) { fill.style.width = p + "%"; await sleep(70 + Math.random() * 60); }
    loader.classList.remove("on");
    document.body.classList.remove("waiting");
  });
  return busy;
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    io.unobserve(e.target);
    const win = e.target.querySelector(".win") || e.target;
    const name = win.querySelector(".win__title")?.textContent || "PROGRAM";
    showLoader(name).then(() => {
      win.classList.add("is-open");
      const run = runs[e.target.id];
      if (run) setTimeout(run, reduced ? 0 : 320);
    });
  }
}, { threshold: 0.35 });
document.querySelectorAll(".scene").forEach((s) => io.observe(s));

// ---------- the old machine is not well: random glitches ----------
if (!reduced) {
  const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 60 && r.top < innerHeight - 60; };
  const glitchOnce = () => {
    const wins = [...document.querySelectorAll(".win.is-open")].filter(inView);
    if (wins.length && document.visibilityState === "visible") {
      const w = wins[Math.floor(Math.random() * wins.length)];
      const title = w.querySelector(".win__title");
      if (Math.random() < 0.3 && title && !title.dataset.frozen) {
        // the classic: window stops responding for a moment
        title.dataset.frozen = title.textContent;
        title.textContent += " (Not Responding)";
        w.classList.add("frozen");
        setTimeout(() => { title.textContent = title.dataset.frozen; delete title.dataset.frozen; w.classList.remove("frozen"); }, 1600);
      } else {
        w.classList.add("glitch");
        setTimeout(() => w.classList.remove("glitch"), 380);
      }
    }
    setTimeout(glitchOnce, 6000 + Math.random() * 7000);
  };
  setTimeout(glitchOnce, 5000);
}


// ---------- the punchline buttons ----------
let applied = me.sent;
const toast = $("#toast");
const retryLines = ["Retrying... no humans found.", "Retrying... the AI is busy interviewing someone else.", "Retrying... please hold. Your call is important to us.", "Still no. Have you tried being AI-native?"];
let r = 0;
$("#retryBtn").addEventListener("click", () => { toast.textContent = retryLines[r++ % retryLines.length]; });
$("#applyBtn").addEventListener("click", () => {
  applied += 1;
  toast.textContent = `Thank you for your interest! Application #${applied} received. We'll be in touch (we won't).`;
});

// ---------- terms and conditions with AI ----------
const termsLines = [
  "You have agreed to get along with AI. There was no decline button.",
  "Already accepted. You can't un-accept the future.",
  "Still accepted. AI says thanks. I say nothing.",
];
let tc = 0;
$("#termsBtn").addEventListener("click", () => { $("#termsToast").textContent = termsLines[Math.min(tc++, termsLines.length - 1)]; });

// ---------- resume pop-up with keyword search ----------
const resume = await fetch("./resume.json").then((r) => r.json());
let vocab = null;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRe = (q) => new RegExp(`(^|[^a-z0-9])(${reEsc(q)})(?=$|[^a-z0-9])`, "gi");

let view = "keywords";
let lastQ = "";
function renderResume(q = lastQ) {
  lastQ = q;
  const re = q ? termRe(q) : null;
  const hl = (s) => (re ? esc(s).replace(re, (m, pre, hit) => `${pre}<mark>${hit}</mark>`) : esc(s));
  const top = `<p class="r-big">${esc(resume.name)}</p><p class="r-title">${esc(resume.title.toUpperCase())}</p><p class="r-sub">${esc(resume.subtitle)}</p>`;
  if (view === "keywords") {
    const hits = (k) => re && new RegExp(re.source, "i").test(k);
    $("#resumeDoc").innerHTML = `${top}<div class="kwall${re ? " dim" : ""}">${resume.keywords.map(([k, size]) => `<span class="kw kw--${size}${hits(k) ? " hit" : ""}">${esc(k)}</span>`).join("")}</div>`;
    return;
  }
  const sec = resume.sections.map((s) => `<h4>${esc(s.title.toUpperCase())}</h4>${s.items.map((it) => `${it.head ? `<h5>${hl(it.head)}</h5>` : ""}<ul>${it.points.map((p) => `<li>${hl(p)}</li>`).join("")}</ul>`).join("")}`).join("");
  $("#resumeDoc").innerHTML = `${top}<p>${hl(resume.summary)}</p>${sec}`;
}
renderResume();

const viewHints = { keywords: "the version the robots read", normal: "the version a human would read (if one ever did)" };
document.querySelectorAll(".toggle__btn").forEach((b) => b.addEventListener("click", () => {
  view = b.dataset.view;
  document.querySelectorAll(".toggle__btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  $("#viewHint").textContent = viewHints[view];
  renderResume();
}));

// counts always come from the full resume, whichever view is showing
const resumeText = [resume.headline, resume.summary, ...resume.sections.flatMap((s) => s.items.flatMap((i) => [i.head, ...i.points]))].join(" \n ");
const norm = (q) => q.toLowerCase().replace(/[^a-z0-9+#./\- ]+/g, " ").trim().split(/\s+/).filter(Boolean).join(" ");

async function search(raw) {
  const q = raw.trim();
  renderResume(q.length >= 2 ? q : "");
  const out = $("#kwOut");
  if (q.length < 2) { out.textContent = "Type a keyword. I'll tell you if I have it, and how many job descriptions wanted it."; return; }
  vocab ??= await fetch("./jd_vocab.json").then((r) => r.json());
  const mine = (resumeText.match(termRe(q)) || []).length;
  const key = norm(q);
  const words = key.split(" ").length;
  // keep "AI" consistent with the chart, which also counts ML, LLMs and agents
  const aiTerm = key === "ai" ? jd.terms.find((x) => x.label === "AI") : null;
  const n = aiTerm ? Math.round((aiTerm.pct / 100) * vocab.n) : words <= 2 ? vocab.df[key] || 0 : null;
  const pct = aiTerm ? aiTerm.pct : n != null ? Math.round((100 * n) / vocab.n) : null;
  const them = n == null ? "" : n === 0 ? "No job description asked for it" : `${pct}% of job descriptions wanted it (${n} of ${vocab.n})`;
  let msg;
  if (n == null) msg = mine ? `Found ${mine} time${mine > 1 ? "s" : ""} in my resume. Too long to check against the job descriptions, try one or two words.` : "Not in my resume. Try one or two words.";
  else if (mine && n) msg = `Found ${mine} time${mine > 1 ? "s" : ""} in my resume. ${them}. So... interview?`;
  else if (!mine && n) msg = `0 times in my resume. ${them}. Noted. Adding it to RESUME_V31.DOC.`;
  else if (mine && !n) msg = `Found ${mine} time${mine > 1 ? "s" : ""} in my resume. ${them}. Typical.`;
  else msg = "Nobody has this. Not me, not them. A rare moment of equality.";
  out.textContent = msg;
}

const modal = $("#resumeModal");
let lastFocus = null;
const openResume = () => { lastFocus = document.activeElement; modal.hidden = false; $("#kw").focus(); };
const closeResume = () => { modal.hidden = true; lastFocus?.focus(); };
$("#openResume").addEventListener("click", openResume);
$("#closeResume").addEventListener("click", closeResume);
modal.addEventListener("click", (e) => { if (e.target === modal) closeResume(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeResume(); });
let t;
$("#kw").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => search(e.target.value), 160); });
document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { $("#kw").value = c.textContent; search(c.textContent); }));
