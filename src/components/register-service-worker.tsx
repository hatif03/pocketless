"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability/offline shell is a progressive enhancement — ignore failures
      });
    }
  }, []);
  return null;
}
