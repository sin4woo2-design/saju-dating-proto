import { useCallback, useRef, useState } from "react";

export function useTransientMessage(durationMs = 2200) {
  const [message, setMessage] = useState("");
  const timerRef = useRef<number | null>(null);

  const showMessage = useCallback((value: string) => {
    setMessage(value);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setMessage("");
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  return { message, showMessage };
}
