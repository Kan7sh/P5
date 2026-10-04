// One sound per kind of interaction. Replace any file in /public/sounds, or change a path here.
export const SOUNDS = {
  highlight: "/sounds/click.wav",   // inline red highlights (switch panels / open links)
  theme: "/sounds/theme.wav",       // light / dark toggle
  social: "/sounds/social.wav",     // footer social icons
  button: "/sounds/button.wav",     // panel buttons + project cards
};

const cache = {};
function get(kind) {
  if (!cache[kind]) {
    const a = new Audio(SOUNDS[kind] ?? SOUNDS.highlight);
    a.preload = "auto";
    a.volume = 0.6;
    cache[kind] = a;
  }
  return cache[kind];
}

/** playClick("highlight" | "theme" | "social" | "button") */
export function playClick(kind = "highlight") {
  if (typeof window === "undefined") return;
  try {
    const a = get(typeof kind === "string" ? kind : "highlight");
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}
