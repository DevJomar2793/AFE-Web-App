import { BackToTopButton } from "@/components/storefront/back-to-top-button";
import { CustomerOrdersSection } from "@/components/storefront/sections/customer-orders-section";
import { HeroSection } from "@/components/storefront/sections/hero-section";
import { MissionVisionSection } from "@/components/storefront/sections/mission-vision-section";
import { ProductsSection } from "@/components/storefront/sections/products-section";
import { SiteFooter } from "@/components/storefront/sections/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { navigationItems } from "@/components/storefront/storefront-data";

export function FarmStorefront() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f9f7f0] pt-18 text-[#18251a]">
      <SiteHeader navigationItems={navigationItems} />
      <HeroSection />
      <MissionVisionSection />
      <ProductsSection />
      <CustomerOrdersSection />
      <SiteFooter />
      <BackToTopButton />
    </main>
  );
}
