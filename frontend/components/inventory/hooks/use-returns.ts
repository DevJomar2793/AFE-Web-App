"use client";

import { useCallback, useEffect, useState } from "react";
import { getReturns, type DatabaseReturn } from "@/services/returns-api";

export function useReturns(enabled: boolean) {
  const [returns, setReturns] = useState<DatabaseReturn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const loadReturns = async () => {
      setIsLoading(true);
      setError("");

      try {
        const databaseReturns = await getReturns(controller.signal);
        setReturns(databaseReturns);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Database returns could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadReturns();
    return () => controller.abort();
  }, [enabled, requestVersion]);

  return { returns, isLoading, error, retry };
}
