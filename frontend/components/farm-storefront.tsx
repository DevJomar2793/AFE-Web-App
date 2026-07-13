import Image from "next/image";
import { ArrowRight, Check, Mail, Sprout, Wheat } from "lucide-react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/reveal";
import { BackToTopButton } from "@/components/storefront/back-to-top-button";
import { BrandMark } from "@/components/storefront/brand-mark";
import { ContactForm } from "@/components/storefront/contact-form";
import { SiteHeader } from "@/components/storefront/site-header";
import {
  contactEmail,
  navigationItems,
  products,
  type Product,
} from "@/components/storefront/storefront-data";

export function FarmStorefront() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f9f7f0] pt-18 text-[#18251a]">
      <SiteHeader navigationItems={navigationItems} />
      <HeroSection />
      <PromiseSection />
      <ProductsSection />
      <FarmLifeSection />
      <SiteFooter />
      <BackToTopButton />
    </main>
  );
}

function HeroSection() {
  return (
    <section
      id="top"
      className="relative min-h-[calc(100svh-4.5rem)] overflow-hidden bg-[#173b24]"
    >
      <Image
        src="/hero-eggs-farm.png"
        alt="Bowl of fresh eggs on a farm table with a pasture and barn behind it"
        fill
        priority
        sizes="100vw"
        className="hero-ken-burns object-cover object-[62%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,32,17,0.94)_0%,rgba(13,38,20,0.78)_42%,rgba(13,38,20,0.22)_78%,rgba(13,38,20,0.08)_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-7xl items-center px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="max-w-2xl text-white">
          <p className="eyebrow text-[#ffd59c]">Adamos Fresh Eggs</p>
          <h1 className="mt-4 text-4xl font-black leading-[0.98] sm:mt-5 sm:text-6xl lg:text-7xl">
            A better morning starts at the farm.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#f6edd9] sm:mt-6 sm:text-xl sm:leading-8">
            Pasture-raised eggs, gathered with care and packed by a family farm for nearby tables.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <a className="button-primary" href="#farm">
              Our farm
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a className="button-on-dark" href="#products">View our eggs</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-5 text-sm font-bold text-[#f4ead8] sm:mt-12">
            <span className="inline-flex items-center gap-2"><Check size={16} /> Pasture access</span>
            <span className="inline-flex items-center gap-2"><Check size={16} /> Clean feed</span>
            <span className="inline-flex items-center gap-2"><Check size={16} /> Packed on farm</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromiseSection() {
  const promises = [
    {
      icon: Sprout,
      title: "Room to roam",
      text: "Our flocks move through open pasture with fresh air, forage, and space to behave naturally.",
    },
    {
      icon: Wheat,
      title: "Thoughtful feed",
      text: "Non-GMO grain and seasonal greens support a steady, transparent daily routine.",
    },
    {
      icon: Check,
      title: "Careful handling",
      text: "Eggs are gathered, checked, washed, and packed on the farm for local availability.",
    },
  ];

  return (
    <section id="promise" className="section-shell scroll-mt-24 bg-[#f9f7f0]">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">Our promise</p>
            <h2 className="section-title mt-4">Good eggs begin with how hens are raised.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#5f675e] lg:justify-self-end">
            We keep the process close and understandable, from pasture and feed to the carton that
            reaches your kitchen.
          </p>
        </Reveal>
        <div className="mt-12 grid border-y border-[#dcd7ca] md:grid-cols-3">
          {promises.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal
                as="article"
                className="border-[#dcd7ca] py-8 md:px-8 md:first:pl-0 md:last:pr-0 md:not-first:border-l"
                delay={index * 80}
                key={item.title}
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-[#e3ebdc] text-[#173b24]">
                    <Icon size={21} />
                  </span>
                  <span className="text-xs font-black uppercase text-[#957549]">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-2xl font-black text-[#1c331f]">{item.title}</h3>
                <p className="mt-3 leading-7 text-[#60685f]">{item.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section
      id="products"
      className="section-shell scroll-mt-24 border-t border-[#e1ddd2] bg-white"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">From our farm</p>
            <h2 className="section-title mt-4">Eggs for the way you cook.</h2>
            <p className="mt-4 text-lg leading-8 text-[#62695f]">
              Everyday dozens, smaller batches, and a recurring option for regular tables.
            </p>
          </div>
          <a className="text-link" href="#contact">
            Ask about availability <ArrowRight size={17} />
          </a>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {products.map((product, index) => (
            <Reveal key={product.name} delay={index * 90} variant="scale">
              <ProductCard product={product} imageDelay={100 + index * 100} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, imageDelay }: { product: Product; imageDelay: number }) {
  return (
    <article className="group overflow-hidden border border-[#dedbd2] bg-[#fdfcf8] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(30,45,31,0.12)]">
      <div
        className="image-load-frame relative aspect-[4/3]"
        style={{ "--image-delay": `${imageDelay}ms` } as CSSProperties}
      >
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="image-load-in object-cover transition duration-700 group-hover:scale-105"
        />
        <p className="absolute left-4 top-4 bg-[#fffdf7]/94 px-3 py-1.5 text-xs font-black uppercase text-[#9b5522] shadow-sm">
          {product.eyebrow}
        </p>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-black leading-tight text-[#18331f]">{product.name}</h3>
          <p className="shrink-0 font-black text-[#a85620]">{product.price}</p>
        </div>
        <p className="mt-3 min-h-18 text-sm leading-6 text-[#62695f]">{product.description}</p>
        <a className="text-link mt-5 border-t border-[#e1ddd2] pt-5" href="#contact">
          Check availability <ArrowRight size={16} />
        </a>
      </div>
    </article>
  );
}

function FarmLifeSection() {
  return (
    <section id="farm" className="scroll-mt-24 bg-[#173b24] text-white">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
        <div className="flex items-center px-5 py-20 sm:px-8 lg:px-16 lg:py-24">
          <Reveal variant="left">
            <p className="eyebrow text-[#f5bd78]">A visible routine</p>
            <h2 className="section-title mt-4 max-w-xl text-white">
              Close to the flock. Careful with every carton.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#dce8d5]">
              Keeping the farm personal means we can watch the details: pasture rotation, clean
              nesting boxes, careful washing, and dependable local availability.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {["Rotated pasture", "Clean nesting boxes", "Packed on farm", "Local availability"].map(
                (item) => (
                  <span
                    className="flex items-center gap-3 text-sm font-bold text-[#f6eddb]"
                    key={item}
                  >
                    <Check className="text-[#f5bd78]" size={18} /> {item}
                  </span>
                ),
              )}
            </div>
          </Reveal>
        </div>
        <Reveal className="grid min-h-[32rem] grid-cols-2" variant="right">
          <div className="relative">
            <Image
              src="/farm-pasture.png"
              alt="Pasture-raised hens roaming in green grass"
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="relative">
            <Image
              src="/family-farm.png"
              alt="Family farmers holding a basket of fresh eggs outdoors"
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-[#f0eadc] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="eyebrow">Contact the farm</p>
            <h2 className="section-title mt-4">Start a conversation about fresh eggs.</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-[#5f675e]">
              Ask about current availability, local pickup, delivery, or recurring cartons. We reply
              directly by email.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-3 font-black text-[#173b24] underline decoration-[#d28a4e] decoration-2 underline-offset-4"
              href={`mailto:${contactEmail}`}
            >
              <Mail size={19} /> {contactEmail}
            </a>
          </div>
          <ContactForm contactEmail={contactEmail} />
        </Reveal>
        <div className="mt-16 flex flex-col gap-5 border-t border-[#d4cbb8] pt-7 text-sm text-[#697066] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 font-black uppercase tracking-[0.12em] text-[#18331f]">
            <span className="grid size-9 place-items-center rounded-full bg-[#173b24] text-white">
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
