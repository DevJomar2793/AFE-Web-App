"use client";

import { useCallback, useEffect, useState } from "react";
import { getActivityLogs, type ActivityLog } from "@/lib/api";

export function useActivityLogs(enabled: boolean) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    async function loadActivityLogs() {
      setIsLoading(true);
      setError("");

      try {
        const logs = await getActivityLogs(controller.signal);
        setActivityLogs(logs);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Activity logs could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadActivityLogs();
    return () => controller.abort();
  }, [enabled, requestVersion]);

  return { activityLogs, isLoading, error, retry };
}
