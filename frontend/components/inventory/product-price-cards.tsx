import { PhilippinePeso } from "lucide-react";
import type { DatabaseInventoryItem } from "@/services/inventory-api";

type ProductPriceCardsProps = {
  items: DatabaseInventoryItem[];
  isLoading: boolean;
  hasError: boolean;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ProductPriceCards({
  items,
  isLoading,
  hasError,
}: ProductPriceCardsProps) {
  if (hasError) return null;

  return (
    <section className="mt-6" aria-labelledby="product-prices-title">
      <div>
        <h3 id="product-prices-title" className="text-lg font-black">
          Product prices
        </h3>
        <p className="mt-1 text-sm text-[#768178]">
          Current prices for all inventory products.
        </p>
      </div>

      {isLoading ? (
        <PriceCardsLoadingState />
      ) : items.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#e0e5de] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 font-extrabold text-[#26382a]">
                  {item.item}
                </p>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf5eb] text-[#39704a]">
                  <PhilippinePeso size={17} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-2xl font-black text-[#173b24]">
                {currency.format(item.price)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-[#e0e5de] bg-white p-6 text-center text-sm font-semibold text-[#7c867e]">
          No product prices are available yet.
        </p>
      )}
    </section>
  );
}

function PriceCardsLoadingState() {
  return (
    <div
      className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading product prices"
    >
      {[0, 1, 2].map((placeholder) => (
        <div
          className="h-30 animate-pulse rounded-2xl bg-[#e9ede7]"
          key={placeholder}
        />
      ))}
    </div>
  );
}
