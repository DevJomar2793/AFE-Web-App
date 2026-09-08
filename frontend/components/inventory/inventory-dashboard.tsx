"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AddInventoryItemModal } from "@/components/inventory/add-inventory-item-modal";
import { EditInventoryItemModal } from "@/components/inventory/edit-inventory-item-modal";
import { EditSaleModal } from "@/components/inventory/edit-sale-modal";
import { useInventoryItems } from "@/components/inventory/use-inventory-items";
import { useReturns } from "@/components/inventory/use-returns";
import { useSales } from "@/components/inventory/use-sales";
import {
  InventoryBottomNavigation,
  InventoryHeader,
  InventorySidebar,
  type InventoryViewName,
} from "@/components/inventory/inventory-navigation";
import { InventoryList } from "@/components/inventory/inventory-list";
import { NewReturnModal } from "@/components/inventory/new-return-modal";
import { NewSaleModal } from "@/components/inventory/new-sale-modal";
import { InventoryOverview } from "@/components/inventory/overview";
import {
  RestockModal,
  type RestockFormValues,
} from "@/components/inventory/restock-modal";
import { ReturnsList } from "@/components/inventory/returns-list";
import { SalesActivity } from "@/components/inventory/sales-activity";
import {
  INVENTORY_STORAGE_KEY,
  initialLocalInventoryState,
  isLocalInventoryState,
  type LocalInventoryState,
} from "@/lib/local-inventory";
import type { InventoryItem, Sale } from "@/lib/api";

type Notice = {
  message: string;
  tone: "success" | "error";
};

export function InventoryDashboard() {
  const currentYear = new Date().getFullYear();

  // Overview and restock data are the original browser-local demo state.
  const [localInventory, setLocalInventory] = useState<LocalInventoryState>(
    initialLocalInventoryState,
  );
  const [currentView, setCurrentView] =
    useState<InventoryViewName>("overview");
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockItemId, setRestockItemId] = useState<string>();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] =
    useState<InventoryItem | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleInventoryItemId, setSaleInventoryItemId] = useState<number>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadedLocalInventory, setHasLoadedLocalInventory] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Inventory, sales, and returns below are loaded from the FastAPI database.
  const {
    items: databaseItems,
    isLoading: isInventoryLoading,
    error: inventoryError,
    retry: retryInventory,
  } = useInventoryItems(
    currentView === "inventory" || isNewSaleOpen || isNewReturnOpen,
  );
  const {
    sales: databaseSales,
    isLoading: areSalesLoading,
    error: salesError,
    retry: retrySales,
  } = useSales(currentView === "activity");
  const {
    returns: databaseReturns,
    isLoading: areReturnsLoading,
    error: returnsError,
    retry: retryReturns,
  } = useReturns(currentView === "returns");

  useEffect(() => {
    const loadSavedInventory = () => {
      try {
        const savedInventory = window.localStorage.getItem(
          INVENTORY_STORAGE_KEY,
        );

        if (savedInventory) {
          const parsedInventory: unknown = JSON.parse(savedInventory);
          if (isLocalInventoryState(parsedInventory)) {
            setLocalInventory(parsedInventory);
          }
        }
      } catch {
        setNotice({
          message: "Saved data could not be loaded. Showing starter inventory.",
          tone: "error",
        });
      } finally {
        setHasLoadedLocalInventory(true);
      }
    };

    const animationFrame = window.requestAnimationFrame(loadSavedInventory);

    const syncInventoryAcrossTabs = (event: StorageEvent) => {
      if (event.key !== INVENTORY_STORAGE_KEY || !event.newValue) return;

      try {
        const parsedInventory: unknown = JSON.parse(event.newValue);
        if (isLocalInventoryState(parsedInventory)) {
          setLocalInventory(parsedInventory);
        }
      } catch {
        // Ignore malformed values written outside the application.
      }
    };

    window.addEventListener("storage", syncInventoryAcrossTabs);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("storage", syncInventoryAcrossTabs);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalInventory) return;

    window.localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify(localInventory),
    );
  }, [hasLoadedLocalInventory, localInventory]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const saveRestock = ({
    itemId,
    quantity,
    note,
  }: RestockFormValues) => {
    const item = localInventory.items.find(
      (candidate) => candidate.id === itemId,
    );
    if (!item) return "Choose a valid inventory item.";
    if (!Number.isInteger(quantity) || quantity < 1) {
      return "Enter a whole quantity of at least one.";
    }
    const amount = item.cost * quantity;
    const transaction = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${itemId}`,
      type: "restock" as const,
      itemId,
      quantity,
      amount,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setLocalInventory((currentInventory) => ({
      items: currentInventory.items.map((inventoryItem) =>
        inventoryItem.id === itemId
          ? {
              ...inventoryItem,
              quantity: inventoryItem.quantity + quantity,
            }
          : inventoryItem,
      ),
      transactions: [transaction, ...currentInventory.transactions],
    }));
    setNotice({
      message: "New stock added to inventory.",
      tone: "success",
    });

    return null;
  };

  const selectView = (nextView: InventoryViewName) => {
    setCurrentView(nextView);
    setIsMenuOpen(false);
  };

  const openRestock = (itemId?: string) => {
    setRestockItemId(itemId);
    setIsRestockOpen(true);
  };

  const closeRestock = () => {
    setIsRestockOpen(false);
    setRestockItemId(undefined);
  };

  const openNewSale = (inventoryId?: number) => {
    setSaleInventoryItemId(inventoryId);
    setIsNewSaleOpen(true);
  };

  const closeNewSale = () => {
    setIsNewSaleOpen(false);
    setSaleInventoryItemId(undefined);
  };

  const handleInventoryItemCreated = () => {
    setIsAddItemOpen(false);
    retryInventory();
    setNotice({
      message: "Item successfully added to inventory.",
      tone: "success",
    });
  };

  const handleInventoryItemUpdated = () => {
    setEditingInventoryItem(null);
    retryInventory();
    setNotice({
      message: "Inventory item updated successfully.",
      tone: "success",
    });
  };

  const handleSaleCreated = () => {
    closeNewSale();
    retryInventory();
    retrySales();
    setNotice({
      message: "Sale saved and inventory updated.",
      tone: "success",
    });
  };

  const handleSaleUpdated = () => {
    setEditingSale(null);
    retryInventory();
    retrySales();
    setNotice({
      message: "Sale updated and inventory adjusted.",
      tone: "success",
    });
  };

  const handleReturnCreated = () => {
    setIsNewReturnOpen(false);
    retryInventory();
    retryReturns();
    setNotice({
      message: "Return saved and inventory updated.",
      tone: "success",
    });
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f1] text-[#18251a]">
      <InventorySidebar
        currentView={currentView}
        isMenuOpen={isMenuOpen}
        onCloseMenu={() => setIsMenuOpen(false)}
        onSelectView={selectView}
      />

      <div className="lg:pl-64">
        <InventoryHeader
          currentView={currentView}
          onOpenMenu={() => setIsMenuOpen(true)}
        />

        <main className="mx-auto max-w-375 px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10 lg:pt-8">
          {currentView === "overview" && (
            <InventoryOverview
              state={localInventory}
              onOpenRestock={openRestock}
              onOpenReturns={() => selectView("returns")}
              onOpenSale={() => openNewSale()}
              onViewActivity={() => selectView("activity")}
            />
          )}

          {currentView === "inventory" && (
            <InventoryList
              error={inventoryError}
              isLoading={isInventoryLoading}
              items={databaseItems}
              query={searchQuery}
              onAddItem={() => setIsAddItemOpen(true)}
              onEditItem={setEditingInventoryItem}
              onQueryChange={setSearchQuery}
              onOpenReturns={() => selectView("returns")}
              onRetry={retryInventory}
            />
          )}

          {currentView === "activity" && (
            <SalesActivity
              sales={databaseSales}
              error={salesError}
              isLoading={areSalesLoading}
              onAddSale={() => openNewSale()}
              onEdit={setEditingSale}
              onRetry={retrySales}
            />
          )}

          {currentView === "returns" && (
            <ReturnsList
              error={returnsError}
              isLoading={areReturnsLoading}
              returns={databaseReturns}
              onRetry={retryReturns}
              onOpenReturn={() => setIsNewReturnOpen(true)}
            />
          )}

          <footer className="mt-12 border-t border-[#d9dfd7] py-6 text-center text-sm text-[#667364]">
            © {currentYear} Adamos Fresh Eggs. Built by{" "}
            <span className="font-semibold text-[#173b24]">DevJomar</span>
          </footer>
        </main>
      </div>

      <InventoryBottomNavigation
        currentView={currentView}
        onSelectView={selectView}
      />

      {notice && <InventoryNotice notice={notice} />}

      {isNewSaleOpen && (
        <NewSaleModal
          initialInventoryId={saleInventoryItemId}
          inventoryError={inventoryError}
          isInventoryLoading={isInventoryLoading}
          items={databaseItems}
          onClose={closeNewSale}
          onCreated={handleSaleCreated}
          onRetryInventory={retryInventory}
        />
      )}

      {isNewReturnOpen && (
        <NewReturnModal
          inventoryError={inventoryError}
          isInventoryLoading={isInventoryLoading}
          items={databaseItems}
          onClose={() => setIsNewReturnOpen(false)}
          onCreated={handleReturnCreated}
          onRetryInventory={retryInventory}
        />
      )}

      {editingSale && (
        <EditSaleModal
          key={editingSale.id}
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onUpdated={handleSaleUpdated}
        />
      )}

      {editingInventoryItem && (
        <EditInventoryItemModal
          key={editingInventoryItem.id}
          item={editingInventoryItem}
          onClose={() => setEditingInventoryItem(null)}
          onUpdated={handleInventoryItemUpdated}
        />
      )}

      {isRestockOpen && (
        <RestockModal
          initialItemId={restockItemId}
          items={localInventory.items}
          onClose={closeRestock}
          onSave={saveRestock}
        />
      )}

      {isAddItemOpen && (
        <AddInventoryItemModal
          onClose={() => setIsAddItemOpen(false)}
          onCreated={handleInventoryItemCreated}
        />
      )}
    </div>
  );
}

function InventoryNotice({ notice }: { notice: Notice }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-20 z-80 flex w-[min(90vw,28rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-bold text-white shadow-xl ${
        notice.tone === "success" ? "bg-[#28643c]" : "bg-[#9b431f]"
      }`}
    >
      {notice.tone === "success" ? (
        <CheckCircle2 className="shrink-0" size={18} aria-hidden="true" />
      ) : (
        <TriangleAlert className="shrink-0" size={18} aria-hidden="true" />
      )}
      <span>{notice.message}</span>
    </div>
  );
}
