import { Mail } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { BrandMark } from "@/components/storefront/brand-mark";
import { ContactForm } from "@/components/storefront/contact-form";
import { contactEmail } from "@/components/storefront/storefront-data";

const emailSteps = [
  {
    number: "01",
    title: "Share your request",
    description: "Enter your name and tell us what products you need.",
  },
  {
    number: "02",
    title: "Continue to email",
    description: "We prepare your message and open your email application.",
  },
  {
    number: "03",
    title: "Review and send",
    description: "Check the prepared message, then send it when you are ready.",
  },
];

export function SiteFooter() {
  return (
    <>
      <section
        id="contact"
        className="relative scroll-mt-20 overflow-hidden bg-[#173b24] px-5 py-20 text-white sm:px-8 lg:py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,189,120,0.12),transparent_34%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-20">
          <Reveal variant="left">
            <p className="eyebrow text-[#f5bd78]">Contact the farm</p>
            <h2 className="section-title mt-4 max-w-xl text-white">
              Let&apos;s talk about your next order.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#dce8d5]">
              Ask about product availability, local pickup, delivery, or repeat
              orders. Tell us what you need and your email app will prepare the
              message.
            </p>

            <a
              className="mt-8 flex max-w-xl items-center gap-4 border border-white/15 bg-white/[0.06] p-4 transition hover:border-[#f5bd78]/60 hover:bg-white/[0.1]"
              href={`mailto:${contactEmail}`}
            >
              <span className="grid size-11 shrink-0 place-items-center bg-[#f5bd78] text-[#173b24]">
                <Mail aria-hidden="true" size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#f5bd78]">
                  Email us directly
                </span>
                <span className="mt-1 block break-all font-bold text-white">
                  {contactEmail}
                </span>
              </span>
            </a>

            <ol className="mt-9 max-w-xl border-t border-white/15">
              {emailSteps.map((step) => (
                <li
                  className="flex gap-4 border-b border-white/15 py-4"
                  key={step.number}
                >
                  <span className="shrink-0 text-xs font-black tracking-[0.14em] text-[#f5bd78]">
                    {step.number}
                  </span>
                  <span>
                    <span className="block font-black text-white">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[#cbd8c8]">
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal variant="right" delay={100}>
            <ContactForm contactEmail={contactEmail} />
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#102819] px-5 py-7 text-[#cbd8c8] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <a
            href="#top"
            className="flex items-center gap-3 font-black uppercase tracking-[0.12em] text-white"
            aria-label="Adamos Fresh Eggs home"
          >
            <span className="grid size-10 place-items-center overflow-hidden rounded-full border border-white/20 bg-white">
              <BrandMark />
            </span>
            Adamos Fresh Eggs
          </a>
          <p>© 2026 Adamos Fresh Eggs. Pasture raised and locally packed.</p>
        </div>
      </footer>
    </>
  );
}
