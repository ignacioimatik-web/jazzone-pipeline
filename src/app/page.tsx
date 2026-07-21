"use client";

import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const loadLibrary: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const updateStats: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const loadJobs: any;

export default function HomePage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/original.html")
      .then((r) => r.text())
      .then((html) => {
        if (cancelled || !ref.current) return;
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (!bodyMatch) return;
        let bodyContent = bodyMatch[1];
        bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "");
        ref.current.innerHTML = bodyContent;

        // Load jazzone.js (DOMContentLoaded already fired, so init manually)
        const script = document.createElement("script");
        script.src = "/jazzone.js";
        script.async = false;
        script.onload = () => {
          if (typeof loadLibrary === "function") loadLibrary();
          if (typeof updateStats === "function") updateStats();
          if (typeof loadJobs === "function") loadJobs();
          setInterval(() => {
            if (typeof loadJobs === "function") loadJobs();
          }, 30000);
        };
        document.body.appendChild(script);
      });

    return () => { cancelled = true; };
  }, []);

  return <div ref={ref} />;
}
