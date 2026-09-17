"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";

interface DashboardAuthGuardProps {
  children: ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const hasAccessToken = Boolean(getAccessToken());

  useEffect(() => {
    if (!hasAccessToken) {
      router.replace("/login");
    }
  }, [hasAccessToken, router]);

  if (!hasAccessToken) {
    return null;
  }

  return children;
}
