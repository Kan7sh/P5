import { useEffect, useMemo, useState } from "react";

// Pixel grid: 192 x 128 units, scaled up crisply by the SVG.
const W = 192;
const H = 128;

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- tiny pixel-drawing helpers ---------- */
function line(x0, y0, x1, y1) {
  const pts = [];
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return pts;
}

// A pixel layer: Map of "x,y" -> "#" (white) or "o" (black, hides what is behind).
function makeLayer() {
  const m = new Map();
  const set = (x, y, v) => m.set(`${x},${y}`, v);
  const addLine = (a, b, c, d, v = "#") => line(a, b, c, d).forEach(([x, y]) => set(x, y, v));
  const addPoly = (pts, fill = "o", edge = "#") => {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && yc < by) || (by <= yc && yc < ay)) xs.push(ax + ((yc - ay) * (bx - ax)) / (by - ay));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) set(x, y, fill);
    }
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      addLine(ax, ay, bx, by, edge);
    }
  };
  return { m, set, addLine, addPoly };
}

function interp(pts, x) {
  if (x < pts[0][0] || x > pts[pts.length - 1][0]) return null;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return null;
}

// Turn a layer into SVG rects, merging horizontal runs.
function runs(entries) {
  const pts = entries
    .map(([k, v]) => { const [x, y] = k.split(",").map(Number); return { x, y, v }; })
    .filter((p) => p.x >= 0 && p.x < W && p.y >= 0 && p.y < H)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const out = [];
  for (const p of pts) {
    const l = out[out.length - 1];
    if (l && l.y === p.y && l.v === p.v && l.x + l.w === p.x) l.w++;
    else out.push({ ...p, w: 1 });
  }
  return out.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height="1" fill={r.v === "#" ? "#fff" : "#000"} />);
}

/* ---------- realistic pixel clouds: noise + lighting from the moon + dithering ---------- */
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

function makeNoise(seed) {
  const r = rng(seed), g = Array.from({ length: 64 * 64 }, () => r());
  const at = (x, y) => g[((y & 63) << 6) | (x & 63)];
  const sm = (t) => t * t * (3 - 2 * t);
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y, oct = 4) => {
    let s = 0, t = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += amp * n(x * f, y * f); t += amp; amp /= 2; f *= 2; }
    return s / t;
  };
}

// Clouds are built as a heightfield of overlapping domed puffs: big lobes along a flat base, then smaller
// lobes budding off their upper edges (cauliflower billows). Radii are warped by noise for rugged edges.
// Each pixel is lit from the moon using the dome's surface normal, darkened in the creases between lobes
// and on the underside, brightened near the moon, then an 8x8 ordered dither turns it into 1-bit pixels.
const bay8 = (x, y) => (4 * BAYER[y & 3][x & 3] + [[0, 2], [3, 1]][(y >> 2) & 1][(x >> 2) & 1] + 0.5) / 64;

function buildCloud(c, seed) {
  const r = rng(seed), fbm = makeNoise(seed), out = [];
  const base = c.y + c.h, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  let lx = 155 - cx, ly = 25 - cy;
  const dist = Math.hypot(lx, ly) || 1; lx /= dist; ly /= dist;
  const glow = Math.max(0, 1 - dist / 110);                       // clouds near the moon catch more light

  // cirrus: long, thin, noise-stretched wisps that fade out through dithering
  if (c.streak) {
    for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) {
      const u = (x - c.x) / c.w, v = (y - c.y) / c.h;
      const env = Math.pow(Math.sin(Math.PI * u), 0.8) * (1 - Math.pow(Math.abs(2 * v - 1), 1.6));
      const dens = env * (0.35 + 1.1 * fbm(x * 0.07 + v * 2, y * 0.6, 4)) - 0.28 + glow * 0.1 + (fbm(x * 0.25, y * 1.2, 2) - 0.5) * 0.5;
      if (dens > 0 && bay8(x, y) < dens * 1.7) out.push([`${x},${y}`, "#"]);
    }
    return out;
  }

  // cumulus lobes: two generations of smaller puffs growing out of the upper half of each parent
  const lobes = [], nBig = Math.max(3, Math.round(c.w / 8));
  for (let i = 0; i < nBig; i++) {
    const u = i / (nBig - 1);
    const rad = Math.max(3, c.h * (0.36 + 0.4 * Math.sin(Math.PI * (0.08 + 0.84 * u))) * (0.85 + r() * 0.3));
    lobes.push({ x: c.x + u * c.w + (r() - 0.5) * 3, y: base - rad * 0.6, r: rad });
  }
  for (let gen = 0; gen < 3; gen++)
    lobes.filter((p) => p.r > 2.4).forEach((p) => {
      for (let k = 0, n = 2 + Math.floor(r() * 2); k < n; k++) {
        const a = -Math.PI * (0.04 + 0.92 * r());
        lobes.push({ x: p.x + Math.cos(a) * p.r * 0.8, y: p.y + Math.sin(a) * p.r * 0.8, r: p.r * (0.4 + r() * 0.25) });
      }
    });

  for (let k = 0; k < 2; k++) lobes.push({ x: k ? c.x + c.w + 2 + r() * 3 : c.x - 2 - r() * 3, y: base - 1.2, r: 1.6 + r() });

  // heightfield: tallest dome wins, so lobes meet in natural creases
  const hgt = new Map();
  for (const p of lobes) {
    const R = p.r * 1.3;
    for (let y = Math.floor(p.y - R); y <= Math.min(base, Math.ceil(p.y + R)); y++)
      for (let x = Math.floor(p.x - R); x <= Math.ceil(p.x + R); x++) {
        const rr = p.r * (0.8 + 0.45 * fbm(x * 0.6, y * 0.6, 3)), d2 = (x - p.x) ** 2 + (y - p.y) ** 2;
        if (d2 >= rr * rr) continue;
        const h = Math.sqrt(rr * rr - d2), k = `${x},${y}`;
        if (!(hgt.get(k) >= h)) hgt.set(k, h);
      }
  }

  const hg = (x, y) => hgt.get(`${x},${y}`) ?? 0;
  const Lx = lx * 0.8, Ly = ly * 0.8, Lz = 0.6;                   // unit light vector toward the moon
  hgt.forEach((h, k) => {
    const [x, y] = k.split(",").map(Number);
    if (y === base && r() < 0.35) return;                         // slightly ragged flat base
    const gx = (hg(x + 1, y) - hg(x - 1, y)) / 2, gy = (hg(x, y + 1) - hg(x, y - 1)) / 2;
    const diff = Math.max(0, (Lz - gx * Lx - gy * Ly) / Math.hypot(gx, gy, 1));
    const occ = Math.min(0.55, 0.25 * Math.max(0, (hg(x - 2, y) + hg(x + 2, y) + hg(x, y - 2) + hg(x, y + 2)) / 4 - h)
      + 0.2 * Math.max(0, (hg(x - 1, y) + hg(x + 1, y) + hg(x, y - 1) + hg(x, y + 1)) / 4 - h));
    const under = Math.max(0, (y - (base - c.h * 0.45)) / (c.h * 0.45));
    let b = 0.2 + 0.85 * diff - occ - 0.5 * under + 0.12 * glow + (fbm(x * 1.3, y * 1.3, 3) - 0.5) * 0.5;
    const edge = !hgt.has(`${x + 1},${y}`) || !hgt.has(`${x - 1},${y}`) || !hgt.has(`${x},${y + 1}`) || !hgt.has(`${x},${y - 1}`);
    if (edge) b = Math.max(b, 0.5 + 0.4 * diff);                  // keep the silhouette readable on the shadow side
    out.push([k, b > bay8(x, y) ? "#" : "o"]);                    // white = lit, 'o' = shaded (hides stars behind)
  });

  for (let i = 0; i < Math.round(c.w / 5); i++) {                 // soft wisps trailing under the base
    const wx = Math.floor(c.x + r() * c.w), len = 2 + Math.floor(r() * 5), wy = base + 1 + Math.floor(r() * 2);
    for (let x = wx; x < wx + len; x++) if (bay8(x, wy) < 0.75) out.push([`${x},${wy}`, "#"]);
  }
  return out;
}

const CLOUDS = [
  { x: 11, y: 36, w: 19, h: 8 }, { x: 159, y: 69, w: 17, h: 7 },
  { x: 66, y: 85, w: 22, h: 4, streak: 1 }, { x: 70, y: 16, w: 17, h: 3, streak: 1 }, { x: 118, y: 33, w: 14, h: 3, streak: 1 },
];

/* ---------- the moon: lit sphere, maria, craters with rims, bright ray systems ---------- */
function buildMoon(cx, cy, R) {
  const fbm = makeNoise(77), r = rng(3), out = [];
  const LIGHT = [-0.7, -0.7];
  const craters = [
    { x: -0.38, y: -0.48, r: 0.2 }, { x: 0.28, y: -0.55, r: 0.15 }, { x: 0.52, y: 0.08, r: 0.17 },
    { x: -0.58, y: 0.18, r: 0.13 }, { x: 0.05, y: 0.5, r: 0.2 }, { x: -0.12, y: 0.08, r: 0.1 },
    { x: 0.42, y: 0.58, r: 0.11 }, { x: -0.32, y: 0.62, r: 0.09 }, { x: 0.64, y: -0.28, r: 0.09 },
    { x: -0.18, y: -0.18, r: 0.08 }, { x: 0.2, y: -0.1, r: 0.07 }, { x: -0.7, y: -0.2, r: 0.07 },
    { x: 0.8, y: 0.3, r: 0.06 }, { x: -0.05, y: -0.7, r: 0.07 }, { x: 0.15, y: 0.78, r: 0.06 },
  ];
  // bright rays fanning out from two young craters
  const rays = new Set();
  [[0.05, 0.5, 9], [0.52, 0.08, 5]].forEach(([rx, ry, n]) => {
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2, len = 0.35 + r() * 0.6;
      for (let t = 0.2; t < len; t += 0.015)
        rays.add(`${Math.round(cx + (rx + Math.cos(a) * t) * R)},${Math.round(cy + (ry + Math.sin(a) * t) * R)}`);
    }
  });
  for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++)
    for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R + 0.3) continue;
      const nx = (x - cx) / R, ny = (y - cy) / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let b = 0.78 + 0.22 * nz;                                              // limb darkening
      const m = Math.min(1, Math.max(0, (fbm(nx * 1.7 + 4, ny * 1.7 + 8, 4) - 0.45) / 0.1));
      b -= 0.75 * m * (0.6 + 0.4 * nz);                                      // dark maria
      b += (fbm(nx * 9 + 2, ny * 9 + 5, 2) - 0.5) * 0.4;                    // fine regolith texture
      for (const c of craters) {
        const dx = nx - c.x, dy = ny - c.y, dist = Math.hypot(dx, dy) / c.r;
        if (dist > 1.25) continue;
        const dot = dist === 0 ? 0 : (dx * LIGHT[0] + dy * LIGHT[1]) / (dist * c.r);
        if (dist < 0.85) b -= 0.38 + (dot > 0.2 && dist > 0.45 ? 0.3 : 0);   // floor + shadowed inner wall
        else b += 0.2 + 0.2 * dot;                                            // raised rim, brighter toward the light
      }
      if (rays.has(`${x},${y}`)) b += 0.45;
      if (d >= R - 0.9) b = 1.2;                                             // crisp limb
      const bay = (BAYER[y & 3][x & 3] + 0.5) / 16;
      out.push([`${x},${y}`, b > bay ? "#" : "o"]);
    }
  return out;
}

/* ---------- mountain ranges: rough ridgelines, snow caps, lit/shadow faces, gullies ---------- */
function roughen(pts, r, amp, passes = 2) {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const q = [];
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i], [x1, y1] = p[i + 1];
      q.push(p[i]);
      if (x1 - x0 > 3) q.push([Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2 + ((r() - 0.5) * amp * (x1 - x0)) / 4)]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

function buildRange(ptsIn, seed, o = {}) {
  const r = rng(seed), fbm = makeNoise(seed + 1), L = makeLayer();
  const pts = roughen(ptsIn, r, o.rough ?? 1.4, 3);
  const jag = Array.from({ length: W }, () => 0);
  for (let x = 0; x < W; x++) jag[x] = Math.round((fbm(x * 0.45, 7, 3) - 0.5) * 4.4 * (o.jag ?? 1) + (r() - 0.5) * (o.jag ?? 1));
  const top = (x) => { const v = interp(pts, x); return v == null ? null : Math.round(v + jag[x]); };
  const bay = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;

  const cols = []; let prev = null;
  for (let x = 0; x < W; x++) {
    const t = top(x);
    if (t == null) { prev = null; continue; }
    const a = prev == null ? t : Math.min(t, prev), b = prev == null ? t : Math.max(t, prev);
    for (let y = a; y <= b; y++) L.set(x, y, "#");
    cols.push({ x, t }); prev = t;
  }

  // moonlight from the upper right: each column is lit by how much the ground there faces the moon, with
  // vertical rock streaks, fading out with depth; faces turned away stay dark so ridges read as 3D
  const depthMax = Math.round((o.litD ?? 0) * 1.3);
  if (depthMax) for (let x = 2; x < W - 2; x++) {
    const t = top(x), tp = top(x + 2), tm = top(x - 2);
    if (t == null || tp == null || tm == null) continue;
    const lit = Math.max(0, Math.min(1, ((tp - tm) / 4) * 1.4));
    for (let k = 1; k <= depthMax; k++) {
      const y = t + k, dens = lit * (0.95 * (1 - k / depthMax) + (fbm(x * 0.9, y * 0.12) - 0.5) * 0.9);
      if (dens > 0 && bay(x, y) < dens) L.set(x, y, "#");
    }
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    if (!(py < pts[i - 1][1] && py < pts[i + 1][1])) continue;           // peaks only
    // how far the peak rises above its surrounding valleys
    let lb = py, lx = pts[i - 1][0], rb = py, rx = pts[i + 1][0];
    for (let j = i - 1; j >= 0 && pts[j][1] >= py; j--) if (pts[j][1] > lb) { lb = pts[j][1]; lx = pts[j][0]; }
    for (let j = i + 1; j < pts.length && pts[j][1] >= py; j++) if (pts[j][1] > rb) { rb = pts[j][1]; rx = pts[j][0]; }
    const prom = Math.min(lb, rb) - py;
    if (prom < 3) continue;
    const sc = Math.min(1, prom / 12);

    // snow cap with ragged lower edge
    const capD = Math.round((o.cap ?? 0) * sc), capW = Math.round((o.capW ?? 8) * sc) + 2;
    const depthAt = (x) => (capD > 0 ? Math.max(0, Math.round(capD * (1 - Math.abs(x - px) / capW))) : 0);
    for (let x = px - capW; x <= px + capW; x++) {
      const t = top(x); if (t == null) continue;
      const d = depthAt(x) + (r() > 0.5 ? 1 : 0);
      for (let y = t; y <= t + d; y++) L.set(x, y, "#");
      if (d > 2 && r() > 0.65) L.set(x, t + d - 1, "o");
      if (capD > 0) for (let k = 1; k <= 3; k++) if (bay(x, t + d + k) < (1 - k / 4) * 0.7 * (d / capD)) L.set(x, t + d + k, "#");
      if (d > 1 && r() > 0.8) for (let y = t + d + 1, e = y + 1 + Math.floor(r() * 4); y <= e; y++) L.set(x, y, "#");
      for (let k = 1; k <= 3; k++) if (bay(x, t + d + k) < (1 - k / 4) * 0.7 * (d / Math.max(1, capD))) L.set(x, t + d + k, "#");
    }

    // moonlit face (the side toward the moon): dithered fade with vertical rock streaks
    const depth = Math.round((o.litD ?? 0) * Math.min(1, prom / 10));
    for (let x = px; x < rx; x++) {
      const t = top(x); if (t == null) continue;
      const edge = Math.min(1, (rx - x) / 4);
      for (let k = 1; k <= depth; k++) {
        const y = t + k, dens = 0.8 * (1 - k / depth) * edge + (fbm(x * 0.6, y * 0.15) - 0.5) * 0.6;
        if (dens > 0 && bay(x, y) < dens) L.set(x, y, "#");
      }
    }
    // shadow face: faint speckle only
    for (let x = Math.max(lx + 2, px - 12); x < px - 1; x++) {
      const t = top(x); if (t == null) continue;
      for (let y = t + 4; y < t + 4 + depth * 0.7; y++) if ((x + y * 3) % 13 === 0 && fbm(x * 0.5, y * 0.2) > 0.5) L.set(x, y, "#");
    }

    // gullies on the lit face (dark) and ridge lines on the shadow face (white)
    const nC = Math.round((o.creases ?? 0) * sc);
    const step = Math.max(2, Math.floor((rx - px - 4) / Math.max(1, nC)));
    for (let k = 0; k < nC; k++) {
      const x0 = px + 2 + k * step; if (x0 > rx - 3) break;
      const y0 = top(x0) + depthAt(x0) + 1, len = 6 + Math.floor(r() * (o.len ?? 8)), tilt = 0.2 + r() * 0.4;
      for (let j = 0; j < len; j++) if (j % 5 !== 4) L.set(Math.round(x0 + j * tilt), y0 + j, "o");
    }
    for (let k = 0; k < Math.ceil(nC / 2); k++) {
      const x0 = px - 3 - k * 4; if (x0 < lx + 3) break;
      const y0 = top(x0) + depthAt(x0) + 3, len = 5 + Math.floor(r() * (o.len ?? 8) * 0.8);
      for (let j = 0; j < len; j++) if (j % 3 !== 2) L.set(Math.round(x0 - j * 0.35), y0 + j, "#");
    }
  }
  return { cols, L, top };
}

const FAR = [[0, 110], [12, 102], [22, 108], [34, 98], [46, 106], [58, 100], [70, 109], [86, 97], [100, 107], [112, 95], [126, 106], [140, 100], [152, 109], [166, 94], [180, 104], [191, 99]];
const MID = [[0, 116], [16, 110], [30, 103], [44, 112], [60, 106], [76, 116], [92, 108], [108, 100], [124, 110], [140, 116], [156, 105], [172, 111], [191, 104]];
const FRONT = [[0, 123], [20, 120], [44, 123], [70, 121], [100, 124], [130, 121], [160, 124], [191, 121]];

export default function StargazerScene() {
  const scene = useMemo(() => {
    const r = rng(7);

    const dots = [];
    for (let i = 0; i < 83; i++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * 92);
      if (Math.hypot(x - 155, y - 25) < 19) continue;
      dots.push({ x, y, d: (r() * 6).toFixed(2), s: (4 + r() * 5).toFixed(2) });
    }
    const plus = [
      [17, 11], [66, 6], [131, 24], [175, 7], [10, 50], [82, 43],
      [137, 45], [30, 80],
    ].map(([x, y], i) => ({ x, y, d: (i * 0.6).toFixed(2), s: (5 + (i % 4) * 1.2).toFixed(2) }));

    const clouds = CLOUDS.map((c, i) => ({
      px: buildCloud(c, 100 + i * 17),
      dx: (3 + (i % 3) * 2) * (i % 2 ? 1 : -1),
      dur: 55 + i * 11,
    }));

    const far = buildRange(FAR, 11, { jag: 0.8, rough: 1.2, cap: 3, capW: 6, creases: 2, len: 5, litD: 6 });
    const mid = buildRange(MID, 23, { jag: 1, rough: 1.5, cap: 5, capW: 8, creases: 4, len: 7, litD: 9 });
    const front = buildRange(FRONT, 37, { jag: 1.2, rough: 1 });

    // front slope: contour dashes, flecks, rocks, grass
    const detail = makeLayer();
    front.cols.forEach(({ x, t }) => {
      [[4, 5, 9], [9, 6, 13], [15, 3, 11]].forEach(([off, len, mod], bi) => {
        if ((x + bi * 5) % mod < len && (x * 7 + bi) % 5 !== 0 && t + off < H - 1) detail.set(x, t + off + (((x >> 2) + bi) % 2), "#");
      });
      if (x % 9 === 0) { detail.set(x, t - 1, "#"); detail.set(x + 1, t - 1, "#"); }
      for (let k = 2; k <= 5; k++) if ((BAYER[(t + k) & 3][x & 3] + 0.5) / 16 < 0.5 * (1 - k / 6)) detail.set(x, t + k, "#");
    });
    [[16, 3], [60, 4], [88, 4], [118, 3], [150, 4], [178, 3]].forEach(([x, big]) => {
      const t = front.cols[x].t, y = t - big + 2;
      detail.addPoly([[x, y + big], [x + 1, y + 2], [x + 4, y], [x + big + 2, y + 1], [x + big + 4, y + big]], "o", "#");
      detail.addLine(x + 3, y + 2, x + 4, y + big - 1);
      detail.addLine(x + big, y + 2, x + big + 1, y + big - 1);
    });
    const grass = [3, 22, 48, 68, 104, 126, 142, 158, 174, 188].map((x) => ({ x, y: front.cols[x].t + 4 }));

    const halo = [];
    for (let y = 0; y < 64; y++) for (let x = 116; x < W; x++) {
      const d = Math.hypot(x - 155, y - 25);
      if (d > 14.5 && d < 21 && (BAYER[y & 3][x & 3] + 0.5) / 16 < (1 - (d - 14.5) / 6.5) * 0.025) halo.push([`${x},${y}`, "#"]);
    }
    const moon = buildMoon(155, 25, 13);

    // valley mist drifting between the far and middle ranges
    const mn = makeNoise(55), mist = [];
    for (let y = 100; y < 116; y++) for (let x = 0; x < W; x++) {
      const t = far.top(x);
      if (t == null || y <= t + 1) continue;
      const fall = Math.max(0, 1 - Math.abs(y - 108) / 7), dens = fall * (mn(x * 0.05, y * 0.45) * 1.3 - 0.25);
      if (dens > 0 && (BAYER[y & 3][x & 3] + 0.5) / 16 < dens * 0.7) mist.push([`${x},${y}`, "#"]);
    }

    return { dots, plus, halo, moon, mist, clouds, far, mid, front, detail: [...detail.m], grass };
  }, []);

  // Shooting stars: slow, one every several seconds.
  const [shots, setShots] = useState([]);
  useEffect(() => {
    let id = 0, timer;
    const spawn = () => {
      const shot = { id: id++, x: 60 + Math.random() * 120, y: 4 + Math.random() * 45, dur: 1.8 + Math.random() * 1.0 };
      setShots((s) => [...s, shot]);
      setTimeout(() => setShots((s) => s.filter((q) => q.id !== shot.id)), shot.dur * 1000 + 100);
      timer = setTimeout(spawn, 4000 + Math.random() * 5000);
    };
    timer = setTimeout(spawn, 1500);
    return () => clearTimeout(timer);
  }, []);

  const Range = ({ d }) => (
    <g>
      {d.cols.map((c) => <rect key={c.x} x={c.x} y={c.t} width="1" height={H - c.t} fill="#000" />)}
      {runs([...d.L.m])}
    </g>
  );

  return (
    <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", background: "#000" }}>
      <style>{`
        .sg-tw { animation: sg-twinkle var(--s) ease-in-out var(--d) infinite; }
        .sg-shot { animation: sg-shoot var(--dur) linear forwards; }
        .sg-drift { animation: sg-drift var(--dur) ease-in-out infinite alternate; }
        @keyframes sg-twinkle { 0%,100% { opacity: 1 } 45% { opacity: .12 } 70% { opacity: .8 } }
        @keyframes sg-shoot {
          0% { transform: translate(0,0); opacity: 0 }
          12% { opacity: 1 }
          100% { transform: translate(-70px,35px); opacity: 0 }
        }
        @keyframes sg-drift { from { transform: translateX(0) } to { transform: translateX(var(--dx)) } }
        @media (prefers-reduced-motion: reduce) { .sg-tw, .sg-shot, .sg-drift { animation: none } }
      `}</style>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="A pixel-art night sky with a full moon, drifting realistic clouds, twinkling and shooting stars, with low layered snow-capped mountains and misty valleys along the bottom"
        shapeRendering="crispEdges"
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: "3 / 2" }}
      >
        <rect width={W} height={H} fill="#000" />

        {/* Stars */}
        {scene.dots.map((d, i) => (
          <rect key={i} className="sg-tw" x={d.x} y={d.y} width="1" height="1" fill="#fff" style={{ "--d": `${d.d}s`, "--s": `${d.s}s` }} />
        ))}
        {scene.plus.map((p, i) => (
          <g key={i} className="sg-tw" fill="#fff" style={{ "--d": `${p.d}s`, "--s": `${p.s}s` }}>
            <rect x={p.x - 1} y={p.y} width="3" height="1" />
            <rect x={p.x} y={p.y - 1} width="1" height="3" />
          </g>
        ))}

        {/* Moon glow + moon */}
        <g>{runs(scene.halo)}</g>
        <g>{runs(scene.moon)}</g>

        {/* Clouds (drift very slowly) */}
        {scene.clouds.map((c, i) => (
          <g key={i} className="sg-drift" style={{ "--dx": `${c.dx}px`, "--dur": `${c.dur}s` }}>{runs(c.px)}</g>
        ))}

        {/* Shooting stars */}
        {shots.map((s) => (
          <g key={s.id} transform={`translate(${s.x} ${s.y})`}>
            <g className="sg-shot" style={{ "--dur": `${s.dur}s` }} fill="#fff">
              {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 2} y={-i} width="2" height="1" opacity={1 - i / 13} />)}
            </g>
          </g>
        ))}

        {/* Mountains: far, middle, foreground */}
        <Range d={scene.far} />
        <g>{runs(scene.mist)}</g>
        <Range d={scene.mid} />
        <Range d={scene.front} />
        <g>{runs(scene.detail)}</g>

        {/* Grass tufts */}
        <g fill="#fff">
          {scene.grass.map((g, i) => (
            <g key={i}>
              <rect x={g.x} y={g.y - 6} width="1" height="6" />
              <rect x={g.x - 2} y={g.y - 5} width="1" height="5" />
              <rect x={g.x + 2} y={g.y - 5} width="1" height="5" />
              <rect x={g.x - 3} y={g.y - 3} width="1" height="3" />
              <rect x={g.x + 3} y={g.y - 3} width="1" height="3" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
