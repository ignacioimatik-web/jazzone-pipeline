"use client";

import type { ReactNode } from "react";
import type { ViewType } from "@/lib/types";

interface ViewContainerProps {
  children: ReactNode;
  activeView: ViewType;
  className?: string;
}

const views: ViewType[] = [
  "library",
  "download",
  "import",
  "sources",
  "manage",
];

export default function ViewContainer({
  children,
  activeView,
  className = "",
}: ViewContainerProps) {
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <main
      className={`flex-1 overflow-y-auto bg-[#0A0A0A] ${className}`}
    >
      {views.map((view, i) => (
        <div
          key={view}
          className={view === activeView ? "block" : "hidden"}
        >
          {childrenArray[i]}
        </div>
      ))}
    </main>
  );
}
