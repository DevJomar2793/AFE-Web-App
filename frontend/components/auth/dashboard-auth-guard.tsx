"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";

interface DashboardAuthGuardProps {
  children: ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      const timeout = window.setTimeout(() => setIsAuthorized(true), 0);
      return () => window.clearTimeout(timeout);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!isAuthorized) return null;

  return children;
}
