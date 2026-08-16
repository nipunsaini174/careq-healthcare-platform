"use client";

/**
 * People (managed patients) data layer.
 *
 * This is the single source of truth for the "who is this for?" feature:
 * the account owner ("Self") plus any family members / dependents the user
 * books appointments for. Appointments, reports, prescriptions and invoices
 * are tagged with a `personId` so the UI can filter by person (Google Photos
 * "people" style).
 *
 * Storage is **per-user** — each logged-in account gets its own localStorage
 * key so family members never leak between accounts on the same device.
 */

export interface ManagedPerson {
  id: string;
  name: string;
  /** e.g. "Self", "Father", "Mother", or any custom relation */
  relationship: string;
  age?: string;
  gender?: string;
  /** index into AVATAR_COLORS, kept stable per person */
  colorIndex: number;
  isSelf?: boolean;
  createdAt: number;
}

// ─── Per-user key management ────────────────────────────────────────
// The userId is set once on login (see AppDataProvider). Until it's
// set, read/write silently return empty / no-op so pages that render
// before auth completes don't crash or pollute a global key.
let _currentUserId: string | null = null;

function peopleKey(): string | null {
  if (!_currentUserId) return null;
  // Migrate legacy suvidhaq key if present
  if (isBrowser()) {
    const legacy = localStorage.getItem(`suvidhaq-people-${_currentUserId}`);
    const current = localStorage.getItem(`careq-people-${_currentUserId}`);
    if (legacy && !current) {
      localStorage.setItem(`careq-people-${_currentUserId}`, legacy);
    }
  }
  return `careq-people-${_currentUserId}`;
}

function relationshipsKey(): string | null {
  if (!_currentUserId) return null;
  // Migrate legacy suvidhaq key if present
  if (isBrowser()) {
    const legacy = localStorage.getItem(`suvidhaq-relationships-${_currentUserId}`);
    const current = localStorage.getItem(`careq-relationships-${_currentUserId}`);
    if (legacy && !current) {
      localStorage.setItem(`careq-relationships-${_currentUserId}`, legacy);
    }
  }
  return `careq-relationships-${_currentUserId}`;
}

/**
 * Must be called once after login (before any component calls
 * ensurePeopleSeed / getPeople / addPerson). Pass the user's numeric
 * id (from the JWT or profile response) so localStorage is scoped.
 */
export function setCurrentUserId(userId: string | number | null) {
  _currentUserId = userId != null ? String(userId) : null;
}

export function getCurrentUserId(): string | null {
  return _currentUserId;
}

export const PEOPLE_UPDATED_EVENT = "people:updated";

/** Relationships offered by default. "Other" triggers a custom free-text input. */
export const DEFAULT_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Spouse",
  "Brother",
  "Sister",
  "Grandparent",
  "Other",
];

/** Avatar gradient palette (from, to) used to give each person a stable color. */
export const AVATAR_COLORS: { from: string; to: string }[] = [
  { from: "#14b8a6", to: "#0d9488" }, // teal
  { from: "#3b82f6", to: "#2563eb" }, // blue
  { from: "#a855f7", to: "#7c3aed" }, // purple
  { from: "#f97316", to: "#ea580c" }, // orange
  { from: "#ec4899", to: "#db2777" }, // pink
  { from: "#22c55e", to: "#16a34a" }, // green
  { from: "#eab308", to: "#ca8a04" }, // amber
  { from: "#06b6d4", to: "#0891b2" }, // cyan
];

const isBrowser = () => typeof window !== "undefined";

function emitUpdate() {
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(PEOPLE_UPDATED_EVENT));
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getColorForPerson(person: Pick<ManagedPerson, "colorIndex">) {
  return AVATAR_COLORS[person.colorIndex % AVATAR_COLORS.length];
}

function readPeople(): ManagedPerson[] {
  if (!isBrowser()) return [];
  const key = peopleKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePeople(people: ManagedPerson[]) {
  if (!isBrowser()) return;
  const key = peopleKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(people));
  emitUpdate();
}

/**
 * Ensures a "Self" person exists. Called on first render after login
 * to guarantee the "Myself" option is always available. No demo data
 * is seeded — family members are added explicitly by the user.
 */
export function ensurePeopleSeed(selfName = "You"): ManagedPerson[] {
  if (!isBrowser()) return [];
  if (!peopleKey()) return [];

  let people = readPeople();

  if (people.length === 0) {
    const now = Date.now();
    people = [
      { id: "self", name: selfName, relationship: "Self", colorIndex: 0, isSelf: true, createdAt: now },
    ];
    writePeople(people);
    return people;
  }

  // Keep Self's name in sync with the logged-in profile when we learn it.
  const self = people.find((p) => p.isSelf);
  if (self && selfName && selfName !== "You" && self.name !== selfName) {
    self.name = selfName;
    writePeople(people);
  }
  return people;
}

export function getPeople(): ManagedPerson[] {
  return readPeople();
}

export function getPersonById(id: string | null | undefined): ManagedPerson | undefined {
  if (!id) return undefined;
  return readPeople().find((p) => p.id === id);
}

/** Best-effort match for legacy records that only stored a name string. */
export function getPersonByName(name: string | null | undefined): ManagedPerson | undefined {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  return readPeople().find((p) => p.name.trim().toLowerCase() === lower);
}

export function addPerson(input: {
  name: string;
  relationship: string;
  age?: string;
  gender?: string;
}): ManagedPerson {
  const people = readPeople();

  // De-dupe by name + relationship to avoid creating the same dependent twice.
  const existing = people.find(
    (p) =>
      p.name.trim().toLowerCase() === input.name.trim().toLowerCase() &&
      p.relationship.toLowerCase() === input.relationship.toLowerCase()
  );
  if (existing) return existing;

  const usedColors = new Set(people.map((p) => p.colorIndex));
  let colorIndex = people.length % AVATAR_COLORS.length;
  for (let i = 0; i < AVATAR_COLORS.length; i++) {
    if (!usedColors.has(i)) {
      colorIndex = i;
      break;
    }
  }

  const person: ManagedPerson = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    relationship: input.relationship.trim(),
    age: input.age,
    gender: input.gender,
    colorIndex,
    createdAt: Date.now(),
  };

  // Persist any new custom relationship so it shows up next time.
  addRelationship(input.relationship);

  writePeople([...people, person]);
  return person;
}

export function updatePerson(id: string, patch: Partial<Omit<ManagedPerson, "id">>): ManagedPerson | undefined {
  const people = readPeople();
  const idx = people.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  people[idx] = { ...people[idx], ...patch };
  if (patch.relationship) addRelationship(patch.relationship);
  writePeople(people);
  return people[idx];
}

export function deletePerson(id: string) {
  if (id === "self") return; // never delete the account owner
  writePeople(readPeople().filter((p) => p.id !== id));
}

/** Relationship list = defaults + any custom ones the user has added. */
export function getRelationships(): string[] {
  const custom = readCustomRelationships();
  const merged = [...DEFAULT_RELATIONSHIPS];
  for (const rel of custom) {
    if (!merged.some((m) => m.toLowerCase() === rel.toLowerCase())) {
      // insert custom relations before the trailing "Other"
      merged.splice(merged.length - 1, 0, rel);
    }
  }
  return merged;
}

function readCustomRelationships(): string[] {
  if (!isBrowser()) return [];
  const key = relationshipsKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRelationship(relationship: string) {
  if (!isBrowser()) return;
  const key = relationshipsKey();
  if (!key) return;
  const rel = relationship.trim();
  if (!rel) return;
  // Don't store the "Other" sentinel or anything already in defaults.
  if (DEFAULT_RELATIONSHIPS.some((d) => d.toLowerCase() === rel.toLowerCase())) return;
  const custom = readCustomRelationships();
  if (custom.some((c) => c.toLowerCase() === rel.toLowerCase())) return;
  localStorage.setItem(key, JSON.stringify([...custom, rel]));
  emitUpdate();
}

