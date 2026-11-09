"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getInventoryPriceHistory,
  type InventoryPriceHistory,
} from "@/lib/api";

export function usePriceHistory(enabled: boolean) {
  const [records, setRecords] = useState<InventoryPriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    async function loadPriceHistory() {
      setIsLoading(true);
      setError("");

      try {
        setRecords(await getInventoryPriceHistory(controller.signal));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Price history could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPriceHistory();
    return () => controller.abort();
  }, [enabled, requestVersion]);

  return { records, isLoading, error, retry };
}
