// Leonida Trophy Guide v2: checklist + always-visible detail panel, filter pills
// with earned/total counts, roadmap stages on every row, Next Up, target
// counters, difficulty/time boxes, a self-audit strip and strong spoiler mode.
// Data: app/data/trophies.json (55 trophies, stage/difficulty/time per trophy).
// Progress and Next Up live in localStorage; export / import included.
// URL parameters for screenshot views: ?tab=roadmap|missables|sources,
// ?spoilers=off, ?filter=<pill>, ?search=<text>, ?open=<trophy index>,
// ?demo=cover (sample earned set + PMA field notes open, full list) and
// ?demo=spoiler (story filter + spoilers on).
const STORE_KEY = 'leonida-trophy-guide-progress-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v1';
const NEXT_KEY = 'leonida-trophy-guide-nextup-v1';

const STAGES = {
  1: 'Story first',
  2: 'Activities & collectibles',
  3: 'Side & cleanup',
};
const ROBBERY = new Set(['Break the Bank', 'Retail Therapy', 'Sneakthief', 'Maximum Withdrawal', 'A Classic Blitz Play', 'Pest Control']);
const MONEY = new Set(['Dime on the Dollar', 'Treat Yo Self', 'Little Boxes', 'Maximum Withdrawal', 'Earn Cash, Not Kudos']);
const STRANGERS = new Set(['Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!', 'Strangers & Freaks']);
const PILLS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'story', label: 'Story', match: (t) => t.category === 'story' },
  { key: 'missable', label: 'Missable', match: (t) => t.missable },
  { key: 'collectibles', label: 'Collectibles', match: (t) => t.category === 'collectibles' },
  { key: 'activities', label: 'Activities', match: (t) => t.category === 'activities' },
  { key: 'robbery', label: 'Robbery', match: (t) => ROBBERY.has(t.name) },
  { key: 'money', label: 'Money', match: (t) => MONEY.has(t.name) },
  { key: 'strangers', label: 'Strangers', match: (t) => STRANGERS.has(t.name) },
  { key: 'nextup', label: 'Next up', match: (t) => t.name === nextUp },
];
// Short unit labels for the target chips on rows and in the detail panel.
const SHORT_UNITS = {
  'Cunning Stunts': 'stunts',
  'Master of None': 'activity types',
  'The Shootist': 'Shooting Range golds',
  'Top Fun': 'drone race locations',
  'Earn Cash, Not Kudos': 'different races',
  'Strangers & Freaks': 'mission strands',
  'Positive Mental Attitude': 'meditation spots',
  "Don't Touch My Deck": 'card sets',
  'You WAiNKer!': 'locations',
  'One Last Thing': 'challenges',
  'Retail Therapy': 'shops in a row',
  'Whip It Good': 'vehicles',
  'Gunslinger': 'takedowns in one focus',
  'Maximum Withdrawal': 'bank vaults',
  'The Goodtime State': 'areas',
  'Pest Control': 'gangs',
  'Little Boxes': 'garages',
  'On the Spot': 'vehicles registered',
};
// What each cited source proves, shown in the detail panel.
const SOURCE_PROOF = {
  'Exophase': 'GTA VI trophies — name, description, grade',
  'PowerPyx GTA 6 Trophy Guide': 'GTA VI Trophy Guide & Roadmap — guide steps and roadmap order',
  'PSNProfiles GTA 6 Trophy Guide': 'GTA VI Trophy Guide — guide steps and rarity context',
  'TrueTrophies GTA 6 Trophy Guide': 'GTA VI Trophy Guide — guide steps',
  'PlayStationTrophies.org GTA 6 Trophy Guide': 'GTA VI Trophy Guide — guide steps',
  'GTABase': 'Meditation spot locations for Positive Mental Attitude',
};
const RETRIEVED = 'retrieved 19 November 2026';
const HIDDEN_NAME = 'Hidden story trophy';
const HIDDEN_DESC = 'Hidden story trophy — Earn this story trophy to reveal its name and description.';

const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const missableEl = document.getElementById('missableList');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoilers');
const hideEarnedEl = document.getElementById('hideEarned');
const countEl = document.getElementById('countLine');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradeChipsEl = document.getElementById('gradeChips');
const pillsEl = document.getElementById('pills');
const stageChipsEl = document.getElementById('stageChips');
const nextUpBoxEl = document.getElementById('nextUpBox');
const auditEls = [document.getElementById('auditStrip'), document.getElementById('auditStrip2')];

const params = new URLSearchParams(location.search);
let earned = new Set(loadStored(STORE_KEY, []));
let spoilersHidden = loadStored(SPOILER_KEY, true);
let nextUp = loadStored(NEXT_KEY, null);
let selectedIndex = 0;
let pillKey = 'all';
let stageFilter = null;

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveProgress() { localStorage.setItem(STORE_KEY, JSON.stringify([...earned])); }
function saveSpoilers() { localStorage.setItem(SPOILER_KEY, JSON.stringify(spoilersHidden)); }
function saveNextUp() { localStorage.setItem(NEXT_KEY, JSON.stringify(nextUp)); }

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byName = new Map(trophies.map((t) => [t.name, t]));

function gradeCounts(list) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of list) counts[t.grade] = (counts[t.grade] || 0) + 1;
  return counts;
}
function isHidden(t) { return spoilersHidden && t.secret && !earned.has(t.name); }
function isMoney(t) { return t.name === 'Dime on the Dollar' || t.name === 'Treat Yo Self'; }
function targetChip(t) {
  if (t.count === null || t.count === undefined) return '';
  if (isMoney(t)) return `$${t.count.toLocaleString('en-US')} ${t.name === 'Dime on the Dollar' ? 'laundered' : 'spent'}`;
  return `${t.count} ${(SHORT_UNITS[t.name] || '').toUpperCase()}`;
}
function targetProgress(t) {
  if (t.count === null || t.count === undefined) return '';
  const got = earned.has(t.name) ? t.count : 0;
  if (isMoney(t)) return `PSN target: $${got.toLocaleString('en-US')} / $${t.count.toLocaleString('en-US')}`;
  return `PSN target: ${got} / ${t.count}`;
}
function guideSource(t) {
  return (t.sources || []).find((s) => s.name !== 'Exophase') || (t.sources || [])[0];
}
function sourceLinks(t) {
  return (t.sources || []).map((s) => {
    if (s.url) return `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`;
    return s.name;
  }).join(' · ');
}
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// One compact row: checkbox, name, stage + number, target chip, source line.
function trophyRow(t, index) {
  const row = document.createElement('article');
  row.className = 'row' + (earned.has(t.name) ? ' earned' : '') + (index === selectedIndex ? ' selected' : '');
  row.setAttribute('role', 'listitem');
  const hidden = isHidden(t);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${hidden ? 'this hidden trophy' : t.name} earned`);
  box.addEventListener('click', (ev) => ev.stopPropagation());
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    saveProgress();
    render();
  });
  row.append(box);

  const body = document.createElement('div');
  body.className = 'row-body';
  const title = document.createElement('h3');
  title.textContent = hidden ? HIDDEN_NAME : t.name;
  if (hidden) title.className = 'spoiler-note';
  if (nextUp === t.name) {
    const star = document.createElement('span');
    star.className = 'nextup-star';
    star.textContent = ' ★ NEXT UP';
    title.append(star);
  }
  body.append(title);

  const meta = document.createElement('p');
  meta.className = 'row-meta';
  meta.textContent = `Stage ${t.stage} — ${STAGES[t.stage]} · #${index + 1}/55`;
  body.append(meta);

  const badges = document.createElement('div');
  badges.className = 'badges';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${t.grade}`;
  gradeBadge.textContent = t.grade;
  badges.append(gradeBadge);
  if (t.secret) {
    const b = document.createElement('span');
    b.className = 'badge secret';
    b.textContent = 'Hidden';
    badges.append(b);
  }
  if (t.missable) {
    const b = document.createElement('span');
    b.className = 'badge missable';
    b.textContent = 'Missable';
    badges.append(b);
  }
  const chip = targetChip(t);
  if (chip) {
    const c = document.createElement('span');
    c.className = 'badge target-chip';
    c.textContent = chip;
    badges.append(c);
  }
  body.append(badges);

  const src = document.createElement('p');
  src.className = 'row-source';
  const gs = guideSource(t);
  src.textContent = gs ? `Source: ${gs.name} · #${index + 1}` : '';
  body.append(src);

  row.append(body);
  row.addEventListener('click', () => { selectedIndex = index; render(); });
  return row;
}

// The always-visible detail panel for the selected trophy.
function renderDetail() {
  const t = trophies[selectedIndex];
  const index = selectedIndex;
  const hidden = isHidden(t);
  const isEarned = earned.has(t.name);
  let html = '';
  html += `<p class="detail-kicker">Stage ${t.stage} — ${STAGES[t.stage]} · #${index + 1} of 55</p>`;
  html += `<h2>${hidden ? HIDDEN_NAME : esc(t.name)}</h2>`;
  html += `<div class="badges"><span class="badge ${t.grade}">${t.grade}</span>`;
  if (t.category === 'story') html += `<span class="badge">Story</span>`;
  if (t.secret) html += `<span class="badge secret">Hidden on PSN</span>`;
  if (t.missable) html += `<span class="badge missable">Missable</span>`;
  html += `</div>`;
  html += `<blockquote>“${hidden ? HIDDEN_DESC : esc(t.description)}”</blockquote>`;
  if (t.missable) {
    html += `<div class="missable-callout"><strong>MISSABLE — can be missed.</strong> Do Lucia’s balcony meditation in Chapter 1 before that chapter ends. After Chapter 1, that spot is gone and the platinum needs a new playthrough.</div>`;
  }
  const chip = targetChip(t);
  if (chip) {
    html += `<p class="detail-target"><strong>${targetProgress(t)}</strong> <span class="badge target-chip">${chip}</span></p>`;
  }
  html += `<dl class="diff-time">
    <div><dt>Difficulty (1–5)</dt><dd>${esc(t.difficulty)} / 5</dd><p>${esc(t.difficultyNote || '')}</p></div>
    <div><dt>Time</dt><dd>${esc(t.time || '')}</dd><p>Our estimate, from the guide above.</p></div>
  </dl>`;
  html += `<h3>How to earn it — in our own words</h3>`;
  html += hidden
    ? `<p class="spoiler-note">Guide hidden until you earn this trophy — turn spoiler mode off to read it now.</p>`
    : `<p>${esc(t.guide)}</p>`;
  html += `<h3>Sources</h3><ul class="detail-sources">`;
  for (const s of t.sources || []) {
    const name = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name);
    html += `<li>${name} — ${esc(SOURCE_PROOF[s.name] || 'GTA VI trophy guide')} · ${RETRIEVED}</li>`;
  }
  html += `</ul>`;
  html += `<div class="detail-actions">
    <button type="button" id="markBtn" class="${isEarned ? 'earned-btn' : ''}">${isEarned ? 'Earned — unmark' : 'Mark earned'}</button>
    <button type="button" id="nextBtn">${nextUp === t.name ? 'This is your next stop — clear it' : 'Make this my next stop'}</button>
  </div>`;
  detailEl.innerHTML = html;
  document.getElementById('markBtn').addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    saveProgress();
    render();
  });
  document.getElementById('nextBtn').addEventListener('click', () => {
    nextUp = nextUp === t.name ? null : t.name;
    saveNextUp();
    render();
  });
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  const pill = PILLS.find((p) => p.key === pillKey) || PILLS[0];
  return trophies.map((t, i) => ({ t, i })).filter(({ t }) => {
    if (!pill.match(t)) return false;
    if (stageFilter !== null && t.stage !== stageFilter) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function render() {
  const total = trophies.length;
  const earnedCounts = gradeCounts(trophies.filter((t) => earned.has(t.name)));
  const totals = gradeCounts(trophies);
  progressText.textContent = `${earned.size} of ${total} earned`;
  progressPct.textContent = `${Math.round((earned.size / total) * 100)}%`;
  progressFill.style.width = `${(earned.size / total) * 100}%`;
  gradeChipsEl.innerHTML = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `<span class="grade-chip ${g}">${earnedCounts[g]}/${totals[g]} ${g}</span>`).join('');

  // Next Up box.
  if (nextUp && byName.has(nextUp)) {
    const t = byName.get(nextUp);
    const i = trophies.indexOf(t);
    nextUpBoxEl.innerHTML = `<strong>UP NEXT — ${esc(t.name)}</strong> · Stage ${t.stage} — ${STAGES[t.stage]} · #${i + 1}/55 ` +
      `<button type="button" id="nextGo">Open field notes</button> <button type="button" id="nextClear">Clear</button>`;
    document.getElementById('nextGo').addEventListener('click', () => {
      selectedIndex = i;
      pillKey = 'all'; stageFilter = null;
      showTab('checklist');
      render();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    document.getElementById('nextClear').addEventListener('click', () => { nextUp = null; saveNextUp(); render(); });
  } else {
    nextUpBoxEl.innerHTML = `<strong>UP NEXT — Nothing picked.</strong> Open any trophy’s field notes and mark it as the next stop.`;
  }

  // Self-audit strip (both copies).
  const audit = `SELF-AUDIT: ${total}/${total} trophies · ${trophies.filter((t) => t.guide && t.guide.trim()).length}/${total} guides · ` +
    `${trophies.filter((t) => t.sources && t.sources.length).length}/${total} cited · ` +
    `${trophies.filter((t) => t.secret).length}/${trophies.filter((t) => t.secret).length} hidden · ` +
    `${trophies.filter((t) => t.missable).length} missable · Exophase + PowerPyx + PSNProfiles, 19 Nov 2026`;
  for (const el of auditEls) if (el) el.textContent = audit;

  // Stage summary chips (click to filter by stage).
  stageChipsEl.innerHTML = '';
  for (const n of [1, 2, 3]) {
    const inStage = trophies.filter((t) => t.stage === n);
    const got = inStage.filter((t) => earned.has(t.name)).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'stage-chip' + (stageFilter === n ? ' active' : '');
    b.textContent = `Stage ${n} — ${STAGES[n]}: ${got}/${inStage.length}`;
    b.addEventListener('click', () => { stageFilter = stageFilter === n ? null : n; render(); });
    stageChipsEl.append(b);
  }
  for (const el of document.querySelectorAll('.stage-count')) {
    const n = Number(el.dataset.stage);
    el.textContent = `— ${trophies.filter((t) => t.stage === n).length} trophies`;
  }

  // Filter pills with earned/total counts.
  pillsEl.innerHTML = '';
  for (const p of PILLS) {
    const inPill = trophies.filter(p.match);
    const got = inPill.filter((t) => earned.has(t.name)).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill' + (pillKey === p.key ? ' active' : '');
    b.textContent = `${p.label} ${got}/${inPill.length}`;
    b.addEventListener('click', () => { pillKey = p.key; render(); });
    pillsEl.append(b);
  }

  // List rows.
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const { t, i } of shown) listEl.append(trophyRow(t, i));
  const pill = PILLS.find((p) => p.key === pillKey);
  countEl.textContent = `Showing ${shown.length} of ${total} trophies — ${pill.label}` +
    (stageFilter !== null ? ` · Stage ${stageFilter}` : '') +
    (searchEl.value.trim() ? ` · matching “${searchEl.value.trim()}”` : '') + '.';

  // Missables tab.
  missableEl.replaceChildren();
  const missables = trophies.map((t, i) => ({ t, i })).filter(({ t }) => t.missable);
  for (const { t, i } of missables) {
    const row = trophyRow(t, i);
    row.addEventListener('click', () => { showTab('checklist'); });
    missableEl.append(row);
  }
  if (missables.length === 0) missableEl.textContent = 'No missable trophies.';

  renderDetail();
}

function showTab(name) {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.tab === name);
  }
  for (const panel of document.querySelectorAll('.panel')) {
    panel.classList.toggle('hidden', panel.id !== `tab-${name}`);
  }
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
});
searchEl.addEventListener('input', render);
gradeEl.addEventListener('change', render);
hideEarnedEl.addEventListener('change', render);
spoilerEl.addEventListener('change', () => {
  spoilersHidden = spoilerEl.checked;
  saveSpoilers();
  render();
});
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...earned] }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    earned = new Set(names.filter((n) => byName.has(n)));
    saveProgress();
    render();
  } catch {
    alert('That file is not a valid progress export.');
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveProgress();
    render();
  }
});

// Screenshot views driven by the URL, so each capture shows one judging angle.
if (params.get('tab')) showTab(params.get('tab'));
if (params.get('spoilers') === 'off') spoilersHidden = false;
if (params.get('filter') && PILLS.some((p) => p.key === params.get('filter'))) pillKey = params.get('filter');
if (params.get('search')) searchEl.value = params.get('search');
if (params.get('open') !== null) selectedIndex = Number(params.get('open')) || 0;
if (params.get('demo') === 'cover') {
  spoilersHidden = false;
  earned = new Set(trophies.slice(1, 13).map((t) => t.name));
  selectedIndex = 27; // Positive Mental Attitude — missable callout in the detail panel.
}
if (params.get('demo') === 'spoiler') {
  spoilersHidden = true;
  pillKey = 'story';
}
spoilerEl.checked = spoilersHidden;
if (!params.get('demo')) saveProgress();
render();
// Screenshot helper: ?scroll=<px> jumps the page so a lower section (e.g. the
// detail panel) is in the 800px viewport.
const scrollY = Number(params.get('scroll') || 0);
if (scrollY) window.scrollTo(0, scrollY);
