import { Reveal } from "@/components/reveal";
import { CustomerOrdersCarousel } from "@/components/storefront/customer-orders-carousel";
import { customerOrders } from "@/components/storefront/storefront-data";

export function CustomerOrdersSection() {
  return (
    <section
      id="orders"
      className="scroll-mt-24 bg-[#173b24] px-5 py-20 text-white sm:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow text-[#f5bd78]">Customer orders</p>
            <h2 className="section-title mt-4 max-w-xl text-white">
              Fresh eggs chosen by nearby tables.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#dce8d5] lg:justify-self-end">
            From households to local businesses, see the egg sizes our
            customers are ordering from Adamos Fresh Eggs.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <CustomerOrdersCarousel orders={customerOrders} />
        </Reveal>
      </div>
    </section>
  );
}
