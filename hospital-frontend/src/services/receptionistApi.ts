import api from "./api";

export interface ReceptionistProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  shift_start: string;
  shift_end: string;
  hospitalName: string;
  branchName: string;
}

/** Build a minimal profile from the auth cookie when the profile API is unavailable. */
export function profileFromAuthUser(user: {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  uid?: string;
} | null): ReceptionistProfile | null {
  if (!user?.email && !user?.displayName) return null;
  return {
    id: "",
    userId: user.uid ?? "",
    name: user.displayName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    role: "RECEPTIONIST",
    status: "Active",
    shift_start: "",
    shift_end: "",
    hospitalName: "",
    branchName: "",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getWithRetry<T>(url: string, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await api.get<T>(url);
      return data;
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { response?: { status?: number } })?.response?.status;
      const retryable = !status || status >= 500;
      if (!retryable || i === attempts - 1) break;
      await sleep(600 * (i + 1));
    }
  }
  throw lastErr;
}

export const receptionistApi = {
  getMyProfile: async (): Promise<ReceptionistProfile> => {
    const data = await getWithRetry<{ data: ReceptionistProfile }>("/receptionist/profile");
    if (!data?.data) {
      throw new Error("Invalid profile response from server");
    }
    return data.data;
  },

  updateMyProfile: async (payload: { name: string; phone?: string }): Promise<ReceptionistProfile> => {
    const { data } = await api.patch<{ data: ReceptionistProfile }>("/receptionist/profile", payload);
    return data.data;
  },
};

/** Split a full name into first + last for the settings form. */
export function splitFullName(fullName: string) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function joinFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function formatRoleLabel(role: string) {
  if (!role) return "Receptionist";
  const normalized = role.replace(/_/g, " ").toLowerCase();
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function profileInitials(name: string) {
  return (name || "R")
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Receptionist")}&background=0D8B96&color=fff&size=128`;
}
