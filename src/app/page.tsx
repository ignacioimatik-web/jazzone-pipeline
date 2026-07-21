"use client";

import { useEffect, useRef } from "react";

export default function HomePage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load original HTML structure (without script tags)
    fetch("/original.html")
      .then((r) => r.text())
      .then((html) => {
        if (!ref.current) return;
        // Extract only the body content, strip script tags (they won't execute via innerHTML)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          let bodyContent = bodyMatch[1];
          // Remove script tags from the content (we'll load jazzone.js separately)
          bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "");
          ref.current.innerHTML = bodyContent;
        }

        // Load jazzone.js
        const script = document.createElement("script");
        script.src = "/jazzone.js";
        script.async = false;
        document.body.appendChild(script);
      });
  }, []);

  return <div ref={ref} />;
}
