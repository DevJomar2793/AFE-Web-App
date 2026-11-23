"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreAccessToken } from "@/lib/api";

interface DashboardAuthGuardProps {
  children: ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const hasSession = await restoreAccessToken();
      if (!isMounted) return;

      if (hasSession) setIsAuthorized(true);
      else router.replace("/login");
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isAuthorized) return null;

  return children;
}
