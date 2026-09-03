"use client";

import { useCallback, useEffect, useState } from "react";
import { getSales, type DatabaseSale } from "@/services/sales-api";

export function useSales(enabled: boolean) {
  const [sales, setSales] = useState<DatabaseSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const loadSales = async () => {
      setIsLoading(true);
      setError("");

      try {
        const databaseSales = await getSales(controller.signal);
        setSales(databaseSales);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Database sales could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadSales();
    return () => controller.abort();
  }, [enabled, requestVersion]);

  return { sales, isLoading, error, retry };
}
