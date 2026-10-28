#!/usr/bin/env node
// Draws the flat illustrations in images/ (one SVG per product and recipe).
// Run from anywhere:  node tools/make-art.js
// Product pictures come from data/inventory.js via the rules in artFor() near the bottom; edit and re-run.
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'images');

/* ---------- helpers ---------- */
function shade(hex, a) { // a > 0 lightens toward white, a < 0 darkens
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return '#' + c.map(v => Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a))
    .map(v => v.toString(16).padStart(2, '0')).join('');
}
let R = Math.random, UID = 'x';
function seed(str) {
  let s = 0; for (const ch of str) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  R = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  UID = str.replace(/[^a-z0-9]/gi, '');
}
const rand = (a, b) => a + R() * (b - a);
const pick = a => a[Math.floor(R() * a.length)];
const f = n => +n.toFixed(1);
const G = (t, inner) => `<g transform="${t}">${inner}</g>`;
const FONT = `font-family="Trebuchet MS, Verdana, sans-serif" font-weight="700" text-anchor="middle"`;

function frame(bg, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<rect width="400" height="300" fill="${shade(bg, 0.87)}"/>` +
    `<circle cx="200" cy="140" r="128" fill="${shade(bg, 0.74)}"/>` +
    `<ellipse cx="200" cy="262" rx="150" ry="14" fill="#3a2410" opacity=".1"/>${body}</svg>`;
}

/* ---------- small pieces (seeds, snacks, toppings) ---------- */
function piece(kind, x, y, col, rot = rand(0, 180)) {
  x = f(x); y = f(y); rot = f(rot);
  const d = shade(col, -0.3), l = shade(col, 0.35), T = `transform="rotate(${rot} ${x} ${y})"`;
  switch (kind) {
    case 'oval': return `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="2.4" fill="${col}" stroke="${d}" stroke-width=".8" ${T}/>`;
    case 'round': return `<circle cx="${x}" cy="${y}" r="3.6" fill="${col}"/><circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.1" fill="${l}"/>`;
    case 'lentil': return `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="4.4" fill="${col}" stroke="${d}" stroke-width=".7" ${T}/>`;
    case 'chickpea': return `<circle cx="${x}" cy="${y}" r="8" fill="${col}" stroke="${d}" stroke-width="1"/><path d="M${x - 2} ${y - 7} q3 -3 5 0" stroke="${d}" fill="none" stroke-width="1.2"/><circle cx="${x - 3}" cy="${y - 2}" r="2.2" fill="${l}" opacity=".7"/>`;
    case 'grain': return `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="2.5" fill="${col}" stroke="${d}" stroke-width=".5" ${T}/>`;
    case 'pod': return `<g ${T}><ellipse cx="${x}" cy="${y}" rx="11" ry="6.5" fill="${col}" stroke="${d}" stroke-width="1"/><path d="M${x - 9} ${y} H${x + 9}" stroke="${d}" stroke-width=".8"/></g>`;
    case 'leaf': return `<g ${T}><path d="M${x - 12} ${y} Q${x} ${y - 7} ${x + 12} ${y} Q${x} ${y + 7} ${x - 12} ${y} Z" fill="${col}" stroke="${d}" stroke-width=".8"/><path d="M${x - 10} ${y} H${x + 10}" stroke="${d}" stroke-width=".7"/></g>`;
    case 'tea': return `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="1.7" fill="${col}" ${T}/>`;
    case 'pea': return `<circle cx="${x}" cy="${y}" r="5.6" fill="${col}" stroke="${d}" stroke-width=".8"/><circle cx="${x - 1.8}" cy="${y - 1.8}" r="1.6" fill="${l}"/>`;
    case 'stick': return `<line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}" stroke="${col}" stroke-width="3.4" stroke-linecap="round" ${T}/>`;
    case 'spiral': return `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="${col}" stroke-width="4.5"/><circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="${d}" stroke-width="2.5"/>`;
    case 'chip': return `<circle cx="${x}" cy="${y}" r="11" fill="${col}" stroke="${d}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="${l}" stroke-width="1.5"/>`;
    case 'biscuit': return `<circle cx="${x}" cy="${y}" r="13" fill="${col}" stroke="${d}" stroke-width="1.2"/>` +
      [[-5, -4], [4, -5], [-4, 5], [5, 4]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="1.3" fill="${d}"/>`).join('');
    case 'ball': return `<circle cx="${x}" cy="${y}" r="12" fill="${col}"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="${l}" opacity=".55"/>`;
    case 'cube': return `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="2.5" fill="${col}" stroke="${d}" stroke-width=".8" ${T}/>`;
    case 'mix': {
      const [k, c] = pick([['stick', '#E3A23B'], ['stick', '#D98B2B'], ['round', '#C27C42'], ['lentil', '#8DB04A'], ['leaf', '#4F7F2F'], ['chip', '#E8B04A']]);
      return piece(k, x, y, c, rot);
    }
    case 'almond': return `<path d="M${x - 9} ${y} C${x - 8} ${y - 9} ${x + 3} ${y - 9} ${x + 10} ${y} C${x + 3} ${y + 7} ${x - 7} ${y + 7} ${x - 9} ${y} Z" fill="${col}" stroke="${d}" stroke-width="1" ${T}/>`;
    case 'cashew': return `<g ${T}><path d="M${x - 9} ${y + 3} Q${x} ${y - 13} ${x + 9} ${y + 3}" stroke="${d}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x - 9} ${y + 3} Q${x} ${y - 13} ${x + 9} ${y + 3}" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
    case 'pistachio': return `<g ${T}><ellipse cx="${x}" cy="${y}" rx="10" ry="7" fill="${col}" stroke="${d}" stroke-width="1"/><ellipse cx="${x + 2}" cy="${y - 1}" rx="5" ry="2.2" fill="#8DB04A"/></g>`;
    case 'walnut': return `<circle cx="${x}" cy="${y}" r="11" fill="${col}" stroke="${d}" stroke-width="1"/><path d="M${x - 7} ${y - 3} q3 -4 6 0 t6 0 M${x - 7} ${y + 4} q3 -4 6 0 t6 0" stroke="${d}" stroke-width="1.2" fill="none"/>`;
    case 'date': return `<g ${T}><ellipse cx="${x}" cy="${y}" rx="12" ry="5.5" fill="${col}" stroke="${d}" stroke-width="1"/><path d="M${x - 7} ${y - 1} q4 2 8 -1 M${x - 3} ${y + 2} q4 1 8 -1" stroke="${d}" stroke-width="1" fill="none"/></g>`;
    case 'makhana': return `<circle cx="${x}" cy="${y}" r="9" fill="${col}" stroke="${shade(col, -.15)}" stroke-width="1"/><circle cx="${x - 2}" cy="${y - 3}" r="2" fill="#8A5A3A" opacity=".55"/><circle cx="${x + 3}" cy="${y + 2}" r="1.5" fill="#8A5A3A" opacity=".45"/>`;
    case 'vegmix': {
      const [k, c] = pick([['pea', '#7CC242'], ['cube', '#F08A2C'], ['cube', '#F2D46B'], ['stick', '#5E9B3A'], ['pea', '#7CC242'], ['cube', '#F4EEE2']]);
      return piece(k, x, y, c, rot);
    }
    case 'confetti': return piece(pick(['round', 'oval', 'tea', 'lentil']), x, y, pick(['#E24C7A', '#F4EEE2', '#7FBF4A', '#F2C94C', '#D9342B', '#8A5A35']), rot);
    case 'dust': return `<circle cx="${x}" cy="${y}" r="${f(rand(2, 4.5))}" fill="${R() < .5 ? col : shade(col, R() < .5 ? .2 : -.15)}"/>`;
    case 'samosa': return `<g ${T}><polygon points="${x - 13},${y + 8} ${x + 13},${y + 8} ${x + 1},${y - 14}" fill="${col}" stroke="${d}" stroke-width="1.5" stroke-linejoin="round"/></g>`;
    case 'roll': return `<g ${T}><rect x="${x - 18}" y="${y - 7}" width="36" height="14" rx="7" fill="${col}" stroke="${d}" stroke-width="1.2"/><path d="M${x - 8} ${y - 6} q3 6 0 12 M${x + 6} ${y - 6} q3 6 0 12" stroke="${d}" stroke-width="1" fill="none"/></g>`;
    case 'crystal': return `<polygon points="${x - 7},${y + 5} ${x - 4},${y - 7} ${x + 6},${y - 6} ${x + 8},${y + 4} ${x + 1},${y + 8}" fill="${col}" stroke="${d}" stroke-width="1" ${T}/><polygon points="${x - 4},${y - 5} ${x + 4},${y - 4} ${x},${y + 1}" fill="#fff" opacity=".7" ${T}/>`;
    case 'disc': return `<ellipse cx="${x}" cy="${y}" rx="15" ry="11" fill="${col}" stroke="${d}" stroke-width="1.2"/><ellipse cx="${x - 3}" cy="${y - 2}" rx="4" ry="2" fill="${d}" opacity=".35"/>`;
  }
  return '';
}
// Random points inside the mound shape that sits in a bowl, sorted back-to-front.
const DOME = 'M106 168 C122 104 278 104 294 168 Z';
function domePts(n) {
  const pts = [];
  while (pts.length < n) {
    const x = rand(106, 294), y = rand(112, 170), t = (x - 200) / 94;
    if (y > 168 - 50 * (1 - t * t)) pts.push([x, y]);
  }
  return pts.sort((a, b) => a[1] - b[1]);
}
function ellPts(n, cx, cy, rx, ry) {
  const pts = [];
  while (pts.length < n) {
    const x = rand(-1, 1), y = rand(-1, 1);
    if (x * x + y * y < 1) pts.push([cx + x * rx, cy + y * ry]);
  }
  return pts.sort((a, b) => a[1] - b[1]);
}
const tableScatter = (kind, col, n = 7) => Array.from({ length: n }, () =>
  piece(kind, R() < .5 ? rand(70, 120) : rand(282, 330), rand(258, 280), col)).join('');

/* ---------- bowls of spices, seeds, lentils ---------- */
const BOWLS = { wood: '#B9773E', steel: '#BCC4CE', brass: '#C99A2E', clay: '#B8603A', white: '#EFE8DC' };
const bowlBack = bc => `<ellipse cx="200" cy="166" rx="100" ry="11" fill="${shade(bc, -0.3)}"/>`;
const bowlFront = bc =>
  `<path d="M100 166 C104 236 146 258 200 258 C254 258 296 236 300 166 Z" fill="${bc}"/>` +
  `<path d="M100 166 A100 11 0 0 0 300 166" fill="none" stroke="${shade(bc, 0.3)}" stroke-width="6" stroke-linecap="round"/>` +
  `<path d="M126 194 Q134 228 166 245" stroke="${shade(bc, 0.45)}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>`;

function wholeSpices() {
  const star = (cx, cy) => Array.from({ length: 8 }, (_, i) => {
    const a = i * 45, r = a * Math.PI / 180;
    return `<ellipse cx="${f(cx + 11 * Math.cos(r))}" cy="${f(cy + 11 * Math.sin(r))}" rx="11" ry="5.5" fill="#7A3F1E" stroke="#4E2610" stroke-width="1" transform="rotate(${a} ${f(cx + 11 * Math.cos(r))} ${f(cy + 11 * Math.sin(r))})"/>`;
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="5" fill="#4E2610"/>`;
  const clove = (x, y, r) => G(`rotate(${r} ${x} ${y})`, `<line x1="${x}" y1="${y}" x2="${x + 18}" y2="${y}" stroke="#4A2A1A" stroke-width="3.5" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="4.5" fill="#4A2A1A"/>`);
  return star(72, 242) +
    G('rotate(-14 320 254)', `<rect x="282" y="246" width="96" height="16" rx="8" fill="#A0602F"/><path d="M288 254 H372" stroke="#7A4220" stroke-width="2"/><ellipse cx="373" cy="254" rx="5" ry="8" fill="#7A4220"/>`) +
    clove(112, 276, -20) + clove(286, 284, 15) + piece('pod', 128, 262, '#7FA650', 30);
}
function spoon(col) {
  return G('rotate(10 96 262)', `<rect x="8" y="257" width="90" height="10" rx="5" fill="#A8703D"/><ellipse cx="100" cy="262" rx="23" ry="12.5" fill="#A8703D"/><ellipse cx="100" cy="259" rx="17" ry="8" fill="${col}"/>`);
}
function powderBowl(col, o = {}) {
  const bc = BOWLS[o.bowl || 'wood'], id = UID + 'm';
  const specks = Array.from({ length: 60 }, () => {
    const [x, y] = domePts(1)[0];
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rand(.8, 2))}" fill="${shade(col, R() < .5 ? -.2 : .25)}"/>`;
  }).join('');
  return frame(o.bg || col, bowlBack(bc) +
    `<clipPath id="${id}"><path d="${DOME}"/></clipPath><path d="${DOME}" fill="${col}"/>` +
    `<g clip-path="url(#${id})">${specks}<path d="M140 146 Q186 112 238 124" stroke="${shade(col, .4)}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".4"/></g>` +
    bowlFront(bc) + (o.whole ? wholeSpices() : spoon(col)));
}
function seedBowl(col, kind, o = {}) {
  const bc = BOWLS[o.bowl || 'wood'], id = UID + 'm';
  const n = { chickpea: 75, pod: 70, leaf: 90, lentil: 190, grain: 220, crystal: 110, confetti: 220, almond: 90, cashew: 80, pistachio: 80, walnut: 45, date: 50, makhana: 55, ball: 45, disc: 60, chip: 60, cube: 90, stick: 120 }[kind] || 260;
  const pts = domePts(n).map(([x, y]) => piece(kind, x, y, kind === 'confetti' ? '' : R() < .25 ? shade(col, .12) : col)).join('');
  return frame(o.bg || col, bowlBack(bc) +
    `<clipPath id="${id}"><path d="${DOME}"/></clipPath><path d="${DOME}" fill="${shade(col, -0.25)}"/>` +
    `<g clip-path="url(#${id})">${pts}</g>` + bowlFront(bc) + (o.whole ? wholeSpices() : tableScatter(kind === 'confetti' ? 'round' : kind, kind === 'confetti' ? '#E24C7A' : col)));
}

/* ---------- sacks of rice and flour ---------- */
function sack(fill, label, labelCol, kind) {
  const b = '#D6B58A', id = UID + 's', mid = UID + 'g';
  const body = 'M128 112 C116 170 112 222 120 256 Q200 270 280 256 C288 222 284 170 272 112 Z';
  const weave = Array.from({ length: 10 }, (_, i) => `<path d="M110 ${126 + i * 14} Q200 ${132 + i * 14} 290 ${126 + i * 14}" stroke="${shade(b, -0.12)}" stroke-width="1.6" fill="none"/>`).join('');
  const MOUND = 'M134 112 C152 72 248 72 266 112 Z';
  const grains = kind === 'powder'
    ? Array.from({ length: 40 }, () => `<circle cx="${f(rand(140, 260))}" cy="${f(rand(84, 112))}" r="${f(rand(.8, 1.8))}" fill="${shade(fill, -.12)}"/>`).join('')
    : ellPts(120, 200, 96, 66, 24).map(([x, y]) => piece(kind, x, y, R() < .3 ? shade(fill, -.06) : fill)).join('');
  const fs = Math.min(17, 170 / label.length);
  return frame(labelCol,
    `<clipPath id="${id}"><path d="${body}"/></clipPath><path d="${body}" fill="${b}" stroke="${shade(b, -.25)}" stroke-width="3"/>` +
    `<g clip-path="url(#${id})">${weave}</g>` +
    `<ellipse cx="200" cy="112" rx="74" ry="18" fill="${shade(b, -0.35)}"/>` +
    `<clipPath id="${mid}"><path d="${MOUND}"/></clipPath><path d="${MOUND}" fill="${shade(fill, -0.1)}"/><g clip-path="url(#${mid})">${grains}</g>` +
    `<path d="M126 112 A74 18 0 0 0 274 112" fill="none" stroke="${shade(b, -0.08)}" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="148" y="160" width="104" height="62" rx="8" fill="#FFF8EC" stroke="${labelCol}" stroke-width="3"/>` +
    `<text x="200" y="${193 + fs / 3}" font-size="${f(fs)}" fill="${labelCol}" ${FONT}>${label}</text>` +
    `<text x="200" y="212" font-size="8" fill="${shade(labelCol, .2)}" ${FONT} letter-spacing="1.5">PREMIUM</text>` +
    `<path d="M168 176 H232" stroke="${labelCol}" stroke-width="1.5" opacity=".5"/>` +
    (kind === 'powder' ? '' : Array.from({ length: 8 }, () => piece(kind, R() < .5 ? rand(70, 112) : rand(290, 330), rand(256, 280), fill)).join('')));
}

/* ---------- packets, cans, jars, bottles ---------- */
// Splits a label into at most two lines and sizes it to fit the packet.
function labelText(label, x, y, max = 200, col = '#fff') {
  const words = label.split(' '), lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > 13 && lines.length < 2) lines.push(w);
    else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
  }
  const fs = Math.min(22, max / Math.max(...lines.map(l => l.length)) * 1.7);
  const y0 = lines.length === 1 ? y : y - fs * .55;
  return lines.map((l, i) => `<text x="${x}" y="${f(y0 + i * fs * 1.1)}" font-size="${f(fs)}" fill="${col}" ${FONT}>${l.toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`).join('');
}
function packet(col, label, kind, fillCol) {
  const id = UID + 'w', fs = Math.min(22, 230 / label.length);
  const zig = y => `<path d="M118 ${y} ${Array.from({ length: 21 }, (_, i) => `L${118 + i * 8.2} ${y + (i % 2 ? 6 : 0)}`).join(' ')}" stroke="${shade(col, -0.35)}" stroke-width="1.5" fill="none"/>`;
  const n = { biscuit: 26, chip: 40, spiral: 30, ball: 30, cube: 45, pea: 120, samosa: 34, roll: 30, disc: 34, chickpea: 60, leaf: 70, pod: 50, dust: 500 }[kind] || 140;
  return frame(col,
    `<path d="M118 66 L282 66 L292 252 L108 252 Z" fill="${col}"/>` +
    `<rect x="114" y="56" width="172" height="20" rx="3" fill="${shade(col, -0.22)}"/>${zig(70)}` +
    `<rect x="104" y="244" width="192" height="18" rx="3" fill="${shade(col, -0.22)}"/>` +
    `<path d="M128 78 L140 78 L132 240 L120 240 Z" fill="#fff" opacity=".18"/>` +
    `<path d="M118 128 Q200 116 286 128 L287 138 Q200 126 117 138 Z" fill="${shade(col, 0.3)}" opacity=".7"/>` +
    labelText(label, 200, 106, 150) +
    `<clipPath id="${id}"><ellipse cx="200" cy="186" rx="64" ry="46"/></clipPath>` +
    `<ellipse cx="200" cy="186" rx="64" ry="46" fill="#FFF6E6"/>` +
    `<g clip-path="url(#${id})">${kind === 'dust' ? `<rect x="130" y="130" width="140" height="110" fill="${fillCol}"/>` : ''}${ellPts(n, 200, 186, 70, 52).map(([x, y]) => piece(kind, x, y, /mix|confetti/.test(kind) ? '' : (R() < .3 ? shade(fillCol, .12) : fillCol))).join('')}</g>` +
    `<ellipse cx="200" cy="186" rx="64" ry="46" fill="none" stroke="#fff" stroke-width="5"/>`);
}
function mangoShape(x, y, s, col = '#F2B630') {
  return G(`translate(${x} ${y}) scale(${s})`,
    `<path d="M-70 10 C-75 -40 -20 -60 30 -50 C70 -42 85 -5 70 25 C55 55 0 60 -35 50 C-55 44 -68 30 -70 10 Z" fill="${col}" stroke="${shade(col, -.25)}" stroke-width="2"/>` +
    `<path d="M-60 12 C-62 -20 -30 -40 0 -42 C-30 -30 -48 -8 -40 30 Z" fill="${shade('#E8572A', .1)}" opacity=".35"/>` +
    `<path d="M-30 -36 C-20 -46 0 -48 20 -44" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>` +
    `<path d="M60 -30 q6 -10 2 -18" stroke="#6B4423" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M62 -46 C80 -66 110 -60 118 -50 C100 -40 78 -38 62 -46 Z" fill="#3F8F3A"/>`);
}
function can(col, label) {
  return frame(col,
    `<rect x="135" y="78" width="130" height="176" fill="#CDD2D9"/>` +
    `<rect x="135" y="104" width="130" height="124" fill="${col}"/>` +
    `<rect x="135" y="78" width="16" height="176" fill="#000" opacity=".12"/><rect x="249" y="78" width="16" height="176" fill="#000" opacity=".1"/>` +
    `<rect x="162" y="78" width="9" height="176" fill="#fff" opacity=".25"/>` +
    `<ellipse cx="200" cy="254" rx="65" ry="11" fill="#AEB4BC"/><rect x="135" y="244" width="130" height="10" fill="#CDD2D9"/>` +
    `<ellipse cx="200" cy="78" rx="65" ry="12" fill="#E8EBEF" stroke="#AEB4BC" stroke-width="2"/><ellipse cx="200" cy="78" rx="52" ry="8" fill="none" stroke="#AEB4BC" stroke-width="1.5"/>` +
    `<text x="200" y="130" font-size="17" fill="#fff" ${FONT}>${label}</text>` +
    mangoShape(198, 176, .52) +
    `<text x="200" y="218" font-size="10" fill="#fff" ${FONT} letter-spacing="1.5">MANGO PULP</text>` +
    `<ellipse cx="318" cy="246" rx="40" ry="12" fill="#EFE8DC"/><ellipse cx="318" cy="243" rx="30" ry="7" fill="${shade(col, .1)}"/>`);
}
function jar(contentCol, lidCol, label, o = {}) {
  const id = UID + 'j';
  const chunks = o.chunks ? Array.from({ length: 30 }, () =>
    `<rect x="${f(rand(140, 250))}" y="${f(rand(104, 244))}" width="${f(rand(10, 20))}" height="${f(rand(8, 14))}" rx="4" fill="${pick(Array.isArray(o.chunks) ? o.chunks : ['#E9B44C', '#D46A2A', '#A8321C', '#F0C766'])}" transform="rotate(${f(rand(0, 90))} 200 180)" opacity=".9"/>`).join('') : '';
  const inner = `<clipPath id="${id}"><rect x="138" y="98" width="124" height="156" rx="24"/></clipPath>` +
    `<rect x="138" y="98" width="124" height="156" rx="24" fill="${contentCol}"/>` +
    `<g clip-path="url(#${id})">${chunks}<rect x="138" y="98" width="124" height="14" fill="${shade(contentCol, .3)}" opacity=".6"/></g>` +
    `<rect x="138" y="98" width="124" height="156" rx="24" fill="none" stroke="${shade(contentCol, -0.3)}" stroke-width="3"/>` +
    `<rect x="152" y="114" width="11" height="124" rx="5.5" fill="#fff" opacity=".35"/>` +
    `<rect x="146" y="72" width="108" height="32" rx="6" fill="${lidCol}"/>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M${154 + i * 8} 76 V100" stroke="${shade(lidCol, -.25)}" stroke-width="2"/>`).join('') +
    `<rect x="152" y="150" width="96" height="56" rx="7" fill="#FFF8EC" stroke="${lidCol}" stroke-width="2"/>` +
    labelText(label, 200, 184, 100, lidCol);
  return frame(o.bg || contentCol, o.small ? G('translate(200 258) scale(.82) translate(-200 -258)', inner) + (o.extra || '') : inner + (o.extra || ''));
}
function bottle() {
  const body = 'M172 70 L228 70 L228 96 C262 110 272 132 272 162 L272 240 Q272 256 256 256 L144 256 Q128 256 128 240 L128 162 C128 132 138 110 172 96 Z';
  const petals = Array.from({ length: 10 }, (_, i) => `<ellipse cx="170" cy="${190 - 13}" rx="4" ry="9" fill="#F2B42B" transform="rotate(${i * 36} 170 190)"/>`).join('');
  return frame('#F4C542',
    `<path d="${body}" fill="#F4C542" opacity=".95" stroke="#C99A1B" stroke-width="3"/>` +
    `<path d="M140 166 V238" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".4"/>` +
    `<rect x="172" y="50" width="56" height="24" rx="4" fill="#E2602A"/>` +
    `<rect x="138" y="160" width="124" height="62" rx="7" fill="#FFF8EC"/>${petals}<circle cx="170" cy="190" r="7" fill="#6B4423"/>` +
    `<text x="226" y="186" font-size="11" fill="#2E7A34" ${FONT}>SUNFLOWER</text><text x="226" y="206" font-size="17" fill="#2E7A34" ${FONT}>OIL</text>` +
    G('translate(318 236) rotate(-20)', `<ellipse cx="0" cy="0" rx="12" ry="20" fill="#3B2A22"/><ellipse cx="22" cy="10" rx="10" ry="16" fill="#3B2A22"/>`));
}

/* ---------- plates of sweets and breads ---------- */
const zoom = s => G('translate(200 204) scale(1.2) translate(-200 -204)', s);
const plate = () => `<ellipse cx="200" cy="202" rx="152" ry="52" fill="#F5F0E8" stroke="#D9D1C2" stroke-width="3"/><ellipse cx="200" cy="200" rx="120" ry="37" fill="none" stroke="#E4DCCD" stroke-width="2"/>`;
function cube(x, y, s, col, o = {}) {
  const h = s / 2, dx = s * .28, dy = s * .22;
  return `<polygon points="${x - h},${y - h} ${x - h + dx},${y - h - dy} ${x + h + dx},${y - h - dy} ${x + h},${y - h}" fill="${shade(col, .25)}"/>` +
    `<polygon points="${x + h},${y - h} ${x + h + dx},${y - h - dy} ${x + h + dx},${y + h - dy} ${x + h},${y + h}" fill="${shade(col, -.2)}"/>` +
    `<rect x="${x - h}" y="${y - h}" width="${s}" height="${s}" fill="${col}"/>` +
    (o.flaky ? [.25, .5, .75].map(t => `<path d="M${x - h + 3} ${y - h + s * t} H${x + h - 3}" stroke="${shade(col, -.15)}" stroke-width="1.5"/>`).join('') : '') +
    (o.nuts ? Array.from({ length: 4 }, () => `<ellipse cx="${f(x + rand(-h + 6, h + dx - 6))}" cy="${f(y - h - rand(2, dy - 2))}" rx="3" ry="1.6" fill="#7DAA3C"/>`).join('') : '');
}
function sweetsPlate(kind) {
  let s = '';
  if (kind === 'katli') {
    const dia = (x, y) => `<polygon points="${x - 24},${y} ${x},${y + 13} ${x + 24},${y} ${x + 24},${y + 6} ${x},${y + 19} ${x - 24},${y + 6}" fill="#D8CBAE"/>` +
      `<polygon points="${x - 24},${y} ${x},${y - 13} ${x + 24},${y} ${x},${y + 13}" fill="#F1E9D6" stroke="#CDBF9F" stroke-width="1.2"/>` +
      `<polygon points="${x - 10},${y - 2} ${x},${y - 8} ${x + 8},${y - 3} ${x},${y + 3}" fill="#fff" opacity=".7"/>`;
    [[150, 172], [200, 172], [250, 172], [125, 192], [175, 192], [225, 192], [275, 192], [150, 212], [200, 212], [250, 212]].forEach(([x, y]) => s += dia(x, y));
    return frame('#C9B48A', zoom(plate() + s));
  }
  if (kind === 'soan') {
    [[150, 192], [208, 186], [262, 196], [178, 222], [236, 224]].forEach(([x, y]) => s += cube(x, y, 40, '#E8C46A', { flaky: true, nuts: true }));
    return frame('#E8C46A', zoom(plate() + s));
  }
  if (kind === 'jaggery') {
    [[160, 196, 42], [222, 190, 46], [196, 224, 36], [262, 220, 32]].forEach(([x, y, z]) => s += cube(x, y, z, '#A86A2C'));
    return frame('#C88A3E', zoom(plate() + s));
  }
  if (kind === 'samosa') {
    const sam = (x, y, r) => G(`rotate(${r} ${x} ${y})`, `<polygon points="${x - 34},${y + 18} ${x + 34},${y + 18} ${x + 4},${y - 34}" fill="#D9A441" stroke="#A9772A" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M${x - 30} ${y + 12} L${x + 2} ${y - 28}" stroke="#B9832E" stroke-width="2" stroke-dasharray="4 4"/>` +
      Array.from({ length: 5 }, () => `<circle cx="${f(x + rand(-14, 14))}" cy="${f(y + rand(0, 12))}" r="1.6" fill="#B9832E"/>`).join(''));
    s = `<ellipse cx="292" cy="182" rx="26" ry="10" fill="#E8E0D2"/><ellipse cx="292" cy="180" rx="20" ry="6.5" fill="#5E9B3A"/>` + sam(150, 200, -6) + sam(250, 204, 8) + sam(200, 186, 0);
    return frame('#D9A441', zoom(plate() + s));
  }
  if (kind === 'parotta') {
    for (let i = 0; i < 4; i++) s += `<ellipse cx="200" cy="${222 - i * 10}" rx="96" ry="30" fill="${i % 2 ? '#E9C88A' : '#E2BC78'}" stroke="#C99A55" stroke-width="2"/>`;
    [70, 52, 34, 16].forEach(r => s += `<ellipse cx="200" cy="192" rx="${r * 1.2}" ry="${r * .36}" fill="none" stroke="#C99A55" stroke-width="2" opacity=".7"/>`);
    s += Array.from({ length: 10 }, () => `<ellipse cx="${f(rand(130, 270))}" cy="${f(rand(178, 204))}" rx="${f(rand(4, 9))}" ry="2.5" fill="#B87A3A" opacity=".45"/>`).join('');
    return frame('#E2BC78', zoom(plate() + s));
  }
  if (kind === 'naan') {
    const naan = (x, y, r) => G(`translate(${x} ${y}) rotate(${r})`,
      `<path d="M-74 0 C-74 -32 -20 -36 42 -26 C78 -20 88 0 78 14 C62 32 -10 36 -52 28 C-68 24 -74 12 -74 0 Z" fill="#EDCB8C" stroke="#C99A55" stroke-width="2.5"/>` +
      Array.from({ length: 9 }, () => `<ellipse cx="${f(rand(-55, 60))}" cy="${f(rand(-18, 18))}" rx="${f(rand(3, 7))}" ry="${f(rand(2, 4))}" fill="#8A5A2B" opacity=".55"/>`).join('') +
      Array.from({ length: 12 }, () => `<ellipse cx="${f(rand(-55, 60))}" cy="${f(rand(-18, 18))}" rx="2.2" ry="1.2" fill="#3F8F3A"/>`).join(''));
    return frame('#E3B76A', zoom(plate() + naan(180, 190, -8) + naan(222, 210, 7)));
  }
}
function paneerBoard() {
  let s = `<path d="M70 196 L330 196 L346 244 L54 244 Z" fill="#C9935C"/><path d="M54 244 L346 244 L346 256 L54 256 Z" fill="#9C6A3A"/>` +
    [206, 218, 230].map(y => `<path d="M80 ${y} Q200 ${y + 4} 330 ${y}" stroke="#B07D48" stroke-width="1.5" fill="none"/>`).join('');
  s += `<polygon points="110,140 134,124 244,124 220,140" fill="#FFFFFF"/><polygon points="220,140 244,124 244,192 220,208" fill="#E6DECC"/>` +
    `<rect x="110" y="140" width="110" height="68" fill="#FAF6EC"/>` +
    Array.from({ length: 18 }, () => `<circle cx="${f(rand(116, 214))}" cy="${f(rand(146, 202))}" r="1.2" fill="#E2D8C2"/>`).join('');
  [[272, 214, 24], [306, 226, 22], [262, 236, 20], [298, 202, 20]].sort((a, b) => a[1] - b[1]).forEach(([x, y, z]) => s += cube(x, y, z, '#FAF6EC'));
  return frame('#E0D3B8', s);
}

/* ---------- fresh produce ---------- */
function bunch(kind, col) {
  let stems = '', leaves = '';
  const N = kind === 'spinach' ? 7 : 9;
  for (let i = 0; i < N; i++) {
    const a = (-62 + i * 124 / (N - 1) + rand(-5, 5)) * Math.PI / 180, L = rand(105, 140);
    const ex = 200 + L * Math.sin(a), ey = 236 - L * Math.cos(a);
    stems += `<path d="M200 236 Q${f(200 + L * .4 * Math.sin(a))} ${f(236 - L * .6 * Math.cos(a))} ${f(ex)} ${f(ey)}" stroke="${shade(col, kind === 'curry' ? -.2 : .2)}" stroke-width="${kind === 'spinach' ? 4 : 2.5}" fill="none"/>`;
    const deg = a * 180 / Math.PI;
    if (kind === 'spinach') {
      leaves += G(`rotate(${f(deg)} ${f(ex)} ${f(ey)})`, `<ellipse cx="${f(ex)}" cy="${f(ey - 20)}" rx="26" ry="40" fill="${R() < .5 ? col : shade(col, .1)}" stroke="${shade(col, -.25)}" stroke-width="1.5"/><path d="M${f(ex)} ${f(ey + 16)} V${f(ey - 54)}" stroke="${shade(col, .35)}" stroke-width="2"/>`);
    } else if (kind === 'curry') {
      for (let t = .35; t <= 1.01; t += .13) {
        const x = 200 + L * t * Math.sin(a), y = 236 - L * t * Math.cos(a);
        for (const side of [-1, 1]) leaves += piece('leaf', x + side * 9 * Math.cos(a), y + side * 9 * Math.sin(a), col, deg - 90 + side * 50);
      }
    } else {
      const r = kind === 'methi' ? 7 : 9;
      for (const t of [.6, .8, 1]) {
        const x = 200 + L * t * Math.sin(a), y = 236 - L * t * Math.cos(a);
        [[-1, 0], [1, 0], [0, -1]].forEach(([dx, dy]) => leaves += `<circle cx="${f(x + dx * r)}" cy="${f(y + dy * r)}" r="${r}" fill="${R() < .5 ? col : shade(col, .12)}" stroke="${shade(col, -.25)}" stroke-width="1"/>`);
      }
    }
  }
  const tie = `<rect x="184" y="222" width="32" height="14" rx="4" fill="#C9A15A"/><path d="M188 229 H212" stroke="#9C7A3A" stroke-width="1.5"/>` +
    `<path d="M194 236 L188 262 M200 236 L200 264 M206 236 L212 262" stroke="${shade(col, .25)}" stroke-width="3"/>`;
  return frame(col, stems + leaves + tie);
}
function chilis(col) {
  const cap = '#2F6E2A';
  const one = (x, y, r) => G(`translate(${x} ${y}) rotate(${r})`,
    `<path d="M0 -10 C45 -15 108 -8 142 22 C102 6 45 10 0 10 Z" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="1.5"/>` +
    `<path d="M14 -5 C52 -9 96 -4 122 10" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>` +
    `<ellipse cx="-2" cy="0" rx="8" ry="11" fill="${cap}"/><path d="M-8 0 q-14 -4 -18 -18" stroke="${cap}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  return frame(col, one(110, 112, 4) + one(126, 146, 12) + one(102, 182, -2) + one(130, 214, 8));
}
function ginger() {
  const c = '#D9B47A', parts = [[200, 192, 84, 34, 0], [138, 160, 32, 22, -35], [258, 150, 30, 20, 30], [300, 196, 28, 18, 0], [116, 214, 26, 16, 10], [214, 150, 24, 18, -10]];
  const ell = (p, extra) => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${p[2]}" ry="${p[3]}" transform="rotate(${p[4]} ${p[0]} ${p[1]})" ${extra}/>`;
  return frame(c,
    parts.map(p => ell(p, `fill="${c}" stroke="#A47C45" stroke-width="5"`)).join('') +
    parts.map(p => ell(p, `fill="${c}"`)).join('') +
    [[160, 192], [200, 186], [240, 196], [140, 162], [258, 152]].map(([x, y]) => `<path d="M${x} ${y - 14} q6 14 0 28" stroke="#B48A52" stroke-width="2" fill="none"/>`).join('') +
    `<ellipse cx="312" cy="196" rx="8" ry="14" fill="#F2DDA8" stroke="#B48A52" stroke-width="2"/>` +
    `<path d="M150 182 Q200 170 260 180" stroke="#fff" stroke-width="5" opacity=".3" fill="none" stroke-linecap="round"/>`);
}
function garlic() {
  const bulb = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
    `<path d="M0 -62 C10 -42 52 -32 52 5 C52 40 26 52 0 52 C-26 52 -52 40 -52 5 C-52 -32 -10 -42 0 -62 Z" fill="#F4EEE2" stroke="#CDBFA8" stroke-width="2.5"/>` +
    [-26, 0, 26].map(x => `<path d="M0 -50 Q${x * 1.3} -6 ${x * .6} 50" stroke="#C9B2C4" stroke-width="2" fill="none"/>`).join('') +
    `<path d="M-8 52 l-4 8 M0 52 v9 M8 52 l4 8" stroke="#BDAA8C" stroke-width="2"/>`);
  return frame('#D8CBB5', bulb(160, 186, 1.15) + bulb(256, 200, .9) +
    `<path d="M300 252 C290 228 316 214 330 222 C322 234 318 246 300 252 Z" fill="#F4EEE2" stroke="#CDBFA8" stroke-width="2"/>`);
}
function onions(c = '#8E2A5A') {
  const on = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
    `<path d="M0 -72 C6 -56 62 -46 62 5 C62 46 30 60 0 60 C-30 60 -62 46 -62 5 C-62 -46 -6 -56 0 -72 Z" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="2.5"/>` +
    [-34, -14, 14, 34].map(x => `<path d="M0 -62 Q${x * 1.4} 0 ${x * .5} 58" stroke="${shade(c, .25)}" stroke-width="2" fill="none"/>`).join('') +
    `<path d="M-30 -20 Q-38 10 -26 34" stroke="#fff" stroke-width="5" opacity=".25" fill="none" stroke-linecap="round"/>`);
  const half = `<ellipse cx="300" cy="232" rx="44" ry="26" fill="#F3E3EC" stroke="${c}" stroke-width="5"/>` +
    [32, 22, 12].map(r => `<ellipse cx="300" cy="232" rx="${r}" ry="${r * .6}" fill="none" stroke="#D9A9C2" stroke-width="2.5"/>`).join('');
  return frame(c, on(140, 176, 1.05) + on(222, 190, .95) + half);
}
function tomatoes() {
  const t = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E0342C" stroke="#A8211B" stroke-width="2"/>` +
    `<ellipse cx="${x - r * .35}" cy="${y - r * .35}" rx="${r * .25}" ry="${r * .15}" fill="#fff" opacity=".45" transform="rotate(-35 ${x - r * .35} ${y - r * .35})"/>` +
    `<polygon points="${Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? 5 : 15; return `${f(x + rr * Math.cos(a))},${f(y - r + 8 + rr * Math.sin(a) * .5)}`; }).join(' ')}" fill="#3E8E2F"/>` +
    `<path d="M${x} ${y - r + 6} q2 -10 8 -12" stroke="#3E8E2F" stroke-width="3" fill="none"/>`;
  return frame('#E0342C', t(200, 146, 46) + t(150, 200, 50) + t(254, 202, 52));
}
function potatoes(c = '#C8955A') {
  const p = (x, y, rx, ry, r) => G(`rotate(${r} ${x} ${y})`, `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="#94673A" stroke-width="2.5"/>` +
    Array.from({ length: 5 }, () => `<path d="M${f(x + rand(-rx * .6, rx * .6))} ${f(y + rand(-ry * .5, ry * .5))} q3 -3 6 0" stroke="#8A5E33" stroke-width="2" fill="none"/>`).join('') +
    Array.from({ length: 10 }, () => `<circle cx="${f(x + rand(-rx * .7, rx * .7))}" cy="${f(y + rand(-ry * .6, ry * .6))}" r="1.3" fill="#A67845"/>`).join(''));
  return frame(c, p(206, 160, 58, 36, -8) + p(146, 210, 60, 38, 10) + p(262, 214, 56, 36, -12));
}
function cauliflower() {
  const lv = '#5E9B4C';
  let s = [[-50, 120, 230], [50, 280, 230], [-20, 150, 250], [20, 250, 250]].map(([r, x, y]) =>
    G(`rotate(${r} ${x} ${y})`, `<ellipse cx="${x}" cy="${y - 30}" rx="34" ry="62" fill="${lv}" stroke="${shade(lv, -.3)}" stroke-width="2"/><path d="M${x} ${y + 28} V${y - 84}" stroke="${shade(lv, .4)}" stroke-width="3"/>`)).join('');
  const fl = [];
  for (let i = 0; i < 26; i++) { const [x, y] = ellPts(1, 200, 158, 84, 52)[0]; fl.push([x, y, rand(16, 24)]); }
  fl.sort((a, b) => a[1] - b[1]);
  s += fl.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#F3EAD2" stroke="#D8CBA8" stroke-width="5"/>`).join('');
  s += fl.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#F3EAD2"/><circle cx="${f(x - 4)}" cy="${f(y - 4)}" r="${f(r * .35)}" fill="#fff" opacity=".6"/>`).join('');
  return frame(lv, s);
}
function okra() {
  const c = '#6BA539';
  const pod = (x, y, r) => G(`translate(${x} ${y}) rotate(${r})`,
    `<path d="M0 -12 C40 -16 122 -6 156 0 C122 6 40 16 0 12 Z" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.5"/>` +
    `<path d="M6 -4 C50 -6 110 -2 146 0 M6 4 C50 6 110 2 146 0" stroke="${shade(c, -.2)}" stroke-width="1.2" fill="none"/>` +
    `<rect x="-14" y="-8" width="16" height="16" rx="4" fill="#4E7F2A"/><path d="M-14 0 h-10" stroke="#4E7F2A" stroke-width="5" stroke-linecap="round"/>`);
  return frame(c, pod(110, 118, 8) + pod(96, 152, 2) + pod(118, 186, -4) + pod(104, 222, 4));
}
function lemons(c = '#F5CF2E') {
  const l = (x, y, s, r) => G(`translate(${x} ${y}) rotate(${r}) scale(${s})`,
    `<path d="M-64 0 C-56 -42 56 -42 64 0 C56 42 -56 42 -64 0 Z" fill="${c}" stroke="#CFA80F" stroke-width="2.5"/><circle cx="-66" cy="0" r="5" fill="${c}" stroke="#CFA80F" stroke-width="2"/><circle cx="66" cy="0" r="5" fill="${c}" stroke="#CFA80F" stroke-width="2"/>` +
    `<path d="M-30 -22 Q0 -32 26 -24" stroke="#fff" stroke-width="5" opacity=".4" fill="none" stroke-linecap="round"/>`);
  const half = `<circle cx="282" cy="206" r="46" fill="#F2C912"/><circle cx="282" cy="206" r="40" fill="#FBE58B"/>` +
    Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M282 206 L${f(282 + 36 * Math.cos(a))} ${f(206 + 36 * Math.sin(a))}" stroke="#F2D24A" stroke-width="3"/>`; }).join('') +
    `<circle cx="282" cy="206" r="5" fill="#F2D24A"/>`;
  return frame(c, l(150, 170, 1, -12) + l(176, 222, .85, 8) + half);
}
function mangoes(a = '#F4C13A', b = '#F2B630') { return frame(b, mangoShape(150, 186, 1, a) + mangoShape(262, 196, .9, b)); }

/* ---------- household & pooja ---------- */
function diyas(clay = '#C2582B') {
  const d = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
    `<circle cx="56" cy="-42" r="28" fill="#FFD36B" opacity=".35"/>` +
    `<path d="M-50 -6 C-46 24 44 24 50 -6 C30 -14 -30 -14 -50 -6 Z" fill="${clay}" stroke="#8E3A18" stroke-width="2"/>` +
    `<ellipse cx="0" cy="-7" rx="40" ry="7" fill="#7A3416"/><path d="M40 -10 L64 -18 L50 2 Z" fill="${clay}" stroke="#8E3A18" stroke-width="2"/>` +
    [-30, -15, 0, 15, 30].map(x => `<circle cx="${x}" cy="6" r="3" fill="#F2C14E"/>`).join('') +
    `<path d="M57 -16 V-24" stroke="#3a2410" stroke-width="2.5"/>` +
    `<path d="M57 -66 C68 -48 66 -30 57 -24 C48 -30 46 -48 57 -66 Z" fill="#FFA41B"/><path d="M57 -52 C61 -44 60 -34 57 -32 C54 -34 53 -44 57 -52 Z" fill="#FFF3B0"/>`);
  return frame('#E07B1F', d(186, 168, 1) + d(116, 228, .95) + d(250, 232, .95));
}
function incense(col = '#B23A5A') {
  const stick = (x1, y1, x2, y2) => {
    const sx = f(x2 - (x2 - x1) * .78), sy = f(y2 - (y2 - y1) * .78);
    return `<line x1="${x1}" y1="${y1}" x2="${sx}" y2="${sy}" stroke="#D2A86A" stroke-width="3"/><line x1="${sx}" y1="${sy}" x2="${x2}" y2="${y2}" stroke="#6B3B2A" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="${x2}" cy="${y2}" r="4" fill="#FF7A1A"/><circle cx="${x2}" cy="${y2}" r="9" fill="#FF7A1A" opacity=".25"/>` +
      `<path d="M${x2} ${y2 - 6} c-14 -16 14 -26 0 -42 c-12 -14 10 -22 2 -36" stroke="#8F969E" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`;
  };
  return frame(col,
    G('rotate(-6 200 236)', `<rect x="72" y="228" width="256" height="14" rx="7" fill="#8B5A2B"/><path d="M80 235 H320" stroke="#A8743E" stroke-width="2"/>`) +
    stick(112, 232, 200, 104) + stick(118, 232, 252, 116) + stick(108, 232, 158, 96) +
    G('rotate(4 260 268)', [0, 6, 12, 18, 24].map(o => `<line x1="200" y1="${262 + o / 3}" x2="330" y2="${262 + o / 3}" stroke="${o % 12 ? col : shade(col, -.3)}" stroke-width="3" stroke-linecap="round"/>`).join('')));
}
function tumblers() {
  const t = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
    `<path d="M-40 -62 L40 -62 L31 50 Q0 58 -31 50 Z" fill="#BCC4CE" stroke="#8F98A3" stroke-width="2"/>` +
    `<path d="M-30 -56 L-22 46" stroke="#fff" stroke-width="7" opacity=".6" stroke-linecap="round"/><path d="M22 -56 L16 46" stroke="#8F98A3" stroke-width="6" opacity=".5" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="-62" rx="40" ry="9" fill="#E6EAEF" stroke="#8F98A3" stroke-width="2"/><ellipse cx="0" cy="-61" rx="33" ry="6" fill="#9AA3AE"/>`);
  return frame('#8FA3B8', t(136, 176, .9) + t(264, 176, .9) + t(200, 204, 1.05));
}
function soap() {
  const c = '#9ACFC0';
  return frame(c,
    `<rect x="116" y="158" width="168" height="84" rx="32" fill="${shade(c, -.25)}"/>` +
    `<rect x="116" y="142" width="168" height="84" rx="32" fill="${c}"/>` +
    `<rect x="140" y="160" width="120" height="48" rx="22" fill="none" stroke="${shade(c, .4)}" stroke-width="4"/>` +
    `<path d="M188 184 q12 -16 24 0 q-12 16 -24 0" fill="${shade(c, .35)}"/>` +
    [[266, 124, 14], [292, 104, 9], [248, 100, 7], [306, 136, 6], [130, 132, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".55" stroke="#fff" stroke-width="2"/>`).join(''));
}

/* ---------- recipe dishes ---------- */
function curryBowl(bg, col, bc, toppings, side = '') {
  const id = UID + 'c';
  return frame(bg,
    `<path d="M84 160 C90 236 140 258 200 258 C260 258 310 236 316 160 Z" fill="${bc}"/>` +
    `<path d="M104 196 Q118 232 160 248" stroke="#fff" stroke-width="7" opacity=".35" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="200" cy="160" rx="116" ry="42" fill="${shade(bc, .25)}"/>` +
    `<clipPath id="${id}"><ellipse cx="200" cy="162" rx="100" ry="33"/></clipPath>` +
    `<ellipse cx="200" cy="162" rx="100" ry="33" fill="${col}"/><g clip-path="url(#${id})">${toppings}</g>` + side);
}
const cilantro = n => Array.from({ length: n }, () => { const [x, y] = ellPts(1, 200, 160, 80, 24)[0];
  return [[-4, 0], [4, 0], [0, -4]].map(([a, b]) => `<circle cx="${f(x + a)}" cy="${f(y + b)}" r="4.2" fill="#3F8F3A"/>`).join(''); }).join('');
function recipeArt(id) {
  if (id === 'dal') return curryBowl('#E8B53C', '#E8B33A', '#B8693A',
    `<path d="M140 156 Q200 136 262 160 Q210 176 150 168" stroke="#D9822B" stroke-width="7" fill="none" opacity=".7"/>` +
    Array.from({ length: 10 }, () => { const [x, y] = ellPts(1, 200, 162, 80, 24)[0]; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rand(4, 8))}" ry="${f(rand(2, 4))}" fill="#F6D27A" opacity=".8"/>`; }).join('') +
    ellPts(18, 200, 162, 80, 24).map(([x, y]) => piece('oval', x, y, '#5B3A1E')).join('') +
    G('translate(236 150) rotate(20) scale(.32)', `<path d="M0 -10 C45 -15 108 -8 142 22 C102 6 45 10 0 10 Z" fill="#A8211B"/>`) +
    G('translate(150 168) rotate(-30) scale(.28)', `<path d="M0 -10 C45 -15 108 -8 142 22 C102 6 45 10 0 10 Z" fill="#A8211B"/>`) + cilantro(7));
  if (id === 'chana') return curryBowl('#C2622E', '#B4562C', '#EFE8DC',
    ellPts(26, 200, 162, 88, 28).map(([x, y]) => piece('chickpea', x, y, '#E2B670')).join('') +
    `<path d="M170 150 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0" stroke="#E7B8C8" stroke-width="3" fill="none"/>` + cilantro(8),
    G('translate(330 246)', `<path d="M-30 0 A30 30 0 0 1 30 0 Z" fill="#F5CF2E" stroke="#CFA80F" stroke-width="2"/><path d="M-24 -2 A24 24 0 0 1 24 -2 Z" fill="#FBE58B"/>`));
  if (id === 'palak') return curryBowl('#3F7A2C', '#3F7A2C', '#EFE8DC',
    ellPts(12, 200, 162, 80, 24).map(([x, y]) => piece('cube', x, y, '#F7F1E3', rand(-20, 20))).join('') +
    `<path d="M168 160 c10 -12 40 -12 50 0 c-10 10 -34 10 -40 0 c6 -6 22 -6 28 0" stroke="#FFF8EC" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  if (id === 'aloogobi') {
    let s = plate();
    const pts = ellPts(30, 200, 194, 100, 28);
    s += pts.map(([x, y], i) => i % 3 === 0
      ? [[0, 0], [-7, -6], [7, -6]].map(([a, b]) => `<circle cx="${f(x + a)}" cy="${f(y + b)}" r="8" fill="#F1D97C" stroke="#D9BC55" stroke-width="1"/>`).join('')
      : `<rect x="${f(x - 9)}" y="${f(y - 8)}" width="18" height="16" rx="3" fill="#E7B53A" stroke="#C8932A" stroke-width="1" transform="rotate(${f(rand(-25, 25))} ${f(x)} ${f(y)})"/>`).join('');
    s += Array.from({ length: 8 }, () => { const [x, y] = ellPts(1, 200, 190, 90, 24)[0]; return `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="#3F8F3A"/><circle cx="${f(x + 5)}" cy="${f(y + 2)}" r="3.5" fill="#3F8F3A"/>`; }).join('');
    return frame('#E7B53A', zoom(s));
  }
  if (id === 'biryani') {
    const id2 = UID + 'r', M = 'M108 206 C126 112 274 112 292 206 Z';
    let s = plate() + `<clipPath id="${id2}"><path d="${M}"/></clipPath><path d="${M}" fill="#EFE3C8"/><g clip-path="url(#${id2})">`;
    const pts = [];
    while (pts.length < 300) { const x = rand(108, 292), y = rand(120, 206), t = (x - 200) / 92; if (y > 206 - 70 * (1 - t * t)) pts.push([x, y]); }
    pts.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => s += piece('grain', x, y, pick(['#FBF7EE', '#FBF7EE', '#FBF7EE', '#F2B43A', '#E8742A'])));
    s += Array.from({ length: 22 }, () => { const x = rand(120, 280), y = rand(150, 204); return R() < .5 ? piece('pea', x, y, '#5FA83A') : `<rect x="${f(x)}" y="${f(y)}" width="7" height="7" fill="#E8742A"/>`; }).join('');
    s += `</g>` + [[170, 140], [214, 128], [236, 150]].map(([x, y]) => piece('leaf', x, y, '#3F9A4A', rand(0, 180))).join('') +
      Array.from({ length: 8 }, () => `<path d="M${f(rand(140, 260))} ${f(rand(136, 180))} q5 -6 10 0" stroke="#8A4A1E" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
    return frame('#E8A33A', zoom(s));
  }
  if (id === 'chai') {
    const k = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
      `<path d="M-42 -52 L42 -52 L31 46 Q0 56 -31 46 Z" fill="#B5532F" stroke="#8A3A1E" stroke-width="2"/>` +
      [-20, 0, 20].map(o => `<path d="M-36 ${o} H36" stroke="#9C4426" stroke-width="2" opacity=".6"/>`).join('') +
      `<ellipse cx="0" cy="-52" rx="42" ry="10" fill="#C9663D"/><ellipse cx="0" cy="-51" rx="35" ry="7" fill="#C99566"/>` +
      `<path d="M-12 -66 c-10 -14 10 -22 0 -36 M10 -66 c-10 -14 10 -22 0 -36" stroke="#fff" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>`);
    return frame('#B5794A', k(150, 196, 1) + k(254, 204, .9) + piece('pod', 92, 262, '#7FA650', 20) + piece('pod', 112, 274, '#7FA650', -30) +
      G('rotate(-10 320 266)', `<rect x="290" y="260" width="80" height="13" rx="6.5" fill="#A0602F"/>`));
  }
  if (id === 'gj') return curryBowl('#C0662A', '#E3A140', '#EFE8DC',
    [[160, 158], [204, 150], [244, 162], [196, 176]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24" fill="#7A3418"/><circle cx="${x - 8}" cy="${y - 9}" r="7" fill="#B0602E" opacity=".7"/>`).join('') +
    Array.from({ length: 10 }, () => piece('tea', rand(140, 260), rand(140, 180), '#7DAA3C')).join(''));
  if (id === 'lassi') {
    const id2 = UID + 'l';
    return frame('#F7B533',
      `<path d="M150 64 L250 64 L238 252 Q200 260 162 252 Z" fill="#fff" opacity=".55"/>` +
      `<clipPath id="${id2}"><path d="M150 64 L250 64 L238 252 Q200 260 162 252 Z"/></clipPath>` +
      `<g clip-path="url(#${id2})"><rect x="140" y="88" width="120" height="180" fill="#F7B533"/><ellipse cx="200" cy="90" rx="52" ry="9" fill="#FCE3A6"/>` +
      Array.from({ length: 8 }, () => `<circle cx="${f(rand(170, 230))}" cy="${f(rand(86, 94))}" r="1.5" fill="#7FA650"/>`).join('') + `</g>` +
      `<path d="M150 64 L250 64 L238 252 Q200 260 162 252 Z" fill="none" stroke="#E2D4BC" stroke-width="4"/>` +
      `<path d="M166 80 L176 240" stroke="#fff" stroke-width="7" opacity=".5" stroke-linecap="round"/>` +
      G('rotate(18 228 70)', `<rect x="222" y="22" width="12" height="110" fill="#fff"/>` + [0, 1, 2, 3, 4].map(i => `<rect x="222" y="${26 + i * 22}" width="12" height="10" fill="#D9342B"/>`).join('')) +
      `<ellipse cx="316" cy="246" rx="44" ry="13" fill="#EFE8DC"/>` + [[300, 236], [320, 232], [332, 242], [308, 246]].map(([x, y]) => cube(x, y, 14, '#F5A623')).join(''));
  }
}

/* ---------- hero: top-down thali (square, transparent background) ---------- */
function heroThali() {
  const katori = (cx, cy, r, col, inner) => {
    const id = UID + 'k' + cx;
    return `<circle cx="${cx + 4}" cy="${cy + 8}" r="${r}" fill="#2a2018" opacity=".16"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#steel)" stroke="#97A1AC" stroke-width="2"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="${col}" stroke="#A9B2BC" stroke-width="2"/>` +
      `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r - 11}"/></clipPath><g clip-path="url(#${id})">${inner}</g>` +
      `<path d="M${cx - r + 5} ${cy - 6} A${r - 5} ${r - 5} 0 0 1 ${cx - 6} ${cy - r + 5}" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`;
  };
  const inC = (n, cx, cy, r) => ellPts(n, cx, cy, r, r);
  const herbs = (n, cx, cy, r) => inC(n, cx, cy, r).map(([x, y]) =>
    [[-3, 0], [3, 0], [0, -3]].map(([a, b]) => `<circle cx="${f(x + a)}" cy="${f(y + b)}" r="3.4" fill="#3F8F3A"/>`).join('')).join('');
  const roti = (x, y, r, rot) => G(`rotate(${rot} ${x} ${y})`,
    `<path d="M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y} Z" fill="#E6C084" stroke="#C99A55" stroke-width="2.5"/>` +
    Array.from({ length: 9 }, () => `<ellipse cx="${f(x + rand(-r * .7, r * .7))}" cy="${f(y - rand(6, r * .6))}" rx="${f(rand(3, 7))}" ry="${f(rand(2, 4))}" fill="#A8692E" opacity=".45"/>`).join(''));
  let s = `<defs><radialGradient id="plate" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#F1F3F6"/><stop offset=".86" stop-color="#C8CFD8"/><stop offset="1" stop-color="#A9B3BE"/></radialGradient>` +
    `<radialGradient id="steel" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#F2F4F6"/><stop offset="1" stop-color="#AEB8C3"/></radialGradient></defs>` +
    `<circle cx="300" cy="300" r="292" fill="url(#plate)" stroke="#97A1AC" stroke-width="3"/>` +
    `<circle cx="300" cy="300" r="250" fill="none" stroke="#B7C0CA" stroke-width="3"/>` +
    `<path d="M88 220 A228 228 0 0 1 220 82" stroke="#fff" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>`;
  s += roti(150, 400, 74, -28) + roti(176, 438, 70, -6);
  s += `<circle cx="232" cy="512" r="56" fill="#EFD8A0" stroke="#D6B66E" stroke-width="2"/>` +
    inC(26, 232, 512, 46).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.8" fill="#3a2a1a"/>`).join('') +
    inC(10, 232, 512, 42).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rand(4, 8))}" fill="#F8E8BE"/>`).join('');
  s += `<ellipse cx="312" cy="398" rx="92" ry="66" fill="#E9E0CB"/>` +
    ellPts(240, 312, 394, 88, 60).map(([x, y]) => piece('grain', x, y, R() < .85 ? '#FBF7EE' : '#F2D58A')).join('') + herbs(5, 312, 380, 40);
  s += katori(178, 186, 80, '#E8B33A',
    `<path d="M128 180 Q178 150 232 186" stroke="#D9822B" stroke-width="8" fill="none" opacity=".7"/>` +
    inC(16, 178, 186, 58).map(([x, y]) => piece('oval', x, y, '#5B3A1E')).join('') + herbs(5, 178, 186, 50));
  s += katori(334, 120, 72, '#3F7A2C', inC(9, 334, 120, 46).map(([x, y]) => piece('cube', x, y, '#F7F1E3', rand(-20, 20))).join('') +
    `<path d="M312 120 c8 -10 34 -10 42 0 c-8 8 -28 8 -32 0" stroke="#FFF8EC" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
  s += katori(462, 228, 74, '#B4562C', inC(16, 462, 228, 52).map(([x, y]) => piece('chickpea', x, y, '#E2B670')).join('') + herbs(4, 462, 228, 44));
  s += katori(474, 384, 56, '#F4F1EA', inC(14, 474, 384, 38).map(([x, y]) => `<rect x="${f(x - 3)}" y="${f(y - 3)}" width="6" height="6" rx="1" fill="#8DBF5A"/>`).join('') +
    inC(18, 474, 384, 38).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.3" fill="#C9341F"/>`).join(''));
  s += katori(392, 506, 50, '#E3A140', `<circle cx="380" cy="500" r="17" fill="#7A3418"/><circle cx="374" cy="494" r="5" fill="#B0602E" opacity=".7"/>` +
    `<circle cx="404" cy="514" r="16" fill="#7A3418"/><circle cx="398" cy="508" r="5" fill="#B0602E" opacity=".7"/>`);
  s += `<path d="M282 262 C296 248 326 252 330 270 C334 288 300 296 286 286 C276 280 276 268 282 262 Z" fill="#C2401C"/>` +
    [[292, 268], [310, 262], [318, 278], [298, 282]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="7" rx="2" fill="#E9B44C"/>`).join('');
  s += G('translate(214 300) rotate(-24) scale(.55)', `<path d="M0 -10 C45 -15 108 -8 142 22 C102 6 45 10 0 10 Z" fill="#3E8E2F"/><ellipse cx="-2" cy="0" rx="8" ry="11" fill="#2F6E2A"/>`);
  s += G('translate(520 300)', `<path d="M-26 0 A26 26 0 0 1 26 0 Z" fill="#F5CF2E" stroke="#CFA80F" stroke-width="2"/><path d="M-20 -2 A20 20 0 0 1 20 -2 Z" fill="#FBE58B"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">${s}</svg>`;
}

/* ---------- juice bottles ---------- */
function juiceBottle(col, label) {
  const body = 'M178 62 L222 62 L222 92 C252 104 262 124 262 150 L262 242 Q262 256 248 256 L152 256 Q138 256 138 242 L138 150 C138 124 148 104 178 92 Z';
  return frame(col,
    `<path d="${body}" fill="${col}" stroke="${shade(col, -.35)}" stroke-width="3"/>` +
    `<path d="M150 158 V238" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".3"/>` +
    `<rect x="176" y="44" width="48" height="22" rx="4" fill="${shade(col, -.4)}"/>` +
    `<rect x="146" y="150" width="108" height="66" rx="8" fill="#FFF8EC"/>` + labelText(label, 200, 186, 90, shade(col, -.3)));
}

/* ---------- kitchenware ---------- */
const STEEL = '#BCC4CE', STEEL_D = '#8F98A3';
const handle = (x1, y1, x2, y2, col = STEEL, w = 13) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${shade(col, -.3)}" stroke-width="${w + 4}" stroke-linecap="round"/>` +
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>` +
  `<line x1="${x1}" y1="${y1 - w * .2}" x2="${x2}" y2="${y2 - w * .2}" stroke="#fff" stroke-width="${w * .25}" stroke-linecap="round" opacity=".5"/>`;
function mesh(cx, cy, r, step = 8) {
  const id = UID + 'h' + cx;
  let g = '';
  for (let v = -r; v <= r; v += step) g += `<path d="M${cx + v} ${cy - r} V${cy + r} M${cx - r} ${cy + v} H${cx + r}" stroke="${STEEL_D}" stroke-width="1" opacity=".7"/>`;
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r}" fill="#DCE1E6"/><g clip-path="url(#${id})">${g}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${STEEL_D}" stroke-width="5"/>`;
}
function utensil(n) {
  let s;
  if (/tea strainer/.test(n)) s = handle(210, 150, 330, 90) + mesh(165, 170, 46, 6) + `<circle cx="112" cy="196" r="8" fill="none" stroke="${STEEL_D}" stroke-width="5"/>`;
  else if (/wire skimmer/.test(n)) {
    s = handle(222, 140, 350, 62, '#C9A15A', 15);
    for (let r = 14; r <= 70; r += 12) s += `<circle cx="160" cy="180" r="${r}" fill="none" stroke="${STEEL_D}" stroke-width="2.5"/>`;
    for (let a = 0; a < 360; a += 30) s += `<line x1="160" y1="180" x2="${f(160 + 72 * Math.cos(a * Math.PI / 180))}" y2="${f(180 + 72 * Math.sin(a * Math.PI / 180))}" stroke="${STEEL_D}" stroke-width="2"/>`;
  } else if (/strainer/.test(n)) s = handle(220, 170, 360, 250) + mesh(150, 140, 74) + `<path d="M80 110 l-16 -10" stroke="${STEEL_D}" stroke-width="8" stroke-linecap="round"/>`;
  else if (/ladle/.test(n)) s = handle(180, 150, 340, 54) + `<circle cx="340" cy="54" r="6" fill="${shade(STEEL, .5)}"/>` +
    `<circle cx="140" cy="186" r="60" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="3"/><circle cx="140" cy="186" r="48" fill="${STEEL_D}"/><path d="M104 168 A40 40 0 0 1 140 146" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>`;
  else if (/slotted/.test(n)) s = handle(180, 150, 340, 56) + G('rotate(-35 140 192)', `<ellipse cx="140" cy="192" rx="64" ry="42" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="3"/>` +
    [-30, -10, 10, 30].map(x => `<rect x="${140 + x - 4}" y="170" width="8" height="44" rx="4" fill="${STEEL_D}"/>`).join(''));
  else if (/skimmer/.test(n)) {
    s = handle(200, 150, 345, 60) + `<circle cx="146" cy="188" r="64" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="3"/>`;
    for (let x = -48; x <= 48; x += 14) for (let y = -48; y <= 48; y += 14) if (x * x + y * y < 52 * 52) s += `<circle cx="${146 + x}" cy="${188 + y}" r="3.5" fill="${STEEL_D}"/>`;
  } else if (/spatula/.test(n)) s = handle(110, 250, 230, 140, '#C08A55', 16) +
    G('rotate(-42 270 104)', `<rect x="236" y="80" width="80" height="48" rx="16" fill="#C08A55" stroke="#8E5E30" stroke-width="3"/><path d="M246 92 H306 M246 104 H306 M246 116 H306" stroke="#A8743E" stroke-width="1.5"/>`);
  else if (/saucepan/.test(n)) s = handle(286, 150, 372, 118, '#2E2B29', 16) +
    `<path d="M112 132 L112 228 Q112 246 130 246 L270 246 Q288 246 288 228 L288 132 Z" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="3"/>` +
    `<ellipse cx="200" cy="132" rx="88" ry="16" fill="#DCE1E6" stroke="${STEEL_D}" stroke-width="3"/><ellipse cx="200" cy="133" rx="76" ry="10" fill="${STEEL_D}"/>` +
    `<path d="M130 150 V230" stroke="#fff" stroke-width="10" opacity=".45" stroke-linecap="round"/>`;
  else if (/frying pan/.test(n)) s = handle(246, 232, 372, 282, '#2E2B29', 18) +
    `<circle cx="168" cy="150" r="104" fill="${STEEL}"/><circle cx="168" cy="150" r="96" fill="#2E2B29"/><circle cx="168" cy="150" r="84" fill="#3A3634"/>` +
    `<path d="M108 108 A74 74 0 0 1 168 76" stroke="#fff" stroke-width="6" fill="none" opacity=".25" stroke-linecap="round"/>`;
  else if (/mixing bowl/.test(n)) s = `<ellipse cx="200" cy="166" rx="100" ry="11" fill="${STEEL_D}"/>` + bowlFront(STEEL);
  else if (/tongs/.test(n)) s = `<path d="M70 250 L320 70" stroke="${STEEL_D}" stroke-width="16" stroke-linecap="round"/><path d="M70 250 L320 70" stroke="${STEEL}" stroke-width="11" stroke-linecap="round"/>` +
    `<path d="M70 250 L338 98" stroke="${STEEL_D}" stroke-width="16" stroke-linecap="round"/><path d="M70 250 L338 98" stroke="${STEEL}" stroke-width="11" stroke-linecap="round"/>` +
    `<circle cx="70" cy="250" r="16" fill="none" stroke="${STEEL_D}" stroke-width="6"/>` +
    `<path d="M312 62 q10 4 14 14 M330 92 q10 4 14 14" stroke="${STEEL_D}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  else s = handle(100, 240, 220, 156, '#E07B1F', 26) +
    `<path d="M226 152 L330 80" stroke="${STEEL_D}" stroke-width="22" stroke-linecap="round"/><path d="M226 152 L330 80" stroke="${STEEL}" stroke-width="17" stroke-linecap="round"/>` +
    `<path d="M248 136 L316 90" stroke="${STEEL_D}" stroke-width="4" stroke-linecap="round"/>`;
  return frame('#8FA3B8', s);
}

/* ---------- recipe dishes for the current recipes ---------- */
function dish(id) {
  const sticks = (n, cols, len = 22) => ellPts(n, 200, 162, 84, 26).map(([x, y]) =>
    `<rect x="${f(x - len / 2)}" y="${f(y - 4)}" width="${len}" height="8" rx="4" fill="${pick(cols)}" transform="rotate(${f(rand(-50, 50))} ${f(x)} ${f(y)})"/>`).join('');
  const leaves = (n, col = '#2E7A34') => ellPts(n, 200, 162, 80, 24).map(([x, y]) => piece('leaf', x, y, col)).join('');
  const butter = (x, y) => `<rect x="${x - 14}" y="${y - 12}" width="28" height="22" rx="4" fill="#F7D774" stroke="#D9B44A" stroke-width="1.5"/><rect x="${x - 10}" y="${y - 9}" width="12" height="6" rx="2" fill="#fff" opacity=".6"/>`;
  const cream = `<path d="M166 160 c10 -12 44 -12 54 0 c-10 10 -38 10 -44 0 c6 -6 24 -6 30 0" stroke="#FFF8EC" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (id === 'sarson') return curryBowl('#4E7A2A', '#4F7A2B', '#B8693A', butter(204, 150) +
    ellPts(10, 200, 162, 80, 24).map(([x, y]) => `<rect x="${f(x)}" y="${f(y)}" width="10" height="3" rx="1.5" fill="#E8C27A"/>`).join(''),
    `<ellipse cx="326" cy="250" rx="48" ry="14" fill="#E8B54A" stroke="#C98F2A" stroke-width="2"/>` + Array.from({ length: 6 }, () => `<circle cx="${f(rand(296, 356))}" cy="${f(rand(244, 256))}" r="2.5" fill="#B87A2A"/>`).join(''));
  if (id === 'sambar') return curryBowl('#C2622E', '#B8562A', '#BCC4CE', sticks(9, ['#6B8F3A', '#7FA650'], 30) +
    ellPts(12, 200, 162, 84, 26).map(([x, y]) => piece('cube', x, y, pick(['#E07B3A', '#F2D46B']))).join('') +
    ellPts(20, 200, 162, 84, 26).map(([x, y]) => piece('round', x, y, '#2A1E16')).join('') + leaves(6));
  if (id === 'avial') return curryBowl('#C9B48A', '#F1E7CE', '#B8603A', sticks(26, ['#F08A2C', '#5E9B3A', '#F2D46B', '#7FA650', '#EADFC4']) +
    Array.from({ length: 16 }, () => `<rect x="${f(rand(130, 270))}" y="${f(rand(140, 184))}" width="8" height="3" fill="#fff"/>`).join('') + leaves(6));
  if (id === 'dalmakhani') return curryBowl('#7A2E1E', '#6E2A1A', '#EFE8DC',
    ellPts(40, 200, 162, 84, 26).map(([x, y]) => piece('lentil', x, y, '#3A1A12')).join('') + cream + butter(232, 156) + cilantro(5));
  if (id === 'undhiyu') {
    let s = plate();
    s += ellPts(46, 200, 194, 104, 30).map(([x, y], i) => [
      piece('cube', x, y, '#7B4A8C'), piece('pod', x, y, '#5E9B3A'), `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="#9C6A2E" stroke="#6E4A1E"/>`,
      `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="#E3C27A" stroke="#B8955A"/>`, piece('oval', x, y, '#5B2A6E')][i % 5]).join('');
    s += Array.from({ length: 30 }, () => `<circle cx="${f(rand(110, 290))}" cy="${f(rand(176, 218))}" r="2" fill="${pick(['#3F8F3A', '#fff'])}"/>`).join('');
    return frame('#7B9B4A', zoom(s));
  }
  if (id === 'bhindi') {
    let s = plate();
    s += ellPts(30, 200, 194, 100, 28).map(([x, y]) => piece('pod', x, y, pick(['#5E9B3A', '#6BA539', '#4E7F2A']))).join('');
    s += Array.from({ length: 10 }, () => `<path d="M${f(rand(120, 280))} ${f(rand(176, 214))} q8 -6 16 0" stroke="#D99AB8" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
    return frame('#6BA539', zoom(s));
  }
  return recipeArt(id);
}

/* ---------- fresh produce & fruit ---------- */
const PILE3 = [[200, 150, .9, -8], [148, 204, 1, 6], [256, 206, 1, -10]];
const pile = (bg, one) => frame(bg, PILE3.map(([x, y, s, r]) => G(`translate(${x} ${y}) rotate(${r}) scale(${s})`, one())).join(''));
function roundFruit(col, o = {}) {
  return pile(col, () =>
    `<circle r="${o.r || 46}" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="2"/>` +
    (o.blush ? `<circle cx="-12" cy="10" r="30" fill="${o.blush}" opacity=".45"/>` : '') +
    (o.dimple ? Array.from({ length: 16 }, () => `<circle cx="${f(rand(-32, 32))}" cy="${f(rand(-32, 32))}" r="1.3" fill="${shade(col, -.2)}"/>`).join('') : '') +
    (o.crease ? `<path d="M0 -44 Q-12 0 0 44" stroke="${shade(col, -.25)}" stroke-width="2.5" fill="none"/>` : '') +
    `<ellipse cx="-16" cy="-18" rx="12" ry="7" fill="#fff" opacity=".35" transform="rotate(-35 -16 -18)"/>` +
    (o.crown ? `<path d="M-12 -42 l3 -14 l6 8 l3 -10 l3 10 l6 -8 l3 14 Z" fill="${shade(col, -.35)}"/>`
      : `<path d="M0 -44 q2 -10 6 -14" stroke="#6B4423" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        (o.leaf === false ? '' : `<path d="M6 -54 C20 -66 38 -62 42 -54 C30 -46 16 -46 6 -54 Z" fill="#3F8F3A"/>`)));
}
function bananas(col) {
  const one = r => G(`rotate(${r} 200 160)`, `<path d="M104 138 C116 238 252 258 312 176 C276 206 160 214 128 140 Z" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="2"/><path d="M308 178 l12 -6" stroke="#5B3A1E" stroke-width="7" stroke-linecap="round"/>`);
  return frame(col, one(-14) + one(-2) + one(10) + `<rect x="98" y="134" width="20" height="18" rx="4" fill="#6B4A1E"/>`);
}
function pineapple() {
  const id = UID + 'p';
  let s = `<clipPath id="${id}"><ellipse cx="200" cy="196" rx="62" ry="78"/></clipPath><ellipse cx="200" cy="196" rx="62" ry="78" fill="#E8A92E" stroke="#B87A1E" stroke-width="3"/><g clip-path="url(#${id})">`;
  for (let k = -8; k <= 8; k++) s += `<path d="M${130 + k * 18} 110 L${290 + k * 18} 290 M${270 - k * 18} 110 L${110 - k * 18} 290" stroke="#B87A1E" stroke-width="2"/>`;
  s += `</g>` + [-40, -22, -8, 8, 22, 40].map((a, i) => `<path d="M200 124 Q${200 + a} ${80 - (i % 2) * 16} ${200 + a * 1.6} ${46 + Math.abs(a)}" stroke="#3F8F3A" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('');
  return frame('#E8A92E', s);
}
function melon(flesh, rind, seeds) {
  if (seeds) return frame(flesh, `<path d="M90 120 A120 120 0 0 0 310 120 Z" fill="${flesh}" transform="translate(0 40)"/><path d="M84 160 A126 126 0 0 0 316 160" stroke="${rind}" stroke-width="16" fill="none"/>` +
    Array.from({ length: 14 }, () => `<ellipse cx="${f(rand(130, 270))}" cy="${f(rand(172, 220))}" rx="3" ry="5" fill="#2A1E16"/>`).join(''));
  return frame(rind, `<circle cx="160" cy="180" r="76" fill="${rind}" stroke="${shade(rind, -.3)}" stroke-width="3"/>` +
    `<path d="M210 120 A80 80 0 0 1 296 230 L210 230 Z" fill="${shade(rind, -.1)}"/><ellipse cx="262" cy="200" rx="58" ry="58" fill="${flesh}" stroke="${shade(rind, -.2)}" stroke-width="6"/><ellipse cx="262" cy="200" rx="26" ry="26" fill="${shade(flesh, -.15)}"/>`);
}
function grapes(col) {
  let s = `<path d="M200 70 q10 -20 30 -24" stroke="#6B4423" stroke-width="5" fill="none"/><path d="M206 66 C230 40 270 46 280 60 C258 74 230 76 206 66 Z" fill="#3F8F3A"/>`;
  const rows = [[5, 90], [5, 122], [4, 154], [3, 186], [2, 218], [1, 248]];
  rows.forEach(([n, y]) => { for (let i = 0; i < n; i++) { const x = 200 + (i - (n - 1) / 2) * 30; s += `<circle cx="${x}" cy="${y}" r="17" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="1.5"/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff" opacity=".4"/>`; } });
  return frame(col, s);
}
function pears(col) {
  return pile(col, () => `<path d="M0 -50 C14 -50 16 -22 24 -6 C40 22 30 52 0 52 C-30 52 -40 22 -24 -6 C-16 -22 -14 -50 0 -50 Z" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="2"/><ellipse cx="-10" cy="12" rx="8" ry="14" fill="#fff" opacity=".3"/><path d="M0 -50 q2 -10 6 -14" stroke="#6B4423" stroke-width="4" fill="none"/>`);
}
function papaya() {
  return frame('#F28C38', `<ellipse cx="160" cy="180" rx="70" ry="98" fill="#7FA650" stroke="#5E8F3A" stroke-width="3" transform="rotate(-20 160 180)"/>` +
    `<ellipse cx="256" cy="196" rx="60" ry="88" fill="#F28C38" stroke="#E8B04A" stroke-width="8" transform="rotate(14 256 196)"/>` +
    Array.from({ length: 22 }, () => `<circle cx="${f(rand(244, 268))}" cy="${f(rand(160, 232))}" r="4" fill="#2A1E16"/>`).join(''));
}
function peppers(col) {
  return pile(col, () => `<path d="M-40 -30 C-52 10 -42 50 -12 52 C-2 46 8 46 18 52 C46 46 54 10 42 -30 C30 -44 -30 -44 -40 -30 Z" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="2"/>` +
    `<path d="M-6 -40 C-10 0 -8 30 -10 48 M14 -40 C18 0 16 30 18 48" stroke="${shade(col, -.15)}" stroke-width="2" fill="none"/><ellipse cx="-22" cy="-6" rx="7" ry="16" fill="#fff" opacity=".3"/>` +
    `<path d="M0 -40 q2 -16 12 -20" stroke="#2F6E2A" stroke-width="8" fill="none" stroke-linecap="round"/>`);
}
function eggplants(col, small) {
  return pile(col, () => G(small ? 'scale(.8)' : 'rotate(30)', `<path d="M0 -40 C28 -40 44 -6 44 24 C44 52 22 66 0 66 C-22 66 -44 52 -44 24 C-44 -6 -28 -40 0 -40 Z" fill="${col}" stroke="${shade(col, -.35)}" stroke-width="2"/>` +
    `<ellipse cx="-18" cy="14" rx="8" ry="20" fill="#fff" opacity=".25"/><path d="M-24 -34 Q0 -20 24 -34 Q16 -48 0 -50 Q-16 -48 -24 -34 Z" fill="#3F7A2C"/><path d="M0 -50 v-16" stroke="#3F7A2C" stroke-width="7" stroke-linecap="round"/>`));
}
function gourds(col, bumpy) {
  const one = (y, r) => G(`translate(200 ${y}) rotate(${r})`, `<path d="M-130 0 C-120 -30 ${bumpy ? 100 : 60} -34 130 -${bumpy ? 4 : 30} C140 ${bumpy ? 20 : -2} ${bumpy ? 100 : 120} 34 -120 18 C-136 14 -136 6 -130 0 Z" fill="${col}" stroke="${shade(col, -.3)}" stroke-width="2"/>` +
    (bumpy ? Array.from({ length: 40 }, () => `<ellipse cx="${f(rand(-110, 110))}" cy="${f(rand(-14, 16))}" rx="5" ry="3" fill="${shade(col, .2)}"/>`).join('') : `<path d="M-100 -10 Q0 -26 100 -24" stroke="#fff" stroke-width="7" opacity=".3" fill="none" stroke-linecap="round"/>`) +
    `<path d="M-130 0 h-14" stroke="#5E8F3A" stroke-width="6" stroke-linecap="round"/>`);
  return frame(col, one(140, -6) + one(206, 4));
}

/* ---------- dairy ---------- */
function carton(col, label) {
  return frame(col, `<polygon points="150,96 200,62 250,96" fill="#F4F4F2" stroke="#C9CCD1" stroke-width="2"/><rect x="190" y="52" width="20" height="14" fill="#E6E8EB"/>` +
    `<rect x="150" y="96" width="100" height="160" fill="#FBFBFA" stroke="#C9CCD1" stroke-width="2"/><rect x="150" y="150" width="100" height="70" fill="${col}"/>` +
    labelText(label, 200, 186, 90) + `<rect x="236" y="96" width="14" height="160" fill="#000" opacity=".06"/>`);
}
function tub(col, label) {
  return frame(col, `<path d="M128 120 L272 120 L258 252 Q200 262 142 252 Z" fill="#FBFBFA" stroke="#C9CCD1" stroke-width="2"/>` +
    `<path d="M134 168 L266 168 L261 222 L139 222 Z" fill="${col}"/>` + labelText(label, 200, 196, 100) +
    `<ellipse cx="200" cy="120" rx="76" ry="14" fill="${shade(col, .15)}" stroke="${shade(col, -.2)}" stroke-width="2"/><ellipse cx="200" cy="116" rx="62" ry="9" fill="${shade(col, .35)}"/>`);
}
function butterBlock() {
  return frame('#F2D774', `<polygon points="110,168 160,134 300,134 250,168" fill="#FBE79A"/><polygon points="250,168 300,134 300,198 250,232" fill="#E8C95A"/><rect x="110" y="168" width="140" height="64" fill="#F7DD7A"/>` +
    `<polygon points="190,168 240,134 300,134 300,198 250,232 190,232" fill="#D9DCE1" opacity=".9"/><path d="M196 176 L240 146" stroke="#fff" stroke-width="3" opacity=".7"/>`);
}
function eggsBox(col) {
  let s = `<path d="M90 190 L310 190 L298 246 L102 246 Z" fill="#C9BFAE" stroke="#A89C88" stroke-width="2"/>`;
  [[125, 172], [175, 168], [225, 168], [275, 172], [150, 194], [200, 192], [250, 194]].forEach(([x, y]) => s += `<ellipse cx="${x}" cy="${y}" rx="24" ry="30" fill="${col}" stroke="${shade(col, -.2)}" stroke-width="1.5"/><ellipse cx="${x - 7}" cy="${y - 10}" rx="5" ry="8" fill="#fff" opacity=".45"/>`);
  return frame('#C9BFAE', s + `<path d="M90 210 L310 210" stroke="#A89C88" stroke-width="2"/>`);
}
function cheeseSlices() {
  let s = '';
  for (let i = 0; i < 5; i++) s += `<polygon points="${120 + i * 4},${200 - i * 10} ${200 + i * 4},${150 - i * 10} ${300 + i * 4},${170 - i * 10} ${220 + i * 4},${220 - i * 10}" fill="${i % 2 ? '#F2C94C' : '#F4D35E'}" stroke="#D9A520" stroke-width="1.5"/>`;
  return frame('#F2C94C', s);
}
function whiteBlock(col, bg, ball) {
  if (ball) return frame(bg, `<ellipse cx="200" cy="232" rx="120" ry="22" fill="#C9935C"/><circle cx="190" cy="176" r="56" fill="${col}" stroke="${shade(col, -.15)}" stroke-width="2"/><ellipse cx="172" cy="156" rx="16" ry="10" fill="#fff" opacity=".7"/><circle cx="270" cy="210" r="22" fill="${col}" stroke="${shade(col, -.15)}" stroke-width="2"/>`);
  return frame(bg, plate() + cube(190, 196, 70, col) + cube(272, 212, 28, col));
}

/* ---------- sweets ---------- */
function sweets2(kind, col) {
  let s = plate();
  if (kind === 'balls') [[150, 196], [200, 186], [250, 196], [176, 214], [226, 214]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="24" fill="${col}" stroke="${shade(col, -.25)}" stroke-width="1.5"/>` +
    Array.from({ length: 14 }, () => `<circle cx="${f(x + rand(-16, 16))}" cy="${f(y + rand(-16, 16))}" r="2" fill="${shade(col, -.2)}"/>`).join('') + `<circle cx="${x - 8}" cy="${y - 9}" r="5" fill="#fff" opacity=".35"/>`);
  if (kind === 'barfi') [[150, 192], [208, 186], [262, 196], [178, 222], [236, 224]].forEach(([x, y]) => s += cube(x, y, 40, col, { nuts: true }));
  if (kind === 'layered') [[150, 192], [208, 186], [262, 196], [178, 222], [236, 224]].forEach(([x, y]) => s += cube(x, y, 40, col) + `<rect x="${x - 20}" y="${y - 20}" width="40" height="14" fill="#F4EEDC"/>`);
  if (kind === 'disc') [[150, 196], [205, 186], [258, 196], [178, 216], [232, 216]].forEach(([x, y]) => s += `<ellipse cx="${x}" cy="${y}" rx="26" ry="16" fill="${col}" stroke="${shade(col, -.25)}" stroke-width="1.5"/><ellipse cx="${x}" cy="${y - 2}" rx="9" ry="5" fill="${shade(col, -.15)}"/><circle cx="${x}" cy="${y - 3}" r="2.5" fill="#7DAA3C"/>`);
  if (kind === 'spiral') [[160, 196], [240, 196], [200, 214]].forEach(([x, y]) => s += `<path d="M${x} ${y} m-6 0 a6 4 0 1 1 12 0 a12 8 0 1 1 -24 0 a18 12 0 1 1 36 0 a24 16 0 1 1 -48 0" stroke="${shade(col, -.25)}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${x} ${y} m-6 0 a6 4 0 1 1 12 0 a12 8 0 1 1 -24 0 a18 12 0 1 1 36 0 a24 16 0 1 1 -48 0" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
  return frame(col, zoom(s));
}
const syrupBowl = (bg, syrup, ballCol, flat) => curryBowl(bg, syrup, '#EFE8DC',
  [[160, 158], [204, 150], [244, 162], [196, 176]].map(([x, y]) => flat
    ? `<ellipse cx="${x}" cy="${y}" rx="24" ry="14" fill="${ballCol}" stroke="${shade(ballCol, -.15)}"/>`
    : `<circle cx="${x}" cy="${y}" r="22" fill="${ballCol}" stroke="${shade(ballCol, -.15)}"/><circle cx="${x - 7}" cy="${y - 8}" r="6" fill="#fff" opacity=".5"/>`).join('') +
  Array.from({ length: 10 }, () => piece('tea', rand(140, 260), rand(140, 180), '#7DAA3C')).join(''));

/* ---------- puja & household ---------- */
function cones() {
  let s = `<ellipse cx="200" cy="236" rx="120" ry="20" fill="#C99A2E"/>`;
  [[150, 220], [200, 212], [250, 222]].forEach(([x, y]) => s += `<polygon points="${x - 18},${y} ${x + 18},${y} ${x},${y - 44}" fill="#6B3B2A"/><circle cx="${x}" cy="${y - 44}" r="4" fill="#FF7A1A"/><path d="M${x} ${y - 50} c-12 -14 12 -22 0 -36 c-10 -12 8 -20 2 -32" stroke="#8F969E" stroke-width="3" fill="none" opacity=".55"/>`);
  return frame('#8A5A3A', s);
}
function bell() {
  return frame('#C99A2E', `<rect x="192" y="40" width="16" height="70" rx="6" fill="#B8862E"/><circle cx="200" cy="40" r="14" fill="#C99A2E" stroke="#8E6420" stroke-width="2"/>` +
    `<path d="M200 106 C150 106 140 160 132 216 L268 216 C260 160 250 106 200 106 Z" fill="#D9AE3E" stroke="#8E6420" stroke-width="3"/><rect x="122" y="214" width="156" height="16" rx="8" fill="#B8862E"/>` +
    `<circle cx="200" cy="240" r="10" fill="#8E6420"/><path d="M170 130 C160 160 156 190 154 210" stroke="#fff" stroke-width="7" opacity=".35" fill="none" stroke-linecap="round"/>`);
}
function pujaThali() {
  let s = `<ellipse cx="200" cy="196" rx="150" ry="58" fill="#D9AE3E" stroke="#8E6420" stroke-width="3"/><ellipse cx="200" cy="192" rx="124" ry="44" fill="#E6C25A"/>`;
  s += `<ellipse cx="140" cy="190" rx="22" ry="10" fill="#C8102E"/><ellipse cx="190" cy="206" rx="20" ry="9" fill="#E8A317"/><ellipse cx="250" cy="208" rx="24" ry="9" fill="#F7F1E3"/>`;
  [[110, 206], [124, 222], [270, 178], [286, 194]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="11" fill="#F2A516"/><circle cx="${x}" cy="${y}" r="5" fill="#E8742A"/>`);
  s += G('translate(214 178) scale(.6)', `<circle cx="56" cy="-42" r="28" fill="#FFD36B" opacity=".4"/><path d="M-50 -6 C-46 24 44 24 50 -6 C30 -14 -30 -14 -50 -6 Z" fill="#C99A2E" stroke="#8E6420" stroke-width="2"/><path d="M57 -66 C68 -48 66 -30 57 -24 C48 -30 46 -48 57 -66 Z" fill="#FFA41B"/>`);
  return frame('#C99A2E', s);
}
function pot(col, kalash) {
  return frame(col, `<path d="M160 108 L240 108 L232 128 C290 150 296 230 236 252 L164 252 C104 230 110 150 168 128 Z" fill="${col}" stroke="${shade(col, -.35)}" stroke-width="3"/>` +
    `<ellipse cx="200" cy="108" rx="44" ry="10" fill="${shade(col, .2)}" stroke="${shade(col, -.35)}" stroke-width="2"/><path d="M146 160 C140 190 146 220 160 236" stroke="#fff" stroke-width="8" opacity=".35" fill="none" stroke-linecap="round"/>` +
    `<path d="M140 186 H260" stroke="${shade(col, -.25)}" stroke-width="3"/>` +
    (kalash ? [-50, -25, 0, 25, 50].map(a => `<path d="M200 104 Q${200 + a} 70 ${200 + a * 1.5} 60" stroke="#3F8F3A" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('') +
      `<ellipse cx="200" cy="84" rx="26" ry="30" fill="#8A5A2E"/><path d="M190 60 q10 -14 20 0" stroke="#5B3A1E" stroke-width="5" fill="none"/>` : ''));
}
function matchbox() {
  let s = '';
  [[150, 200, -8], [230, 190, 6], [190, 160, -2]].forEach(([x, y, r]) => s += G(`rotate(${r} ${x} ${y})`, `<rect x="${x - 50}" y="${y - 30}" width="100" height="60" rx="4" fill="#C8102E" stroke="#8E0A20" stroke-width="2"/><rect x="${x - 34}" y="${y - 18}" width="68" height="36" rx="3" fill="#F2C94C"/><circle cx="${x}" cy="${y}" r="9" fill="#E8742A"/><rect x="${x - 50}" y="${y + 22}" width="100" height="8" fill="#6B3B2A"/>`));
  return frame('#C8102E', s);
}
function garland() {
  let s = '';
  for (let t = 0; t <= 1.0001; t += 1 / 26) {
    const x = 70 + t * 260, y = 90 + Math.sin(t * Math.PI) * 140;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="13" fill="${Math.round(t * 26) % 3 ? '#F2A516' : '#E8622A'}"/><circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${shade('#E8622A', -.1)}"/>`;
  }
  return frame('#F2A516', s + `<path d="M200 230 v30" stroke="#3F8F3A" stroke-width="4"/><circle cx="200" cy="264" r="8" fill="#C8102E"/>`);
}
function framedPicture() {
  let s = `<rect x="122" y="54" width="156" height="196" rx="6" fill="#C99A2E" stroke="#8E6420" stroke-width="3"/><rect x="138" y="70" width="124" height="164" fill="#F6E7C1"/>`;
  for (let a = 0; a < 360; a += 20) s += `<line x1="200" y1="150" x2="${f(200 + 60 * Math.cos(a * Math.PI / 180))}" y2="${f(150 + 60 * Math.sin(a * Math.PI / 180))}" stroke="#F2C94C" stroke-width="3"/>`;
  s += `<circle cx="200" cy="150" r="26" fill="#F2A516"/>` + [-50, -25, 0, 25, 50].map(a => `<path d="M200 214 Q${200 + a} ${178} ${200 + a * .6} ${196}" fill="#E8749A" stroke="#C2185B" stroke-width="1.5"/>`).join('');
  return frame('#C99A2E', s);
}
function rangoli() {
  let s = '';
  [[140, 186, '#C8102E'], [200, 176, '#F2A516'], [260, 186, '#2E8B57'], [170, 222, '#7A3FA0'], [230, 222, '#1E6FB8']].forEach(([x, y, c]) => s += `<path d="M${x - 34} ${y + 14} C${x - 26} ${y - 22} ${x + 26} ${y - 22} ${x + 34} ${y + 14} Z" fill="${c}"/>` +
    Array.from({ length: 12 }, () => `<circle cx="${f(x + rand(-24, 24))}" cy="${f(y + rand(-6, 12))}" r="1.4" fill="${shade(c, .3)}"/>`).join(''));
  return frame('#E24C7A', s);
}
function scraper() {
  return frame('#8A5A3A', `<rect x="90" y="200" width="220" height="30" rx="6" fill="#C08A55" stroke="#8E5E30" stroke-width="2"/>` +
    `<path d="M250 200 L250 120 Q252 96 276 92" stroke="${STEEL_D}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="280" cy="90" r="18" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="2"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M${280 + 18 * Math.cos(i * .8)} ${90 + 18 * Math.sin(i * .8)} l${f(5 * Math.cos(i * .8))} ${f(5 * Math.sin(i * .8))}" stroke="${STEEL_D}" stroke-width="3"/>`).join('') +
    `<path d="M120 196 C130 150 200 140 220 190" fill="#8A5A2E"/><path d="M128 194 C138 160 196 154 212 192" fill="#F7F3E8"/>`);
}
function rollingPin() {
  return frame('#C08A55', `<ellipse cx="200" cy="214" rx="130" ry="40" fill="#D9B07A" stroke="#A8743E" stroke-width="3"/><ellipse cx="200" cy="206" rx="112" ry="30" fill="#E3BE88"/>` +
    G('rotate(-18 200 150)', `<rect x="90" y="138" width="220" height="30" rx="15" fill="#C08A55" stroke="#8E5E30" stroke-width="2"/><rect x="50" y="146" width="44" height="14" rx="7" fill="#8E5E30"/><rect x="306" y="146" width="44" height="14" rx="7" fill="#8E5E30"/><path d="M100 146 H300" stroke="#fff" stroke-width="4" opacity=".3"/>`));
}

/* ---------- new aisles: which drawing each product gets ---------- */
const BRAND_COL = { 'Tata Tea': '#B8202E', Tetley: '#1F4E9C', Lipton: '#C98A00', 'Brooke Bond': '#C8102E', 'Wagh Bakri': '#7A1F2B', 'PG Tips': '#2E7D32', 'Tea India': '#E07B1F',
  Nescafé: '#8E2C2C', Bru: '#5B2A1A', Britannia: '#C8102E', Parle: '#C98A00', Sunfeast: '#5B2A86', 'McVitie’s': '#B8202E', Oreo: '#1F4E9C' };
const ruled = (n, rules, dflt) => firstMatch(n, rules) || dflt;
function artForNew(p, n) {
  const shortLabel = n.replace(/\b(rice|flour|atta)\b/gi, '').trim() || n;
  switch (p.cat) {
    case 'fresh-veg': {
      if (/cherry tomato/.test(n)) return roundFruit('#E0342C', { r: 30, leaf: false });
      if (/tomato/.test(n)) return tomatoes();
      if (/shallot/.test(n)) return onions('#B5627A');
      if (/yellow onion/.test(n)) return onions('#C98A3E');
      if (/white onion/.test(n)) return onions('#E6DCC8');
      if (/onion/.test(n)) return onions();
      if (/sweet potato/.test(n)) return potatoes('#B5503A');
      if (/red potato/.test(n)) return potatoes('#B5623E');
      if (/yam/.test(n)) return potatoes('#7A5A4A');
      if (/potato/.test(n)) return potatoes();
      if (/ginger/.test(n)) return ginger();
      if (/garlic/.test(n)) return garlic();
      if (/jalape/.test(n)) return chilis('#2F7D32');
      if (/chili|serrano/.test(n)) return chilis('#3E8E2F');
      if (/bell pepper/.test(n)) return peppers(/red/.test(n) ? '#D9342B' : /yellow/.test(n) ? '#F2C230' : '#3E8E2F');
      if (/indian eggplant/.test(n)) return eggplants('#6B2A6E', true);
      if (/eggplant/.test(n)) return eggplants('#4B1E5A');
      if (/okra/.test(n)) return okra();
      if (/bitter/.test(n)) return gourds('#4E8F2E', true);
      return gourds('#9CBF5A', false);
    }
    case 'fresh-fruit': {
      if (/pineapple/.test(n)) return pineapple();
      if (/plantain/.test(n)) return bananas('#E8C23A');
      if (/banana/.test(n)) return bananas('#F4D035');
      if (/gala/.test(n)) return roundFruit('#D9342B', { blush: '#F2C230' });
      if (/apple/.test(n)) return roundFruit('#E0503A', { blush: '#F4D35E', dimple: true });
      if (/mandarin|clementine/.test(n)) return roundFruit('#F28C1E', { r: 38, dimple: true });
      if (/orange/.test(n)) return roundFruit('#F28C1E', { dimple: true });
      if (/lemon/.test(n)) return lemons();
      if (/lime/.test(n)) return lemons('#8DC63F');
      if (/green mango/.test(n)) return mangoes('#8DBF4A', '#7FAF3A');
      if (/mango/.test(n)) return mangoes();
      if (/guava/.test(n)) return roundFruit('#B9D36A', { dimple: true });
      if (/papaya/.test(n)) return papaya();
      if (/pomegranate/.test(n)) return roundFruit('#C0263A', { crown: true });
      if (/pineapple/.test(n)) return pineapple();
      if (/watermelon/.test(n)) return melon('#F0505A', '#3F8F3A', true);
      if (/cantaloupe/.test(n)) return melon('#F5A04A', '#C9B07A');
      if (/honeydew/.test(n)) return melon('#C9E08A', '#E3E8B8');
      if (/grapes/.test(n)) return grapes(/red/.test(n) ? '#8E2A5A' : '#9CC74A');
      if (/pear/.test(n)) return pears('#B9C94A');
      if (/peach/.test(n)) return roundFruit('#F5A65A', { blush: '#E8503A', crease: true });
      if (/nectarine/.test(n)) return roundFruit('#E8622A', { blush: '#F4C04A', crease: true });
      return roundFruit('#6B2A5A', { crease: true, r: 38 });
    }
    case 'rice-grains': {
      if (/basmati|sona|ponni|idli|jasmine|matta|brown rice/.test(n)) {
        const [fill, col] = ruled(n, [[/brown basmati/, '#C9A577', '#8A5A2E'], [/brown rice/, '#B8895A', '#6B4A2A'], [/matta/, '#B5603A', '#8E2C2C'],
          [/basmati/, '#FBF7EE', '#1F6B4A'], [/sona/, '#F7F2E6', '#B3261E'], [/ponni/, '#F7F2E6', '#1E6FB8'], [/idli/, '#F4EEDC', '#7A3FA0'], [/jasmine/, '#FBF7EE', '#2E8B57']], ['#F7F2E6', '#1F6B4A']);
        return sack(fill, p.name.replace(/ Rice$/, '').toUpperCase(), col, 'grain');
      }
      const [kind, col] = ruled(n, [[/broken/, 'round', '#F4EEDC'], [/poha/, 'tea', '#EADBB0'], [/murmura/, 'oval', '#F8F1DE'], [/rava|semolina|sooji/, 'dust', '#EBD9A6'],
        [/wheat grain/, 'oval', '#C9955A'], [/barley/, 'lentil', '#E3CF9F'], [/bulgur/, 'round', '#C9A060'], [/rolled/, 'lentil', '#E3D2A6'], [/steel/, 'round', '#CDB27A'],
        [/foxtail/, 'round', '#E8C66A'], [/little/, 'round', '#E6D29A'], [/barnyard/, 'round', '#D9C79A']], ['round', '#E6D29A']);
      return kind === 'dust' ? powderBowl(col, { bowl: 'steel', bg: '#C9A26A' }) : seedBowl(col, kind, { bowl: hashPick(p.id, ['wood', 'steel', 'clay', 'white']), bg: '#B8955A' });
    }
    case 'flour': {
      if (/batter/.test(n)) return tub(/dosa/.test(n) ? '#2E8B57' : '#E07B1F', shortLabel.replace(/ batter/, ' Batter'));
      if (/mix/.test(n)) return packet(hashPick(p.id, MEAL_BAGS), p.name, 'dust', '#F1E6C8');
      if (/whole wheat|chakki|multigrain/.test(n)) return sack('#E9D9B4', p.name.replace(/ Atta/, '').toUpperCase() + ' ATTA', /multigrain/.test(n) ? '#2E8B57' : '#8A5A00', 'powder');
      const [col] = ruled(n, [[/maida/, '#FAF7F0'], [/besan/, '#EBC65A'], [/rice/, '#F7F4EE'], [/ragi/, '#9C6A4E'], [/jowar/, '#E6DCC4'], [/bajra/, '#A89A80'], [/makki/, '#F2C94C'],
        [/tapioca|potato|cornstarch|arrowroot/, '#FBFAF6'], [/singhare/, '#EADBB8'], [/rajgira/, '#E3D2A6'], [/buckwheat/, '#8C7A5E'], [/idli rava/, '#F1E6C8']], ['#EADBB8']);
      return powderBowl(col, { bowl: hashPick(p.id, ['wood', 'steel', 'clay']), bg: '#C9A26A' });
    }
    case 'lentils': {
      const [kind, col] = ruled(n, [[/toor/, 'lentil', '#E3A93A'], [/masoor dal red/, 'lentil', '#E8743B'], [/masoor/, 'lentil', '#8A5A3A'], [/moong dal yellow/, 'lentil', '#E6CB4A'],
        [/moong/, 'round', '#5E8F3A'], [/urad dal split/, 'lentil', '#F2EDE0'], [/urad/, 'oval', '#2A2522'], [/roasted chana/, 'lentil', '#E8C27A'], [/chana dal/, 'lentil', '#E8B54A'],
        [/kabuli/, 'chickpea', '#E2BE7E'], [/kala/, 'chickpea', '#6B3E2A'], [/lobia/, 'lentil', '#EFE6D2'], [/rajma chitra/, 'pod', '#C9A07A'], [/rajma/, 'pod', '#8E2A2A'],
        [/white kidney/, 'pod', '#F2EDE0'], [/moth/, 'round', '#A8784A'], [/green vatana/, 'pea', '#7FA650'], [/vatana/, 'pea', '#E6DCC4'], [/horse/, 'lentil', '#8A6A4A'],
        [/peanuts/, 'lentil', '#D9A066'], [/soya chunks/, 'ball', '#D9B57A'], [/soya/, 'round', '#D9B57A'], [/field|lima/, 'pod', '#E3DCB8']], ['lentil', '#C9A07A']);
      return seedBowl(col, kind, { bowl: hashPick(p.id, ['wood', 'steel', 'clay', 'brass', 'white']), bg: col === '#2A2522' || col === '#F2EDE0' || col === '#EFE6D2' ? '#B8955A' : undefined });
    }
    case 'tea-coffee': {
      if (/rose syrup/.test(n)) return juiceBottle('#D0345C', 'Rose Syrup');
      if (/mango juice/.test(n)) return juiceBottle('#F2A516', 'Mango Juice');
      if (/instant coffee/.test(n)) return jar('#5B3A22', BRAND_COL[p.brand] || '#5B2A1A', 'Coffee');
      if (/filter coffee/.test(n)) return packet('#5B2A1A', p.name, 'dust', '#4A2E1A');
      return packet(BRAND_COL[p.brand] || hashPick(p.id, MEAL_BAGS), p.name, 'tea', /green/.test(n) ? '#5E8F3A' : '#3A2418');
    }
    case 'dairy': {
      if (/whole milk/.test(n)) return carton('#1F6FB8', 'Whole Milk');
      if (/2 percent/.test(n)) return carton('#2E8B57', '2% Milk');
      if (/buttermilk/.test(n)) return carton('#7FA650', 'Buttermilk');
      if (/coconut milk/.test(n)) return carton('#8A6A4A', 'Coconut Milk');
      if (/yogurt|cream/.test(n)) return tub(ruled(n, [[/mango/, '#F2A516'], [/greek/, '#1F4E9C'], [/low fat/, '#3BA0C9'], [/sour/, '#7FA650'], [/fresh cream/, '#C99A2E']], ['#2D6CB5'])[0],
        ruled(n, [[/mango/, 'Mango'], [/greek/, 'Greek'], [/low fat/, 'Low Fat'], [/sour/, 'Sour Cream'], [/fresh cream/, 'Cream']], ['Dahi'])[0]);
      if (/malai/.test(n)) return packet('#2D6CB5', 'Malai Paneer', 'cube', '#F7F3E8');
      if (/paneer/.test(n)) return paneerBoard();
      if (/ghee/.test(n)) return jar('#F3C64B', '#C8102E', 'Ghee');
      if (/butter/.test(n)) return butterBlock();
      if (/eggs/.test(n)) return eggsBox(/brown/.test(n) ? '#C98A5A' : '#F7F3EA');
      if (/cheese slices/.test(n)) return cheeseSlices();
      if (/mozzarella/.test(n)) return whiteBlock('#FBF8F0', '#D9C9A6', true);
      if (/khoya/.test(n)) return whiteBlock('#EFE0BC', '#D9B57A');
      return whiteBlock('#F7F4EC', '#C9C2B0');
    }
    case 'sweets': {
      if (/gulab/.test(n)) return recipeArt('gj');
      if (/rasgulla/.test(n)) return syrupBowl('#C9B48A', '#F4ECD6', '#FBF8F0');
      if (/rasmalai/.test(n)) return syrupBowl('#E8C27A', '#F2D98A', '#FBF5E6', true);
      if (/kaju/.test(n)) return sweetsPlate('katli');
      if (/soan/.test(n)) return sweetsPlate('soan');
      if (/halwa/.test(n)) return curryBowl('#E8622A', /gajar/.test(n) ? '#E8622A' : '#D99A3A', '#EFE8DC',
        Array.from({ length: 30 }, () => piece('cube', rand(120, 280), rand(140, 186), pick(['#D9A35B', '#7DAA3C', '#F2EAD6']), rand(0, 90))).join(''));
      if (/jalebi|imarti/.test(n)) return sweets2('spiral', /imarti/.test(n) ? '#E8502A' : '#F08A2C');
      if (/ladoo/.test(n)) return sweets2('balls', ruled(n, [[/besan/, '#E8B54A'], [/motichoor/, '#F08A2C']], ['#F2A516'])[0]);
      if (/peda|sandesh/.test(n)) return sweets2('disc', ruled(n, [[/kesar/, '#F2B43A'], [/milk peda/, '#F1E3C0'], [/sandesh/, '#F7F1E3']], ['#E8C98A'])[0]);
      if (/chocolate/.test(n)) return sweets2('layered', '#5B3A22');
      return sweets2('barfi', ruled(n, [[/milk cake/, '#D9B57A'], [/kalakand/, '#F4EEDC'], [/coconut/, '#F7F3E8'], [/pista/, '#B9D36A'], [/anjeer/, '#8A5A3A'], [/mysore/, '#F2C94C']], ['#D9A35B'])[0]);
    }
    case 'biscuits': {
      const dark = /bourbon|oreo|dark fantasy|hide/.test(n);
      return packet(BRAND_COL[p.brand] || hashPick(p.id, SNACK_BAGS), p.name.replace(/ (Biscuits|Cookies)$/, ''), /rusk/.test(n) ? 'cube' : 'biscuit', dark ? '#4A2E1E' : '#D9A35B');
    }
    case 'oils-pickles': {
      if (/oil/.test(n)) return juiceBottle(ruled(n, [[/mustard/, '#D9A520'], [/sesame/, '#B87A2E'], [/coconut/, '#D9D2B4'], [/groundnut/, '#E8B04A'], [/olive/, '#8DA23A'], [/canola/, '#E9CF5E']], ['#F2C94C'])[0], p.name);
      if (/tamarind whole/.test(n)) return seedBowl('#6B3A1E', 'pod', { bowl: 'clay' });
      if (/tamarind/.test(n)) return jar('#5B2A1A', '#8A5A2B', 'Tamarind');
      if (/chutney/.test(n)) return jar(ruled(n, [[/mint/, '#3F8F3A'], [/coriander/, '#4E9A3E']], ['#5B2A1A'])[0], '#C8102E', 'Chutney');
      const [col, chunks] = ruled(n, [[/mango/, '#C2401C', ['#E9B44C', '#D46A2A']], [/lime/, '#C99A2E', ['#E8D04A', '#B8862E']], [/mixed/, '#B8501E', ['#F08A2C', '#7FA650', '#F2EAD6']],
        [/green chili/, '#5E8F3A', ['#3E8E2F', '#8DB04A']], [/garlic/, '#A8641E', ['#F4EEE2', '#E3D2A6']], [/gongura/, '#4E5A2A', ['#3F5A2A', '#6B7A3A']], [/tomato/, '#C2301C', ['#E0342C', '#A8211B']],
        [/amla/, '#9C8A2E', ['#C9D36A', '#B9A23A']]], ['#C2401C', null]);
      return jar(col, '#2E7A34', 'Pickle', { chunks: chunks || true });
    }
    case 'puja': {
      if (/incense sticks|agarbatti holder|incense holder/.test(n)) return incense(ruled(n, [[/sandalwood/, '#A8743E'], [/rose/, '#C2185B'], [/jasmine/, '#7A6FB0'], [/brass/, '#C99A2E']], ['#8A5A3A'])[0]);
      if (/dhoop/.test(n)) return cones();
      if (/camphor/.test(n)) return seedBowl('#FBFAF6', 'cube', { bowl: 'brass', bg: '#C9A23A' });
      if (/wicks/.test(n)) return seedBowl('#FBFAF6', 'stick', { bowl: 'brass', bg: '#C9A23A' });
      if (/diya brass/.test(n)) return diyas('#C99A2E');
      if (/diya/.test(n)) return diyas();
      if (/bell/.test(n)) return bell();
      if (/thali/.test(n)) return pujaThali();
      if (/kumkum/.test(n)) return powderBowl('#C8102E', { bowl: 'brass' });
      if (/turmeric/.test(n)) return powderBowl('#E8A317', { bowl: 'brass' });
      if (/sandalwood/.test(n)) return powderBowl('#D9B48A', { bowl: 'brass' });
      if (/kalash/.test(n)) return pot('#C99A2E', true);
      if (/lota/.test(n)) return pot('#B8693A');
      if (/match/.test(n)) return matchbox();
      if (/rangoli/.test(n)) return rangoli();
      if (/garland/.test(n)) return garland();
      if (/picture/.test(n)) return framedPicture();
      if (/scraper/.test(n)) return scraper();
      return rollingPin();
    }
    case 'dry-fruits': {
      if (/desiccated/.test(n)) return powderBowl('#FBF8F0', { bowl: 'clay', bg: '#C9A26A' });
      const [kind, col] = ruled(n, [[/almond/, 'almond', '#B5703A'], [/cashew/, 'cashew', '#EAD3A2'], [/pistachio/, 'pistachio', '#D9C08A'], [/walnut/, 'walnut', '#B8865B'],
        [/golden/, 'lentil', '#C99A2E'], [/raisins/, 'lentil', '#3A2418'], [/medjool/, 'date', '#5B2E1A'], [/dates/, 'date', '#8A4A1E'], [/figs/, 'ball', '#8A5A3A'],
        [/apricots/, 'disc', '#F2A03A'], [/coconut slices/, 'chip', '#F7F3E8'], [/roasted makhana/, 'makhana', '#E8C98A'], [/makhana/, 'makhana', '#F7F1E3'],
        [/pumpkin/, 'oval', '#6E9A3A'], [/sunflower/, 'oval', '#8A8A80'], [/flax/, 'oval', '#8A5A3A'], [/chia/, 'round', '#3A3A38'], [/sesame seeds white/, 'oval', '#F2EAD6'],
        [/sesame/, 'oval', '#2A2522'], [/watermelon/, 'oval', '#EFE3C4']], ['round', '#C9A07A']);
      return seedBowl(col, kind, { bowl: hashPick(p.id, ['wood', 'brass', 'white', 'clay']), bg: '#B8955A' });
    }
  }
  return null;
}

/* ---------- which drawing each product gets ---------- */
const { INVENTORY_ITEMS } = require('../data/inventory.js');
const hashPick = (str, arr) => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return arr[h % arr.length]; };
const firstMatch = (n, rules) => { for (const [re, ...v] of rules) if (re.test(n)) return v; return null; };
const SNACK_BAGS = ['#D9442E', '#7A3FA0', '#E07B1F', '#2F8F4E', '#C0392B', '#2D6CB5', '#8E2C48', '#B8860B', '#1F7A6B', '#C2185B'];
const FROZEN_BAGS = ['#1E6FB8', '#2E8B57', '#0F7C8C', '#3B5BA9', '#2A9D5C', '#1B5E8C'];
const MEAL_BAGS = ['#C0392B', '#E07B1F', '#8E2C48', '#2D6CB5', '#B8860B', '#7A3FA0'];

function artFor(p) {
  const n = p.name.toLowerCase();
  const fresh = artForNew(p, n);
  if (fresh) return fresh;
  if (p.cat === 'snacks') {
    const [kind, col] = firstMatch(n, [
      [/banana/, 'chip', /masala/.test(n) ? '#E8A93A' : '#F2C94C'], [/potato chips/, 'chip', '#E8B04A'], [/jackfruit/, 'chip', '#E9B949'],
      [/bittergourd/, 'chip', '#7A9B3A'], [/soya|thattai/, 'disc', '#D9A35B'], [/tapioca/, 'stick', '#E8C27A'],
      [/ragi/, 'spiral', '#8A5A3C'], [/palak/, 'spiral', '#6E8F3A'], [/rice murukku/, 'spiral', '#E6D3A3'], [/butter/, 'spiral', '#E8C27A'],
      [/spicy chakli/, 'spiral', '#C9662E'], [/murukku|chakli/, 'spiral', '#C98F3E'], [/ribbon/, 'stick', '#D9A35B'],
      [/mixture|bhel/, 'mix', ''], [/bhujia|sev/, 'stick', '#E0A03A'], [/boondi/, 'round', '#E07B1F'],
      [/chikki/, 'cube', '#C98A3E'], [/peanut/, 'lentil', '#B5652A'], [/chana/, 'chickpea', '#D9A35B'],
      [/biscuit/, 'biscuit', '#D9A35B'], [/kachori/, 'ball', '#D9A441'], [/sweet para/, 'cube', '#E8C27A'], [/para/, 'cube', '#D9B070'],
    ]) || ['mix', ''];
    return packet(hashPick(p.id, SNACK_BAGS), p.name, kind, col);
  }
  if (p.cat === 'frozen-veg') {
    if (/mango pulp/.test(n)) return can('#F2A516', 'ALPHONSO');
    const [kind, col] = firstMatch(n, [
      [/palak|sarson|greens/, 'leaf', '#2F7D3B'], [/papdi|guvar/, 'pod', '#6BA539'], [/mogri/, 'stick', '#7DAA3C'],
      [/tindora|parwal/, 'pod', '#4E8F2E'], [/bhindi/, 'pod', '#5E9B3A'], [/drumstick/, 'stick', '#5E8F3A'], [/chilli/, 'stick', '#3E8E2F'],
      [/avial|mixed/, 'vegmix', ''], [/lilva|peas|cholya/, 'pea', '#7CC242'], [/corn/, 'round', '#F2C230'], [/sponge/, 'cube', '#9CBF5A'],
      [/ratalu/, 'cube', '#7B4A8C'], [/aloo/, 'ball', '#D9B070'], [/chhole/, 'chickpea', '#8A5A2B'], [/garlic/, 'cube', '#F4EEE2'],
      [/amla/, 'ball', '#B9D36A'], [/jamun/, 'ball', '#4B2A5A'],
    ]) || ['vegmix', ''];
    return packet(hashPick(p.id, FROZEN_BAGS), p.name, kind, col);
  }
  if (p.cat === 'frozen-snacks') {
    const [kind, col] = firstMatch(n, [
      [/samosa/, 'samosa', '#D9A441'], [/roll|wrap/, 'roll', '#E2BC78'], [/puff pastry/, 'cube', '#E8C27A'], [/tikki/, 'disc', '#D9A441'],
      [/cutlet/, 'disc', '#B87A3A'], [/kachori/, 'ball', '#D9A441'], [/cheese/, 'ball', '#F2C94C'], [/manchurian/, 'ball', '#8A4A1E'],
      [/vada/, 'ball', '#E0A03A'], [/dhokla/, 'cube', '#F2D46B'], [/fingers/, 'stick', '#F2D6A0'], [/pakora spinach/, 'ball', '#7A8F3A'],
      [/pakora/, 'ball', '#C98F3E'], [/patra/, 'spiral', '#6E7A2E'], [/gota/, 'ball', '#A88A3E'], [/paratha/, 'disc', '#E2BC78'],
    ]) || ['ball', '#D9A441'];
    return packet(hashPick(p.id, MEAL_BAGS), p.name, kind, col);
  }
  if (p.cat === 'spices') {
    const bowl = { laxmi: 'wood', deep: 'steel', suhana: 'clay' }[p.brand.toLowerCase()] || 'white';
    if (/ mix$/.test(n)) return packet(hashPick(p.id, MEAL_BAGS), p.name.replace(/ mix$/i, ''), 'dust',
      /dal makhani|mutton|egg/.test(n) ? '#7A2E1E' : /kofta|paneer|no onion/.test(n) ? '#D98A3A' : '#B5652A');
    const seed = firstMatch(n, [[/cumin/, 'oval', '#8C6A3C'], [/coriander seeds/, 'round', '#B8955A'], [/fenugreek/, 'round', '#D9A93A'],
      [/mustard/, 'round', '#3B2A22'], [/fennel/, 'oval', '#8DA45A'], [/ajwain/, 'oval', '#9C8A5E'], [/pepper/, 'round', '#2A221C'], [/flakes/, 'tea', '#B22A1E']]);
    if (seed) return seedBowl(seed[1], seed[0], { bowl, bg: seed[1] === '#2A221C' || seed[1] === '#3B2A22' ? '#8C6A3C' : undefined });
    const [col] = firstMatch(n, [[/turmeric/, '#E8A317'], [/kashmiri/, '#C9341F'], [/byadgi/, '#B22A1E'], [/red chilli/, '#C62E22'], [/paprika/, '#D9502A'],
      [/coriander/, '#A98A55'], [/garam/, '#7A4A26'], [/sambar/, '#A8572A'], [/tandoori/, '#C2401C']]) || ['#A8572A'];
    return powderBowl(col, { bowl, whole: /masala/.test(n) });
  }
  if (p.cat === 'pantry') {
    if (/milk powder/.test(n)) return jar('#F7F3E8', '#C8102E', 'Milk Powder', { bg: '#C8102E' });
    if (/malt|nutrition/.test(n)) return jar('#8A5A35', { Horlicks: '#1F6FB8', Boost: '#E07B1F', Bournvita: '#5B2A86', Complan: '#2E8B57' }[p.brand] || '#1F6FB8',
      /nutrition/.test(n) ? 'Nutrition' : 'Malt Drink');
    if (/sugar/.test(n)) return seedBowl('#F1ECE0', 'crystal', { bowl: 'steel', bg: '#9AA7B4' });
    if (/sabudana/.test(n)) return seedBowl('#F4F1EA', 'round', { bowl: 'clay', bg: '#C9B48A' });
    if (/quinoa/.test(n)) return seedBowl('#E9DCB8', 'round', { bowl: 'white', bg: '#B8955A' });
    if (/chia/.test(n)) return seedBowl('#4A4A48', 'round', { bowl: 'white', bg: '#8C8A84' });
    const [col] = firstMatch(n, [[/ragi/, '#9C6A4E'], [/singoda/, '#EADBB8'], [/rice/, '#F4F1EA'], [/sattu/, '#D9BE8A'], [/coconut/, '#F7F3E8']]) || ['#EADBB8'];
    return powderBowl(col, { bowl: 'steel', bg: '#C9B48A' });
  }
  if (p.cat === 'herbal') {
    if (/neem/.test(n)) return powderBowl('#7A8F3A', { bowl: 'clay' });
    if (/amla powder/.test(n)) return powderBowl('#B5A24A', { bowl: 'wood' });
    if (/ashwagandha/.test(n)) return powderBowl('#C9B48A', { bowl: 'wood', bg: '#8C6A3C' });
    if (/chatpata/.test(n)) return jar('#B9862E', '#C2401C', 'Chatpata', { chunks: ['#8A5A1E', '#C9A23A', '#6E4A1E'] });
    if (/amla candy/.test(n)) return jar('#C9B04A', '#2E7A34', 'Amla Candy', { chunks: ['#E2C95A', '#B9A23A', '#F0DC7A'] });
    if (/ginger candy/.test(n)) return jar('#E8C27A', '#B8860B', 'Ginger Candy', { chunks: ['#D9A441', '#F2D27A', '#C98F3E'] });
    if (/jamun juice/.test(n)) return juiceBottle('#4B2A5A', 'Jamun Juice');
    if (/amla juice/.test(n)) return juiceBottle('#8DA83A', 'Amla Juice');
    if (/paan/.test(n)) return seedBowl('#C2185B', 'confetti', { bowl: 'brass', bg: '#7FBF4A' });
    if (/rose/.test(n)) return incense('#C2185B');
    if (/mogra/.test(n)) return incense('#7A6FB0');
    if (/sandalwood/.test(n)) return incense('#A8743E');
    return diyas();
  }
  return utensil(n);
}

const ART = Object.fromEntries(INVENTORY_ITEMS.map(p => [p.id, () => artFor(p)]));
for (const r of ['sarson', 'sambar', 'avial', 'undhiyu', 'biryani', 'dalmakhani', 'bhindi', 'lassi']) ART['r-' + r] = () => dish(r);
ART['hero-thali'] = () => heroThali();

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg')) fs.unlinkSync(path.join(OUT, f));
for (const [id, draw] of Object.entries(ART)) {
  seed(id);
  fs.writeFileSync(path.join(OUT, id + '.svg'), draw());
}
console.log(`Wrote ${Object.keys(ART).length} illustrations to ${OUT}`);
