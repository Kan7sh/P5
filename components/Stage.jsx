import StargazerScene from "./StargazerScene";
import { ProjectsPanel, ExperiencePanel } from "./Panels";
import { WIPE_MS, LAG_MS, COVER_MS } from "../lib/useStageSwitch";

const LABELS = { scene: "NIGHT SKY", projects: "PROJECTS", experience: "EXPERIENCE / WORK" };

export default function Stage({ view, phase, target = "scene", stageRef }) {
  return (
    <div ref={stageRef} className="stage" data-view={view} aria-busy={phase !== "idle"}>
      {/* stays mounted so the sky keeps its state; hidden while a panel is open */}
      <div className="scene-wrap" hidden={view !== "scene"}>
        <div className="scene-fit"><StargazerScene /></div>
      </div>
      {view === "projects" && <ProjectsPanel />}
      {view === "experience" && <ExperiencePanel />}

      {/* three skewed burgundy layers sweep diagonally across, swap happens while covered */}
      <div
        className="wipe"
        data-phase={phase}
        aria-hidden="true"
        style={{ "--ms": `${WIPE_MS}ms`, "--lag": `${LAG_MS}ms`, "--lbl": `${Math.round(COVER_MS * 0.62)}ms` }}
      >
        <i style={{ "--n": 0 }} />
        <i style={{ "--n": 1 }} />
        <i style={{ "--n": 2 }} />
        <span className="px-label">// {LABELS[target]}</span>
      </div>
    </div>
  );
}
