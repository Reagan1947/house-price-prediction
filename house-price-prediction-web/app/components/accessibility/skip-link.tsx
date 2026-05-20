"use client";

import type { MouseEvent } from "react";

const MAIN_CONTENT_ID = "main-content";

export function SkipLink() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(MAIN_CONTENT_ID);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.focus();
    target.scrollIntoView({ block: "start", inline: "nearest" });
    window.history.replaceState(null, "", `#${MAIN_CONTENT_ID}`);
  };

  return (
    <a className="skip-link" href={`#${MAIN_CONTENT_ID}`} onClick={handleClick}>
      Skip to main content
    </a>
  );
}
