import type { Metadata } from "next";
import { DashboardAuthGuard } from "@/components/auth/dashboard-auth-guard";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";

export const metadata: Metadata = {
  title: "Inventory Dashboard | Adamos Fresh Eggs",
  description: "Monitor inventory, sales, returns, and stock levels.",
};

export default function DashboardPage() {
  return (
    <DashboardAuthGuard>
      <InventoryDashboard />
    </DashboardAuthGuard>
  );
}
