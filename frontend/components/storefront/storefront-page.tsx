import { BackToTopButton } from "@/components/storefront/back-to-top-button";
import { CustomerOrdersSection } from "@/components/storefront/customer-orders-section";
import { HeroSection } from "@/components/storefront/hero-section";
import { MissionVisionSection } from "@/components/storefront/mission-vision-section";
import { ProductsSection } from "@/components/storefront/products-section";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { navigationItems } from "@/components/storefront/data";

export function StorefrontPage() {
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
