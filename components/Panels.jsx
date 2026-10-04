import { useMemo } from "react";
import { playClick } from "../lib/playClick";
import { PROJECTS, EXPERIENCE, EDUCATION, LINKS, YEARS, UPDATED } from "../data/content";

/* ---------- tiny deterministic pixel-art thumbnail ---------- */
const TW = 32, TH = 24;
function pixels(variant, seed) {
  let a = seed * 9301 + 49297;
  const r = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
  const px = [];
  if (variant === "stars") {
    for (let i = 0; i < 46; i++) px.push([(r() * TW) | 0, (r() * TH) | 0]);
    [[8, 6], [22, 14]].forEach(([x, y]) => px.push([x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]));
  } else if (variant === "terrain") {
    for (let x = 0; x < TW; x++) {
      const t = (11 + Math.sin(x * 0.4 + seed) * 4 + Math.sin(x * 1.1) * 1.5) | 0;
      for (let y = t; y < TH; y++) if (y < t + 2 || ((x + y) % 2 === 0 && y < t + 9) || r() < 0.12) px.push([x, y]);
    }
  } else {
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++)
      if (Math.sin(x * 0.45 + y * 0.7 + seed) > 0.25 && (x + y) % 2 === 0) px.push([x, y]);
  }
  return px;
}
function Thumb({ image, variant = "stars", seed = 1 }) {
  const px = useMemo(() => (image ? [] : pixels(variant, seed)), [image, variant, seed]);
  return (
    <div className="pn-thumb">
      {image ? <img src={image} alt="" /> : (
        <svg viewBox={`0 0 ${TW} ${TH}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
          <rect width={TW} height={TH} fill="#000" />
          {px.map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" fill="#fff" />)}
        </svg>
      )}
    </div>
  );
}

/* ---------- shared bits ---------- */
const Head = ({ eyebrow, meta }) => (
  <header className="pn-head">
    <span className="pn-eyebrow"><i className="dot" /><em>//</em> {eyebrow}</span>
    <b>{meta}</b>
  </header>
);
const Foot = ({ note, href, label, tag }) => (
  <footer className="pn-foot">
    <span className="pn-eyebrow"><i className="dot" />{note}</span>
    <a className="pn-btn" href={href} target="_blank" rel="noopener noreferrer" onClick={() => playClick("button")}>
      {label} <span>{tag}</span>
    </a>
  </footer>
);
const Row = ({ item, i }) => (
  <article className="pn-row" style={{ "--i": i }}>
    <div className="pn-row-top">
      <h3>{item.role} <span>{" • "}{item.org}</span></h3>
      <span className="pn-chip">{item.period}</span>
    </div>
    <p>{item.desc}</p>
    {item.stack && <small>{item.stack.join(" • ")}</small>}
  </article>
);

/* ---------- panels ---------- */
export function ProjectsPanel() {
  return (
    <section className="panel" aria-label="Selected projects">
      <Head eyebrow="PROJECTS" meta={`${String(PROJECTS.length).padStart(2, "0")} PROJECTS / ARCHIVE`} />
      <p className="pn-desc">Selected Projects and systems I have designed and built, from AI tooling to backend platforms and mobile apps.</p>
      <div className="pn-body">
        {PROJECTS.map((p, i) => (
          <a key={p.title} className="pn-card" href={p.href} target="_blank" rel="noopener noreferrer" onClick={() => playClick("button")} style={{ "--i": i }}>
            <Thumb image={p.image} {...p.thumb} />
            <div className="pn-card-body">
              <div className="pn-row-top">
                <h3>{p.title} </h3>
                <span className="pn-chip tint">{p.tag}</span>
              </div>
              <p>{p.desc}</p>
              <small>{p.stack.join(" • ")}</small>
            </div>
          </a>
        ))}
      </div>
      <Foot note="INDEX / SELECTED WORKS" href={LINKS.allProjects} label="VIEW ALL PROJECTS" tag="↗" />
    </section>
  );
}

export function ExperiencePanel() {
  return (
    <section className="panel" aria-label="Experience">
      <Head eyebrow="EXPERIENCE / WORK" meta={`${YEARS} YRS EXPERIENCE`} />
      <p className="pn-desc">Outside of my professional work, I’ve also built several freelance projects over the past three years, ranging from Flutter mobile apps to Django backend systems. These experiences helped me sharpen my problem-solving, delivery speed, and ability to work across different product needs.</p>
      <div className="pn-body">
        <h4 className="pn-label" style={{ "--i": 0 }}>// 01. WORK EXPERIENCE</h4>
        {EXPERIENCE.map((e, i) => <Row key={e.role + e.period} item={e} i={i + 1} />)}
        <h4 className="pn-label" style={{ "--i": EXPERIENCE.length + 1 }}>// 02. EDUCATION </h4>
        {EDUCATION.map((e, i) => <Row key={e.role} item={e} i={EXPERIENCE.length + 2 + i} />)}
      </div>
      <Foot note={`UPDATED // ${UPDATED}`} href={LINKS.resume} label="RESUME / MORE" tag="[PDF]" />
    </section>
  );
}
