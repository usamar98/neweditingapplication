"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

export function AuthActivityTracker() {
  useEffect(() => {
    const sendHeartbeat = () => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/auth/activity", { method: "POST", keepalive: true }).catch(() => undefined);
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", sendHeartbeat);
    window.addEventListener("focus", sendHeartbeat);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", sendHeartbeat);
      window.removeEventListener("focus", sendHeartbeat);
    };
  }, []);

  return null;
}
