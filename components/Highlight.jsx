"use client";

import { playClick } from "../lib/playClick";

/**
 * Reusable accent text. Wrap any text anywhere:
 *   <Highlight>real-time shader pipelines</Highlight>              -> button (use onClick)
 *   <Highlight href="https://...">watching movies</Highlight>      -> real <a>, opens in a new tab
 * Hover/focus/tap -> red wipe behind white text. Click -> plays the click sound.
 * Optional: onClick={fn}, sound={false}, className="..."
 */
export default function Highlight({ children, onClick, href, sound = true, className = "" }) {
  const handle = (e) => {
    if (sound) playClick();
    onClick?.(e);
  };
  const cls = `hl ${className}`.trim();

  if (href) {
    return (
      <a className={cls} href={href} target="_blank" rel="noopener noreferrer" onClick={handle}>
        {children}
      </a>
    );
  }

  return (
    <span
      className={cls}
      role="button"
      tabIndex={0}
      onClick={handle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle(e);
        }
      }}
    >
      {children}
    </span>
  );
}
