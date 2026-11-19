// Leonida Trophy Guide: loads the 55 trophies from data/trophies.json, renders the
// checklist with search, category and grade filters, a story-spoiler setting, and
// progress saved in localStorage with export / import. Tabs switch between the
// checklist, the platinum roadmap and the missables list. URL parameters let a
// screenshot show one view: ?tab=roadmap|missables, ?spoilers=off, ?filter=<cat>,
// ?search=<text>, ?open=<trophy index>, ?demo=cover (a sample earned set + one
// guide open) and ?demo=spoiler (story filter + spoilers on).
const STORE_KEY = 'leonida-trophy-guide-progress-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v1';

const listEl = document.getElementById('list');
const missableEl = document.getElementById('missableList');
const searchEl = document.getElementById('search');
const categoryEl = document.getElementById('category');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoilers');
const hideEarnedEl = document.getElementById('hideEarned');
const countEl = document.getElementById('countLine');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradeLine = document.getElementById('gradeLine');

const params = new URLSearchParams(location.search);
let earned = new Set(loadStored(STORE_KEY, []));
let spoilersHidden = loadStored(SPOILER_KEY, true);
let openIndex = -1;

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}
function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, JSON.stringify(spoilersHidden));
}

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function gradeCounts(list) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of list) counts[t.grade] = (counts[t.grade] || 0) + 1;
  return counts;
}
function countLabel(count) {
  return `${count.platinum} platinum · ${count.gold} gold · ${count.silver} silver · ${count.bronze} bronze`;
}
const UNITS = {
  'Cunning Stunts': 'stunts',
  'Master of None': 'activity types',
  'The Shootist': 'Shooting Range challenges',
  'Top Fun': 'drone race locations',
  'Earn Cash, Not Kudos': 'different races won',
  'Strangers & Freaks': 'mission strands',
  'Positive Mental Attitude': 'meditation spots across 10 locations',
  "Don't Touch My Deck": 'card sets',
  'You WAiNKer!': 'locations',
  'One Last Thing': 'challenges',
  'Retail Therapy': 'shops robbed back-to-back',
  'Whip It Good': 'vehicles discovered',
  Gunslinger: 'enemies in one Combat Focus',
  'Maximum Withdrawal': 'bank vaults robbed',
  'The Goodtime State': 'areas explored',
  'Pest Control': 'gangs robbed',
  'Little Boxes': 'garage properties',
  'On the Spot': 'vehicles registered',
};
function targetText(t) {
  if (t.count === null || t.count === undefined) return '';
  if (t.name === 'Dime on the Dollar') return `Target: $${t.count.toLocaleString('en-US')} laundered`;
  if (t.name === 'Treat Yo Self') return `Target: $${t.count.toLocaleString('en-US')} spent`;
  const unit = UNITS[t.name] || '';
  return `Target: ${t.count.toLocaleString('en-US')}${unit ? ` ${unit}` : ''}`;
}
function isHidden(t) {
  return spoilersHidden && t.secret && !earned.has(t.name);
}
function sourceLinks(t) {
  return (t.sources || []).map((s) => {
    if (s.url) return `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`;
    return s.name;
  }).join(' · ');
}

function trophyCard(t, index) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(t.name) ? ' earned' : '');
  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${t.name} earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    saveProgress();
    render();
  });
  head.append(box);
  const title = document.createElement('h3');
  if (isHidden(t)) {
    title.textContent = 'Hidden story trophy';
    title.className = 'spoiler-note';
  } else {
    title.textContent = t.name;
  }
  head.append(title);
  card.append(head);

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = isHidden(t)
    ? 'A story trophy — its name and description stay hidden until you earn it.'
    : t.description;
  card.append(desc);

  const badges = document.createElement('div');
  badges.className = 'badges';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${t.grade}`;
  gradeBadge.textContent = t.grade;
  badges.append(gradeBadge);
  if (t.secret) {
    const b = document.createElement('span');
    b.className = 'badge secret';
    b.textContent = 'Hidden on PSN';
    badges.append(b);
  }
  if (t.missable) {
    const b = document.createElement('span');
    b.className = 'badge missable';
    b.textContent = 'Missable';
    badges.append(b);
  }
  const cat = document.createElement('span');
  cat.className = 'badge';
  cat.textContent = t.category;
  badges.append(cat);
  card.append(badges);

  const target = targetText(t);
  if (target) {
    const p = document.createElement('p');
    p.className = 'target';
    p.textContent = target;
    card.append(p);
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  toggle.textContent = openIndex === index ? 'Hide guide' : 'Show guide';
  const body = document.createElement('div');
  body.className = 'guide-body' + (openIndex === index ? ' open' : '');
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = t.guide;
  body.append(guide);
  const src = document.createElement('p');
  src.className = 'sources';
  src.innerHTML = `Sources: ${sourceLinks(t)}`;
  body.append(src);
  toggle.addEventListener('click', () => {
    openIndex = openIndex === index ? -1 : index;
    render();
  });
  card.append(toggle, body);
  return card;
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.map((t, i) => ({ t, i })).filter(({ t }) => {
    if (categoryEl.value === 'missable' && !t.missable) return false;
    if (categoryEl.value !== 'all' && categoryEl.value !== 'missable' && t.category !== categoryEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function render() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const { t, i } of shown) listEl.append(trophyCard(t, i));
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies — ${countLabel(gradeCounts(trophies))}.`;
  progressText.textContent = `${earned.size} of ${trophies.length} earned`;
  progressPct.textContent = `${Math.round((earned.size / trophies.length) * 100)}%`;
  progressFill.style.width = `${(earned.size / trophies.length) * 100}%`;
  const earnedCounts = gradeCounts(trophies.filter((t) => earned.has(t.name)));
  gradeLine.textContent = `Earned so far: ${countLabel(earnedCounts)}. 55 trophies: ${countLabel(gradeCounts(trophies))}.`;
  const missables = trophies.map((t, i) => ({ t, i })).filter(({ t }) => t.missable);
  missableEl.replaceChildren();
  for (const { t, i } of missables) missableEl.append(trophyCard(t, i));
  if (missables.length === 0) missableEl.textContent = 'No missable trophies.';
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
categoryEl.addEventListener('change', render);
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
    earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
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
if (params.get('filter')) categoryEl.value = params.get('filter');
if (params.get('search')) searchEl.value = params.get('search');
if (params.get('open') !== null) openIndex = Number(params.get('open')) || 0;
if (params.get('demo') === 'cover') {
  spoilersHidden = false;
  earned = new Set(trophies.slice(1, 13).map((t) => t.name));
  searchEl.value = 'meditate';
  openIndex = 27;
}
if (params.get('demo') === 'spoiler') {
  spoilersHidden = true;
  categoryEl.value = 'story';
}
spoilerEl.checked = spoilersHidden;
if (!params.get('demo')) saveProgress();
render();
