import { useEffect, useMemo, useState } from "react";

type SwipeAction = "like" | "pass";

type SwipeActionMap = Record<string, SwipeAction>;

const STORAGE_KEY = "saju-swipe-actions-v1";

export function useSwipeActions() {
  const [actions, setActions] = useState<SwipeActionMap>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SwipeActionMap) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  }, [actions]);

  const likedCount = useMemo(
    () => Object.values(actions).filter((v) => v === "like").length,
    [actions]
  );

  const passedCount = useMemo(
    () => Object.values(actions).filter((v) => v === "pass").length,
    [actions]
  );

  const setLike = (cardId: string) => {
    setActions((prev) => ({ ...prev, [cardId]: "like" }));
  };

  const setPass = (cardId: string) => {
    setActions((prev) => ({ ...prev, [cardId]: "pass" }));
  };

  const clearAll = () => setActions({});

  return {
    actions,
    likedCount,
    passedCount,
    setLike,
    setPass,
    clearAll,
  };
}
