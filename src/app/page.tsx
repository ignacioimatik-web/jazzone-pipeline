"use client";

import { useEffect, useRef } from "react";

export default function HomePage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load original HTML from the static copy
    fetch("/original.html")
      .then((r) => r.text())
      .then((html) => {
        if (ref.current) {
          ref.current.innerHTML = html;
        }
      });
  }, []);

  return <div ref={ref} />;
}
