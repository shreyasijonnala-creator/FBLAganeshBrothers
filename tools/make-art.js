#!/usr/bin/env node
// Draws the flat illustrations in images/ (one SVG per product and recipe).
// Run from anywhere:  node tools/make-art.js
// To change a picture, edit its line in ART at the bottom and re-run.
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
  const n = { chickpea: 75, pod: 70, leaf: 90, lentil: 190, grain: 220 }[kind] || 260;
  const pts = domePts(n).map(([x, y]) => piece(kind, x, y, R() < .25 ? shade(col, .12) : col)).join('');
  return frame(o.bg || col, bowlBack(bc) +
    `<clipPath id="${id}"><path d="${DOME}"/></clipPath><path d="${DOME}" fill="${shade(col, -0.25)}"/>` +
    `<g clip-path="url(#${id})">${pts}</g>` + bowlFront(bc) + (o.whole ? wholeSpices() : tableScatter(kind, col)));
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
function packet(col, label, kind, fillCol) {
  const id = UID + 'w', fs = Math.min(22, 230 / label.length);
  const zig = y => `<path d="M118 ${y} ${Array.from({ length: 21 }, (_, i) => `L${118 + i * 8.2} ${y + (i % 2 ? 6 : 0)}`).join(' ')}" stroke="${shade(col, -0.35)}" stroke-width="1.5" fill="none"/>`;
  const n = { biscuit: 26, chip: 40, spiral: 30, ball: 30, cube: 45, pea: 120 }[kind] || 140;
  return frame(col,
    `<path d="M118 66 L282 66 L292 252 L108 252 Z" fill="${col}"/>` +
    `<rect x="114" y="56" width="172" height="20" rx="3" fill="${shade(col, -0.22)}"/>${zig(70)}` +
    `<rect x="104" y="244" width="192" height="18" rx="3" fill="${shade(col, -0.22)}"/>` +
    `<path d="M128 78 L140 78 L132 240 L120 240 Z" fill="#fff" opacity=".18"/>` +
    `<path d="M118 126 Q200 112 286 126 L287 140 Q200 126 117 140 Z" fill="${shade(col, 0.3)}" opacity=".7"/>` +
    `<text x="200" y="${108}" font-size="${f(fs)}" fill="#fff" ${FONT}>${label}</text>` +
    `<clipPath id="${id}"><ellipse cx="200" cy="186" rx="64" ry="46"/></clipPath>` +
    `<ellipse cx="200" cy="186" rx="64" ry="46" fill="#FFF6E6"/>` +
    `<g clip-path="url(#${id})">${ellPts(n, 200, 186, 70, 52).map(([x, y]) => piece(kind, x, y, kind === 'mix' ? '' : (R() < .3 ? shade(fillCol, .12) : fillCol))).join('')}</g>` +
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
    `<rect x="${f(rand(140, 250))}" y="${f(rand(104, 244))}" width="${f(rand(10, 20))}" height="${f(rand(8, 14))}" rx="4" fill="${pick(['#E9B44C', '#D46A2A', '#A8321C', '#F0C766'])}" transform="rotate(${f(rand(0, 90))} 200 180)" opacity=".9"/>`).join('') : '';
  const inner = `<clipPath id="${id}"><rect x="138" y="98" width="124" height="156" rx="24"/></clipPath>` +
    `<rect x="138" y="98" width="124" height="156" rx="24" fill="${contentCol}"/>` +
    `<g clip-path="url(#${id})">${chunks}<rect x="138" y="98" width="124" height="14" fill="${shade(contentCol, .3)}" opacity=".6"/></g>` +
    `<rect x="138" y="98" width="124" height="156" rx="24" fill="none" stroke="${shade(contentCol, -0.3)}" stroke-width="3"/>` +
    `<rect x="152" y="114" width="11" height="124" rx="5.5" fill="#fff" opacity=".35"/>` +
    `<rect x="146" y="72" width="108" height="32" rx="6" fill="${lidCol}"/>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M${154 + i * 8} 76 V100" stroke="${shade(lidCol, -.25)}" stroke-width="2"/>`).join('') +
    `<rect x="152" y="150" width="96" height="56" rx="7" fill="#FFF8EC" stroke="${lidCol}" stroke-width="2"/>` +
    `<text x="200" y="${185}" font-size="${Math.min(22, 200 / label.length)}" fill="${lidCol}" ${FONT}>${label}</text>`;
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
function onions() {
  const c = '#8E2A5A';
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
function potatoes() {
  const c = '#C8955A';
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
function lemons() {
  const c = '#F5CF2E';
  const l = (x, y, s, r) => G(`translate(${x} ${y}) rotate(${r}) scale(${s})`,
    `<path d="M-64 0 C-56 -42 56 -42 64 0 C56 42 -56 42 -64 0 Z" fill="${c}" stroke="#CFA80F" stroke-width="2.5"/><circle cx="-66" cy="0" r="5" fill="${c}" stroke="#CFA80F" stroke-width="2"/><circle cx="66" cy="0" r="5" fill="${c}" stroke="#CFA80F" stroke-width="2"/>` +
    `<path d="M-30 -22 Q0 -32 26 -24" stroke="#fff" stroke-width="5" opacity=".4" fill="none" stroke-linecap="round"/>`);
  const half = `<circle cx="282" cy="206" r="46" fill="#F2C912"/><circle cx="282" cy="206" r="40" fill="#FBE58B"/>` +
    Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M282 206 L${f(282 + 36 * Math.cos(a))} ${f(206 + 36 * Math.sin(a))}" stroke="#F2D24A" stroke-width="3"/>`; }).join('') +
    `<circle cx="282" cy="206" r="5" fill="#F2D24A"/>`;
  return frame(c, l(150, 170, 1, -12) + l(176, 222, .85, 8) + half);
}
function mangoes() { return frame('#F2B630', mangoShape(150, 186, 1, '#F4C13A') + mangoShape(262, 196, .9, '#F2B630')); }

/* ---------- household & pooja ---------- */
function diyas() {
  const d = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
    `<circle cx="56" cy="-42" r="28" fill="#FFD36B" opacity=".35"/>` +
    `<path d="M-50 -6 C-46 24 44 24 50 -6 C30 -14 -30 -14 -50 -6 Z" fill="#C2582B" stroke="#8E3A18" stroke-width="2"/>` +
    `<ellipse cx="0" cy="-7" rx="40" ry="7" fill="#7A3416"/><path d="M40 -10 L64 -18 L50 2 Z" fill="#C2582B" stroke="#8E3A18" stroke-width="2"/>` +
    [-30, -15, 0, 15, 30].map(x => `<circle cx="${x}" cy="6" r="3" fill="#F2C14E"/>`).join('') +
    `<path d="M57 -16 V-24" stroke="#3a2410" stroke-width="2.5"/>` +
    `<path d="M57 -66 C68 -48 66 -30 57 -24 C48 -30 46 -48 57 -66 Z" fill="#FFA41B"/><path d="M57 -52 C61 -44 60 -34 57 -32 C54 -34 53 -44 57 -52 Z" fill="#FFF3B0"/>`);
  return frame('#E07B1F', d(186, 168, 1) + d(116, 228, .95) + d(250, 232, .95));
}
function incense() {
  const stick = (x1, y1, x2, y2) => {
    const sx = f(x2 - (x2 - x1) * .78), sy = f(y2 - (y2 - y1) * .78);
    return `<line x1="${x1}" y1="${y1}" x2="${sx}" y2="${sy}" stroke="#D2A86A" stroke-width="3"/><line x1="${sx}" y1="${sy}" x2="${x2}" y2="${y2}" stroke="#6B3B2A" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="${x2}" cy="${y2}" r="4" fill="#FF7A1A"/><circle cx="${x2}" cy="${y2}" r="9" fill="#FF7A1A" opacity=".25"/>` +
      `<path d="M${x2} ${y2 - 6} c-14 -16 14 -26 0 -42 c-12 -14 10 -22 2 -36" stroke="#8F969E" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`;
  };
  return frame('#B23A5A',
    G('rotate(-6 200 236)', `<rect x="72" y="228" width="256" height="14" rx="7" fill="#8B5A2B"/><path d="M80 235 H320" stroke="#A8743E" stroke-width="2"/>`) +
    stick(112, 232, 200, 104) + stick(118, 232, 252, 116) + stick(108, 232, 158, 96) +
    G('rotate(4 260 268)', [0, 6, 12, 18, 24].map(o => `<line x1="200" y1="${262 + o / 3}" x2="330" y2="${262 + o / 3}" stroke="${o % 12 ? '#B23A5A' : '#8A2A45'}" stroke-width="3" stroke-linecap="round"/>`).join('')));
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

/* ---------- what each product looks like ---------- */
const ART = {
  turmeric: () => powderBowl('#E8A317'),
  chili: () => powderBowl('#C9341F', { bowl: 'steel' }),
  cumin: () => seedBowl('#8C6A3C', 'oval'),
  mustard: () => seedBowl('#3B2A22', 'round', { bowl: 'brass', bg: '#8C6A3C' }),
  garam: () => powderBowl('#7A4A26', { whole: true }),
  coriander: () => powderBowl('#A98A55', { bowl: 'clay' }),
  hing: () => jar('#F2D46B', '#D03A2C', 'HING', { small: true }),
  cardamom: () => seedBowl('#7FA650', 'pod', { bowl: 'brass' }),
  biryani: () => powderBowl('#B5562A', { whole: true, bowl: 'clay' }),
  biryani2: () => powderBowl('#9C3D1E', { whole: true, bowl: 'steel' }),
  chaimasala: () => powderBowl('#8A5A35', { whole: true, bowl: 'white' }),
  'curry-dry': () => seedBowl('#6F7A33', 'leaf', { bowl: 'clay' }),
  basmati: () => sack('#FBF7EE', 'BASMATI', '#1F6B4A', 'grain'),
  sona: () => sack('#FBF7EE', 'SONA MASOORI', '#B3261E', 'grain'),
  toor: () => seedBowl('#E3A93A', 'lentil', { bowl: 'steel' }),
  masoor: () => seedBowl('#E8743B', 'lentil', { bowl: 'white' }),
  moong: () => seedBowl('#D9C64A', 'lentil', { bowl: 'clay' }),
  chana: () => seedBowl('#E2BE7E', 'chickpea'),
  atta: () => sack('#F3E7CF', 'ATTA', '#8A5A00', 'powder'),
  besan: () => powderBowl('#EBC65A', { bowl: 'steel' }),
  cilantro: () => bunch('cilantro', '#3F8F3A'),
  'curry-fresh': () => bunch('curry', '#2E7A34'),
  methi: () => bunch('methi', '#4E9A3E'),
  okra: () => okra(),
  greenchili: () => chilis('#3E8E2F'),
  ginger: () => ginger(),
  garlic: () => garlic(),
  onion: () => onions(),
  tomato: () => tomatoes(),
  potato: () => potatoes(),
  cauli: () => cauliflower(),
  spinach: () => bunch('spinach', '#2F7D3B'),
  mango: () => mangoes(),
  lemon: () => lemons(),
  paneer: () => paneerBoard(),
  paneer2: () => packet('#2D6CB5', 'MALAI PANEER', 'cube', '#F7F3E8'),
  parotta: () => sweetsPlate('parotta'),
  naan: () => sweetsPlate('naan'),
  samosa: () => sweetsPlate('samosa'),
  peas: () => packet('#2E8B57', 'GREEN PEAS', 'pea', '#7CC242'),
  bhujia: () => packet('#D9442E', 'ALOO BHUJIA', 'stick', '#E0A03A'),
  mixture: () => packet('#7A3FA0', 'MIXTURE', 'mix', ''),
  murukku: () => packet('#E07B1F', 'MURUKKU', 'spiral', '#C98F3E'),
  bananachips: () => packet('#2F8F4E', 'BANANA CHIPS', 'chip', '#F2C94C'),
  biscuits: () => packet('#C0392B', 'TEA BISCUITS', 'biscuit', '#D9A35B'),
  gjmix: () => packet('#8E2C48', 'GULAB JAMUN', 'ball', '#7B3A1C'),
  kajukatli: () => sweetsPlate('katli'),
  soan: () => sweetsPlate('soan'),
  mangopulp: () => can('#F2A516', 'ALPHONSO'),
  kesarpulp: () => can('#E2602A', 'KESAR'),
  jaggery: () => sweetsPlate('jaggery'),
  ghee: () => jar('#F3C64B', '#C8102E', 'GHEE'),
  oil: () => bottle(),
  tea: () => seedBowl('#3A2418', 'tea', { bowl: 'white', bg: '#7A5A3A' }),
  pickle: () => jar('#C2401C', '#2E7A34', 'ACHAR', { chunks: true }),
  diya: () => diyas(),
  incense: () => incense(),
  tumbler: () => tumblers(),
  soap: () => soap(),
  'r-dal': () => recipeArt('dal'),
  'r-chana': () => recipeArt('chana'),
  'r-biryani': () => recipeArt('biryani'),
  'r-palak': () => recipeArt('palak'),
  'r-aloogobi': () => recipeArt('aloogobi'),
  'r-chai': () => recipeArt('chai'),
  'r-gj': () => recipeArt('gj'),
  'r-lassi': () => recipeArt('lassi'),
  'hero-thali': () => heroThali(),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [id, draw] of Object.entries(ART)) {
  seed(id);
  fs.writeFileSync(path.join(OUT, id + '.svg'), draw());
}
console.log(`Wrote ${Object.keys(ART).length} illustrations to ${OUT}`);
