"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  if (!show) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 animate-slide-up"
    >
      <div className="flex items-center gap-3 rounded-lg bg-zinc-900 px-5 py-3 shadow-xl ring-1 ring-zinc-700/50 dark:bg-zinc-800 dark:ring-zinc-600/50">
        <span className="text-sm font-medium text-zinc-100">{message}</span>
      </div>
    </div>
  );
}
