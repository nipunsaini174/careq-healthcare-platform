"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 * Use this to gate UI that depends on browser-only APIs (localStorage,
 * cookies, React Query cache warmed after login) so the first client
 * paint matches what the server rendered.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
