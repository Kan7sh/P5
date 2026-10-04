import { useCallback, useEffect, useRef, useState } from "react";

// Diagonal burgundy wipe timing. WIPE_MS = how long each layer takes to cross; LAG_MS = gap between the 3 layers.
export const WIPE_MS = 900, LAG_MS = 90;
export const COVER_MS = WIPE_MS + 2 * LAG_MS + 40; // one half (cover or reveal)

/** view: "scene" | "projects" | "experience". go(x) switches; go(activeView) goes back to the scene. */
export function useStageSwitch() {
  const [view, setView] = useState("scene");
  const [phase, setPhase] = useState("idle"); // idle -> cover -> reveal -> idle
  const [target, setTarget] = useState("scene"); // where we are heading (for the label)
  const viewRef = useRef("scene");
  const busy = useRef(false);
  const timers = useRef([]);
  const stageRef = useRef(null);

  const apply = (v) => { viewRef.current = v; setView(v); };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const go = useCallback((target) => {
    if (busy.current) return;
    const next = target === viewRef.current ? "scene" : target;
    if (window.matchMedia("(max-width: 900px)").matches)
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply(next);

    busy.current = true;
    setTarget(next);
    setPhase("cover");
    later(() => {
      apply(next);          // swap while fully covered
      setPhase("reveal");
      later(() => { setPhase("idle"); busy.current = false; }, COVER_MS);
    }, COVER_MS);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && viewRef.current !== "scene") go(viewRef.current); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); timers.current.forEach(clearTimeout); };
  }, [go]);

  return { view, phase, target, go, stageRef };
}
