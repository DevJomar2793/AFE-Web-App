"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getInventoryItems,
  type DatabaseInventoryItem,
} from "@/services/inventory-api";

export function useInventoryItems(enabled: boolean) {
  const [items, setItems] = useState<DatabaseInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const loadInventory = async () => {
      setIsLoading(true);
      setError("");

      try {
        const inventoryItems = await getInventoryItems(controller.signal);
        setItems(inventoryItems);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Inventory could not be loaded. Check the API and try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadInventory();
    return () => controller.abort();
  }, [enabled, requestVersion]);

  return { items, isLoading, error, retry };
}
