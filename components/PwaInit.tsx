"use client";

import { useEffect, useState } from "react";

export default function PwaInit() {
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    // Show iOS install hint if not already installed
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("ios-hint-dismissed");
    if (isIos && !isStandalone && !dismissed) {
      setShowIosHint(true);
    }
  }, []);

  if (!showIosHint) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 rounded-xl bg-zinc-800 border border-zinc-700 p-4 shadow-xl">
      <button
        onClick={() => { setShowIosHint(false); sessionStorage.setItem("ios-hint-dismissed", "1"); }}
        className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="text-sm font-medium text-zinc-200 pr-6">Install Fitness Coach</p>
      <p className="text-xs text-zinc-400 mt-1">
        Tap <span className="font-semibold">Share</span> then <span className="font-semibold">Add to Home Screen</span> for the full app experience.
      </p>
    </div>
  );
}
