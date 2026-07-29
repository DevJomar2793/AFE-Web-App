"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShoppingBasket,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from "react";
import type { CustomerOrder } from "@/components/storefront/storefront-data";

const AUTOPLAY_DELAY = 5000;

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function subscribeToVisibility(onStoreChange: () => void) {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getVisibilitySnapshot() {
  return document.visibilityState === "hidden";
}

export function CustomerOrdersCarousel({
  orders,
}: {
  orders: CustomerOrder[];
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const isDocumentHidden = useSyncExternalStore(
    subscribeToVisibility,
    getVisibilitySnapshot,
    () => false,
  );
  const itemsPerPage = isDesktop ? 2 : 1;
  const pageCount = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const visiblePage = Math.min(currentPage, pageCount - 1);
  const isAutoPaused =
    isPaused ||
    isHovered ||
    hasFocusWithin ||
    prefersReducedMotion ||
    isDocumentHidden ||
    !isInViewport;

  const goToPreviousPage = () => {
    setCurrentPage((page) => {
      const safePage = Math.min(page, pageCount - 1);
      return (safePage - 1 + pageCount) % pageCount;
    });
  };

  const goToNextPage = useCallback(() => {
    setCurrentPage((page) => {
      const safePage = Math.min(page, pageCount - 1);
      return (safePage + 1) % pageCount;
    });
  }, [pageCount]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setHasFocusWithin(false);
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isAutoPaused || pageCount <= 1) return;

    const intervalId = window.setInterval(goToNextPage, AUTOPLAY_DELAY);
    return () => window.clearInterval(intervalId);
  }, [goToNextPage, isAutoPaused, pageCount]);

  return (
    <div
      ref={carouselRef}
      className="mt-12"
      role="region"
      aria-roledescription="carousel"
      aria-label="Recent customer orders"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocusWithin(true)}
      onBlur={handleBlur}
    >
      <div className="-mx-2.5 overflow-hidden">
        <div
          className={`flex ${prefersReducedMotion ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
          style={{ transform: `translate3d(-${visiblePage * 100}%, 0, 0)` }}
          aria-live={isAutoPaused ? "polite" : "off"}
        >
          {orders.map((order, index) => {
            const firstVisibleIndex = visiblePage * itemsPerPage;
            const isVisible =
              index >= firstVisibleIndex &&
              index < firstVisibleIndex + itemsPerPage;

            return (
              <div
                className="min-w-0 shrink-0 basis-full px-2.5 md:basis-1/2"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${orders.length}`}
                aria-hidden={!isVisible}
                key={order.customerName}
              >
                <article className="flex h-full min-h-80 flex-col border border-white/15 bg-[#fffdf7] p-7 text-[#18331f] shadow-[0_24px_60px_rgba(5,20,10,0.18)] sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-full bg-[#e3ebdc] text-[#173b24]">
                      <ShoppingBasket aria-hidden="true" size={22} />
                    </span>
                    <span className="bg-[#f0eadc] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#8f481b]">
                      {order.customerType}
                    </span>
                  </div>
                  <p className="eyebrow mt-8">Their order</p>
                  <p className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                    {order.quantity} × {order.productName}
                  </p>
                  <div className="mt-auto border-t border-[#ded9ca] pt-6">
                    <p className="font-black">{order.customerName}</p>
                    <p className="mt-1 text-sm text-[#687066]">
                      Adamos Fresh Eggs customer
                    </p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex items-center gap-2"
          aria-label="Choose an order page"
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              type="button"
              className={`h-2.5 transition-all ${
                visiblePage === index
                  ? "w-8 bg-[#f5bd78]"
                  : "w-2.5 bg-white/35 hover:bg-white/65"
              }`}
              aria-label={`Go to order page ${index + 1}`}
              aria-current={visiblePage === index ? "true" : undefined}
              onClick={() => setCurrentPage(index)}
              key={index}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!prefersReducedMotion && (
            <button
              type="button"
              className="grid size-11 place-items-center border border-white/30 text-white transition hover:border-[#f5bd78] hover:text-[#f5bd78]"
              aria-label={
                isPaused
                  ? "Resume automatic rotation"
                  : "Pause automatic rotation"
              }
              aria-pressed={isPaused}
              onClick={() => setIsPaused((paused) => !paused)}
            >
              {isPaused ? (
                <Play aria-hidden="true" size={18} />
              ) : (
                <Pause aria-hidden="true" size={18} />
              )}
            </button>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center border border-white/30 text-white transition hover:border-[#f5bd78] hover:text-[#f5bd78]"
            aria-label="Previous order page"
            onClick={goToPreviousPage}
          >
            <ChevronLeft aria-hidden="true" size={21} />
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center border border-white/30 text-white transition hover:border-[#f5bd78] hover:text-[#f5bd78]"
            aria-label="Next order page"
            onClick={goToNextPage}
          >
            <ChevronRight aria-hidden="true" size={21} />
          </button>
        </div>
      </div>
    </div>
  );
}
