"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensurePeopleSeed,
  getPeople,
  getRelationships,
  PEOPLE_UPDATED_EVENT,
  type ManagedPerson,
} from "@/lib/people";

/**
 * Subscribes a component to the People data layer. Re-renders whenever people
 * or relationships change (in this tab or another one via the storage event).
 */
export function usePeople(selfName?: string) {
  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [relationships, setRelationships] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setPeople(getPeople());
    setRelationships(getRelationships());
  }, []);

  useEffect(() => {
    ensurePeopleSeed(selfName);
    refresh();

    window.addEventListener(PEOPLE_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PEOPLE_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [selfName, refresh]);

  return { people, relationships, refresh };
}
