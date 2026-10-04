"use client";

import { useEffect, useState } from "react";
import Highlight from "./Highlight";
import LocalTime from "./LocalTime";
import ThemeToggle from "./ThemeToggle";
import Stage from "./Stage";
import { useStageSwitch } from "../lib/useStageSwitch";
import { PAGES } from "../data/content";
import { playClick } from "../lib/playClick";
import "./portfolio.css";

const CITY = "MUMBAI";

const icon = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};
const SOCIALS = [
  {
    label: "Email",
    href: "mailto:kanishchhabra.info@gmail.com",
    svg: (
      <svg {...icon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/KanishChhabra",
    svg: (
      <svg {...icon} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/Kan7sh",
    svg: (
      <svg {...icon} fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/kanishc",
    svg: (
      <svg {...icon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="4.5" r="1.2" fill="currentColor" stroke="none" />
        <path d="M5 9v10M10 19V9M10 13a4 4 0 0 1 8 0v6" />
      </svg>
    ),
  },
];

export default function Portfolio() {
  const [visitCount, setVisitCount] = useState(null);
  const { view, phase, target, go, stageRef } = useStageSwitch();
  const active = (v) => (view === v ? "is-active" : "");

  useEffect(() => {
    fetch("/api/visits", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch visit count: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setVisitCount(data.visits))
      .catch((error) => console.error("Unable to load visit count.", error));
  }, []);

  return (
    <div className="page">
      <header className="topbar reveal" style={{ "--i": 0 }}>
        <LocalTime />
        <ThemeToggle />
      </header>

      <main className="main">
        <section className="copy">
          <h1 className="name reveal" style={{ "--i": 1 }}>Kanish Chhabra</h1>
          <p className="role reveal" style={{ "--i": 2 }}>FULL STACK DEVELOPER &amp; DESIGNER</p>

          <p className="reveal" style={{ "--i": 3 }}>
            from childhood, i had this curiosity to understand the world,
            explore art, and be different from the crowd. i don't know how those
            thoughts found their way into my mind so early, but i'm glad they
            did because they shaped who i am. they led me to both creativity and
            technology, and today i love{" "}
            <Highlight className={active("projects")} onClick={() => go("projects")}>building products</Highlight>{" "}
            through code because
            i see programming as a form of art. i'm currently a full-stack
            developer based in mumbai, originally from amritsar (i miss kulcha
            everyday). with 3 years of{" "}
            <Highlight className={active("experience")} onClick={() => go("experience")}>experience</Highlight>
            , i've worked on projects
            involving ai systems engineering, llm integration,
            retrieval-augmented generation, vector databases, model
            orchestration, inference pipelines, java, spring boot, react,
            flutter, kafka, backend systems, apis, and cloud technologies. i
            enjoy working across the stack, building intelligent systems, and
            taking ideas from architecture to production. i enjoy chasing
            spontaneous ideas, and whenever something interests me. outside of work, i love{" "}
            <Highlight href={PAGES.movies}>watching movies</Highlight> (ask me
            anything about them), <Highlight href={PAGES.lifting}>lifting weights</Highlight>, and reading books. i
            believe movies bring together almost every art form, and i'm always
            looking for new things to learn, build, and create.
          </p>
        </section>

        <div className="frame reveal-frame">
          <div className="frame-inner">
            <Stage view={view} phase={phase} target={target} stageRef={stageRef} />
          </div>
        </div>
      </main>

      <footer className="footer reveal" style={{ "--i": 5 }}>
        <div className="social">
          <span className="meta-plain">{CITY}</span>
          <span className="sep" />
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
              {s.svg}
            </a>
          ))}
        </div>
        <div className="visits">
          <span className="dot" />
          <div>
            <span>VISITS: </span>
            <strong>{visitCount === null ? "—" : visitCount.toLocaleString("en-US")}</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
