"use client";

import { useCallback, useEffect, useState } from "react";
import { getPendingAccounts, type PendingAccount } from "@/lib/api";

export function usePendingAccounts(enabled: boolean) {
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  const removePendingAccount = useCallback((userId: number) => {
    setPendingAccounts((accounts) =>
      accounts.filter((account) => account.id !== userId),
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    async function loadPendingAccounts() {
      setIsLoading(true);
      setError("");

      try {
        const accounts = await getPendingAccounts(controller.signal);
        setPendingAccounts(accounts);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Pending accounts could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPendingAccounts();
    return () => controller.abort();
  }, [enabled, requestVersion]);

  return { pendingAccounts, isLoading, error, retry, removePendingAccount };
}
