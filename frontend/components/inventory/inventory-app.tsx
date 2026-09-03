"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AddInventoryItemSheet } from "@/components/inventory/add-inventory-item-sheet";
import { useInventoryItems } from "@/components/inventory/hooks/use-inventory-items";
import { InventoryActivity } from "@/components/inventory/inventory-activity";
import {
  InventoryBottomNavigation,
  InventoryHeader,
  InventorySidebar,
  type InventoryViewName,
} from "@/components/inventory/inventory-navigation";
import { InventoryOverview } from "@/components/inventory/inventory-overview";
import { InventoryView } from "@/components/inventory/inventory-view";
import {
  TransactionSheet,
  type TransactionAction,
  type TransactionFormValues,
} from "@/components/inventory/transaction-sheet";
import {
  INVENTORY_STORAGE_KEY,
  initialLocalInventoryState,
  isLocalInventoryState,
  type LocalInventoryState,
  type TransactionType,
} from "@/lib/local-inventory";

type Notice = {
  message: string;
  tone: "success" | "error";
};

export function InventoryApp() {
  const [localInventory, setLocalInventory] = useState<LocalInventoryState>(
    initialLocalInventoryState,
  );
  const [currentView, setCurrentView] =
    useState<InventoryViewName>("overview");
  const [transactionAction, setTransactionAction] =
    useState<TransactionAction | null>(null);
  const [transactionItemId, setTransactionItemId] = useState<string>();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadedLocalInventory, setHasLoadedLocalInventory] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const {
    items: databaseItems,
    isLoading: isInventoryLoading,
    error: inventoryError,
    retry: retryInventory,
  } = useInventoryItems(currentView === "inventory");

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

  const saveTransaction = ({
    itemId,
    quantity,
    customer,
    note,
  }: TransactionFormValues) => {
    if (!transactionAction) return "Choose a transaction type.";

    const item = localInventory.items.find(
      (candidate) => candidate.id === itemId,
    );
    if (!item) return "Choose a valid inventory item.";
    if (!Number.isInteger(quantity) || quantity < 1) {
      return "Enter a whole quantity of at least one.";
    }
    if (transactionAction === "sale" && quantity > item.quantity) {
      const unitLabel = item.quantity === 1 ? item.unit : `${item.unit}s`;
      return `Only ${item.quantity} ${unitLabel} available.`;
    }

    const transactionType: TransactionType = transactionAction;
    const amount =
      (transactionType === "restock" ? item.cost : item.price) * quantity;
    const quantityChange = transactionType === "sale" ? -quantity : quantity;
    const transaction = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${itemId}`,
      type: transactionType,
      itemId,
      quantity,
      amount,
      customer: customer.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setLocalInventory((currentInventory) => ({
      items: currentInventory.items.map((inventoryItem) =>
        inventoryItem.id === itemId
          ? {
              ...inventoryItem,
              quantity: inventoryItem.quantity + quantityChange,
            }
          : inventoryItem,
      ),
      transactions: [transaction, ...currentInventory.transactions],
    }));
    setNotice({
      message: getTransactionSuccessMessage(transactionType),
      tone: "success",
    });

    return null;
  };

  const selectView = (nextView: InventoryViewName) => {
    setCurrentView(nextView);
    setIsMenuOpen(false);
  };

  const openTransaction = (
    action: TransactionAction,
    itemId?: string,
  ) => {
    setTransactionItemId(itemId);
    setTransactionAction(action);
  };

  const closeTransaction = () => {
    setTransactionAction(null);
    setTransactionItemId(undefined);
  };

  const handleInventoryItemCreated = () => {
    setIsAddItemOpen(false);
    retryInventory();
    setNotice({
      message: "Item successfully added to inventory.",
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
          onOpenReturn={() => openTransaction("return")}
          onOpenSale={() => openTransaction("sale")}
        />

        <main className="mx-auto max-w-375 px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10 lg:pt-8">
          {currentView === "overview" && (
            <InventoryOverview
              state={localInventory}
              onOpenAction={openTransaction}
              onViewActivity={() => selectView("activity")}
            />
          )}

          {currentView === "inventory" && (
            <InventoryView
              error={inventoryError}
              isLoading={isInventoryLoading}
              items={databaseItems}
              query={searchQuery}
              onAddItem={() => setIsAddItemOpen(true)}
              onQueryChange={setSearchQuery}
              onRetry={retryInventory}
            />
          )}

          {currentView === "activity" && (
            <InventoryActivity state={localInventory} />
          )}
        </main>
      </div>

      <InventoryBottomNavigation
        currentView={currentView}
        onSelectView={selectView}
      />

      {notice && <InventoryNotice notice={notice} />}

      {transactionAction && (
        <TransactionSheet
          action={transactionAction}
          initialItemId={transactionItemId}
          items={localInventory.items}
          onClose={closeTransaction}
          onSave={saveTransaction}
        />
      )}

      {isAddItemOpen && (
        <AddInventoryItemSheet
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

function getTransactionSuccessMessage(type: TransactionType) {
  if (type === "sale") return "Sale saved and inventory updated.";
  if (type === "return") return "Return saved and stock restored.";
  return "New stock added to inventory.";
}
