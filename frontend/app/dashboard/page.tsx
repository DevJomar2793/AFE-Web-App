import type { Metadata } from "next";
import { InventoryApp } from "@/components/inventory/inventory-app";

export const metadata: Metadata = {
  title: "Inventory Dashboard | Adamos Fresh Eggs",
  description: "Monitor inventory, sales, returns, and stock levels.",
};

export default function DashboardPage() {
  return <InventoryApp />;
}
