import { useEffect, useState } from "react";
import type { UserProfileInput } from "../types/saju";

const STORAGE_KEY = "saju-me-v1";

export function usePersistedProfile() {
  const [profile, setProfile] = useState<UserProfileInput | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserProfileInput) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  return { profile, setProfile };
}
