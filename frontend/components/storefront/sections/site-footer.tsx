import { Mail } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { BrandMark } from "@/components/storefront/brand-mark";
import { ContactForm } from "@/components/storefront/contact-form";
import { contactEmail } from "@/components/storefront/storefront-data";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="scroll-mt-20 bg-[#f0eadc] px-5 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="eyebrow">Contact the farm</p>
            <h2 className="section-title mt-4">
              Start a conversation about fresh eggs.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-[#5f675e]">
              Ask about current availability, local pickup, delivery, or
              recurring cartons. We reply directly by email.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-3 font-black text-[#173b24] underline decoration-[#d28a4e] decoration-2 underline-offset-4"
              href={`mailto:${contactEmail}`}
            >
              <Mail aria-hidden="true" size={19} /> {contactEmail}
            </a>
          </div>
          <ContactForm contactEmail={contactEmail} />
        </Reveal>

        <div className="mt-16 flex flex-col gap-5 border-t border-[#d4cbb8] pt-7 text-sm text-[#697066] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 font-black uppercase tracking-[0.12em] text-[#18331f]">
            <span className="grid size-10 place-items-center overflow-hidden rounded-full border border-[#d4cbb8] bg-white">
              <BrandMark />
            </span>
            Adamos Fresh Eggs
          </div>
          <p>© 2026 Adamos Fresh Eggs. Pasture raised and locally packed.</p>
        </div>
      </div>
    </footer>
  );
}
