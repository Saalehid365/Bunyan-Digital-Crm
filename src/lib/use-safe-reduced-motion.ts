"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// The server can't read matchMedia at all — this is also what the very first client
// render uses, so hydration never disagrees with what the server sent.
function getServerSnapshot() {
  return false;
}

/**
 * Like motion's own useReducedMotion(), but hydration-safe. motion's version reads
 * matchMedia synchronously into useState's initial value, so a visitor who actually has
 * the OS setting on gets a client render that already differs from the server's — a real
 * hydration mismatch, not just a lint nitpick. useSyncExternalStore is the framework's
 * own tool for exactly this: an external browser value that must agree with the server
 * on the first paint and can change after.
 */
export function useSafeReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
