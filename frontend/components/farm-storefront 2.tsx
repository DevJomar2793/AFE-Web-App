"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Reveal } from "@/components/reveal";

type Product = {
  name: string;
  eyebrow: string;
  description: string;
  price: string;
  image: string;
  alt: string;
};

type PromiseItem = {
  title: string;
  text: string;
  icon: "hen" | "grain" | "barn";
};

type Testimonial = {
  quote: string;
  author: string;
  detail: string;
};

const products: Product[] = [
  {
    name: "Pasture-Raised Brown Eggs",
    eyebrow: "Best seller",
    description: "A dozen rich, sturdy-shelled eggs gathered from hens rotated across open pasture.",
    price: "$7.99",
    image: "/product-brown-eggs.png",
    alt: "Open carton of brown pasture-raised eggs on a wooden table",
  },
  {
    name: "Half-Dozen Heirloom Eggs",
    eyebrow: "Small batch",
    description: "Mixed cream, tan, and light brown eggs selected for weekend breakfasts and baking.",
    price: "$4.49",
    image: "/product-heirloom-eggs.png",
    alt: "Half-dozen tray of mixed heirloom eggs on rustic linen",
  },
  {
    name: "Farm-to-Table Subscription",
    eyebrow: "Weekly delivery",
    description: "Reserve a recurring crate of fresh eggs with flexible pickup or local delivery.",
    price: "$24/mo",
    image: "/product-subscription.png",
    alt: "Reusable crate filled with eggs and linen for a farm subscription",
  },
];

const promises: PromiseItem[] = [
  {
    title: "Pasture raised",
    text: "Our flocks roam rotated pasture with fresh air, forage, and room to move.",
    icon: "hen",
  },
  {
    title: "Clean feed",
    text: "Non-GMO grain, seasonal greens, and no shortcuts in the daily routine.",
    icon: "grain",
  },
  {
    title: "Local rhythm",
    text: "Eggs are gathered, packed, and prepared for nearby tables within the week.",
    icon: "barn",
  },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "The yolks are vibrant, the cartons arrive fresh, and the taste changed our weekend breakfasts completely.",
    author: "Sarah J.",
    detail: "Weekly subscriber",
  },
  {
    quote:
      "We switched to Adamos for the delivery window, but stayed for the flavor and the consistency.",
    author: "Miguel R.",
    detail: "Neighborhood pickup",
  },
  {
    quote:
      "The eggs hold up in baking and the farm updates make it feel like we know exactly where our food comes from.",
    author: "Alina P.",
    detail: "Home baker",
  },
];

const navItems = [
  { label: "Our Eggs", href: "#products" },
  { label: "Farm Life", href: "#farm" },
  { label: "Promise", href: "#promise" },
  { label: "Contact", href: "#contact" },
];

const contactEmail = "jomarcerrado2793@gmail.com";

export function FarmStorefront() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf3] pt-20 text-[#172516]">
      <SiteHeader />
      <HeroSection />
      <SectionBreak />
      <PromiseSection />
      <ProductsSection />
      <FarmLifeSection />
      <TestimonialSection />
      <SiteFooter />
      <BackToTopButton />
    </main>
  );
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 420);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-5 left-1/2 z-40 grid size-12 place-items-center rounded-full border border-[#f5bd78]/35 bg-[#173b24] text-[#fff8e8] shadow-[0_18px_44px_rgba(13,37,20,0.28)] transition duration-300 hover:bg-[#1f4b2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5bd78] ${
        isVisible
          ? "-translate-x-1/2 translate-y-0 opacity-100 hover:-translate-y-1"
          : "pointer-events-none -translate-x-1/2 translate-y-4 opacity-0"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="m6 14 6-6 6 6M12 9v8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) {
      return;
    }

    const updateActiveHref = () => {
      if (!hasInteractedRef.current) {
        setActiveHref(null);
        return;
      }

      const headerHeight = 80;
      const activeLine = headerHeight + 24;
      let bestSection: { id: string; score: number; top: number } | null = null;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const viewportTop = activeLine;
        const viewportBottom = window.innerHeight;
        const visibleTop = Math.max(rect.top, viewportTop);
        const visibleBottom = Math.min(rect.bottom, viewportBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight <= 0) {
          continue;
        }

        const score = visibleHeight / Math.max(rect.height, 1);
        const top = Math.abs(rect.top - activeLine);

        if (!bestSection || score > bestSection.score || (score === bestSection.score && top < bestSection.top)) {
          bestSection = { id: section.id, score, top };
        }
      }

      setActiveHref(bestSection ? `#${bestSection.id}` : null);
    };

    const scheduleUpdate = () => {
      hasInteractedRef.current = true;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        updateActiveHref();
        frameRef.current = null;
      });
    };

    const initializeActiveHref = () => {
      hasInteractedRef.current = false;
      scheduleUpdate();
      window.requestAnimationFrame(() => {
        scheduleUpdate();
      });
      window.setTimeout(scheduleUpdate, 0);
    };

    initializeActiveHref();
    window.addEventListener("load", initializeActiveHref);
    window.addEventListener("pageshow", initializeActiveHref);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("load", initializeActiveHref);
      window.removeEventListener("pageshow", initializeActiveHref);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-2xl transition-[background-color,border-color,box-shadow] duration-300 ${
        isScrolled
          ? "border-[#d9c8a8]/90 bg-[#fbfaf3]/96 shadow-[0_16px_50px_rgba(47,36,18,0.12)]"
          : "border-[#e8ddc7]/80 bg-[#fbfaf3]/82 shadow-[0_10px_40px_rgba(47,36,18,0.06)]"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a
          href="#"
          className="group flex items-center gap-3"
          aria-label="Adamos Fresh Eggs home"
          onClick={(event) => {
            event.preventDefault();
            hasInteractedRef.current = true;
            setActiveHref(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="grid size-11 place-items-center rounded-full bg-[#173b24] text-[#fff8e8] shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-105">
            <BrandMark />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-black uppercase tracking-[0.14em] text-[#18331f]">
              Adamos
            </span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#7b6b45]">
              Fresh Eggs
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#314430] md:flex">
          {navItems.map((item) => (
            <a
              aria-current={activeHref === item.href ? "location" : undefined}
              className="nav-link transition hover:text-[#c06f26] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className="hidden h-11 items-center justify-center rounded-full border border-[#cdbb95] bg-white/45 px-5 text-sm font-black text-[#21351f] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d27a2f] hover:text-[#b45f1e] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26] sm:inline-flex"
          href="#contact"
        >
          Contact farm
        </a>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-[#18331f]">
      <Reveal className="absolute inset-0 -z-20" variant="fade">
        <Image
          src="/hero-eggs-farm.png"
          alt="Bowl of fresh eggs on a farm table with a pasture and barn behind it"
          fill
          priority
          sizes="100vw"
          className="hero-ken-burns object-cover object-center"
        />
      </Reveal>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(245,189,120,0.24),transparent_25%),linear-gradient(90deg,rgba(12,32,17,0.94)_0%,rgba(13,37,20,0.76)_38%,rgba(13,37,20,0.28)_70%,rgba(13,37,20,0.04)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#fbfaf3] to-transparent" />
      <div className="mx-auto flex min-h-[760px] max-w-7xl items-center px-5 py-20 sm:px-8">
        <div className="max-w-2xl pt-8 text-white">
          <Reveal
            as="p"
            className="mb-5 inline-flex rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#ffe3ad] shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-md"
            variant="fade"
          >
            Gathered daily from open pasture
          </Reveal>
          <Reveal
            as="h1"
            className="max-w-2xl text-5xl font-black leading-[0.94] tracking-normal text-white [text-wrap:balance] sm:text-6xl lg:text-7xl"
          >
            Farm-fresh eggs with a richer kind of morning.
          </Reveal>
          <Reveal
            as="p"
            className="mt-6 max-w-xl text-lg leading-8 text-[#fff2d6] sm:text-xl"
            delay={120}
          >
            Pasture-raised, carefully packed, and delivered from our family farm to your table with
            honest flavor in every carton.
          </Reveal>
          <Reveal className="mt-9 flex flex-col gap-3 sm:flex-row" delay={220}>
            <a
              href="#farm"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/35 bg-white/10 px-7 text-base font-black text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Meet the farm
            </a>
          </Reveal>
          <Reveal
            as="dl"
            className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-white/20 pt-6 text-white"
            delay={320}
          >
            <Stat value="24h" label="packed fresh" />
            <Stat value="3k+" label="local orders" />
            <Stat value="4.9" label="farm rating" />
          </Reveal>
        </div>
      </div>
      <div className="float-soft absolute bottom-20 right-5 hidden max-w-[18rem] rounded-lg border border-white/18 bg-[#fffaf0]/92 p-5 text-[#173b24] shadow-[0_24px_70px_rgba(13,37,20,0.28)] backdrop-blur-xl lg:block">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b86728]">Today&apos;s batch</p>
        <p className="mt-2 text-2xl font-black">Collected at sunrise</p>
        <p className="mt-2 text-sm leading-6 text-[#5d5b49]">
          Washed, checked, and packed for local pickup by noon.
        </p>
      </div>
    </section>
  );
}

function SectionBreak() {
  return (
    <div aria-hidden="true" className="bg-[#fbfaf3] px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d7c6a1] to-transparent" />
        <span className="text-xs font-black uppercase tracking-[0.24em] text-[#8f7d57]">
          Our promise
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d7c6a1] to-transparent" />
      </div>
    </div>
  );
}

function PromiseSection() {
  return (
    <section id="promise" className="relative scroll-mt-32 border-t border-[#e1d3b7] bg-[#f7f1e2] px-5 py-20 sm:px-8 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7c6a1] to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal>
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#b86728]">
                Our promise
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-[#1d331f] sm:text-5xl">
                Better eggs start with better care.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d5b49] sm:text-lg sm:leading-8">
                Pasture, feed, and handling all shape what reaches your table. We keep those steps
                simple, visible, and consistent so the end result tastes clean and feels reliable.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80} variant="scale">
            <div className="rounded-lg border border-[#e1d3b7] bg-[#fffaf0] px-5 py-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f7d57]">
                What to expect
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#3b4a33]">
                Rotated pasture, clean feed, and local packing without the noise.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {promises.map((item, index) => (
            <Reveal
              as="article"
              className="group relative overflow-hidden rounded-lg border border-[#dccdaa] bg-[#fffaf0] p-6 shadow-[0_18px_48px_rgba(75,55,27,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#d2b67c] hover:shadow-[0_26px_60px_rgba(75,55,27,0.14)] sm:p-7"
              delay={index * 90}
              key={item.title}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f5bd78] via-[#d7c6a1] to-[#173b24]/65" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e8f0df] text-[#173b24] transition duration-300 group-hover:scale-105 group-hover:bg-[#173b24] group-hover:text-[#fff8e8]">
                    <PromiseIcon name={item.icon} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f7d57]">
                      0{index + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#1c331f]">{item.title}</h3>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[#5d5b49] sm:text-base">
                {item.text}
              </p>
              <div className="mt-6 flex items-center gap-2 border-t border-[#e6dcc7] pt-5 text-xs font-black uppercase tracking-[0.16em] text-[#7a6d55]">
                <span className="inline-flex size-2 rounded-full bg-[#f5bd78]" />
                Consistent quality
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section id="products" className="relative scroll-mt-24 bg-[#fbfaf3] px-5 py-24 sm:px-8">
      <div className="absolute left-1/2 top-14 -z-0 h-64 w-[38rem] -translate-x-1/2 rounded-full bg-[#f2d9a6]/35 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <Reveal className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Featured products"
            title="Choose your next carton."
            text="Fresh essentials for daily breakfast, weekend baking, and weekly delivery."
            align="left"
          />
          <a
            href="#contact"
            className="inline-flex h-12 w-fit items-center justify-center rounded-full border border-[#cdbb95] bg-white/50 px-5 text-sm font-black text-[#21351f] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d27a2f] hover:text-[#b45f1e] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26]"
          >
            Ask about local delivery
          </a>
        </Reveal>

        <div className="relative z-10 mt-12 grid gap-6 lg:grid-cols-3">
          {products.map((product, index) => (
            <Reveal key={product.name} delay={index * 110} variant="scale">
              <ProductCard imageDelay={120 + index * 120} product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ imageDelay, product }: { imageDelay: number; product: Product }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-[#e7dcc6] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#d9be89] hover:shadow-[0_28px_70px_rgba(75,55,27,0.16)]">
      <div
        className="image-load-frame relative aspect-[4/3]"
        style={{ "--image-delay": `${imageDelay}ms` } as CSSProperties}
      >
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="image-load-in object-cover transition duration-700 group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102819]/28 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <p className="absolute left-4 top-4 rounded-full bg-[#fffaf0]/92 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#b86728] shadow-sm backdrop-blur-md">
          {product.eyebrow}
        </p>
      </div>
      <div className="p-6">
        <div className="mt-3 flex items-start justify-between gap-4">
          <h3 className="text-xl font-black leading-tight text-[#18331f]">{product.name}</h3>
          <p className="rounded-full bg-[#f4eddc] px-3 py-1 text-sm font-black text-[#173b24] ring-1 ring-[#e1d3b7]">
            {product.price}
          </p>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#62604f]">{product.description}</p>
        <div className="mt-6 flex gap-3">
          <a
            href="#farm"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#d8c9ab] px-4 text-sm font-black text-[#263b23] transition hover:border-[#d27a2f] hover:text-[#b45f1e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26]"
          >
            Details
          </a>
        </div>
      </div>
    </article>
  );
}

function FarmLifeSection() {
  return (
    <section
      id="farm"
      className="relative scroll-mt-24 overflow-hidden bg-[#173b24] px-5 py-24 text-white sm:px-8"
    >
      <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#f5bd78]/12 blur-3xl" />
      <div className="absolute -right-28 bottom-16 h-72 w-72 rounded-full bg-[#e8f0df]/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal variant="left">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#f5bd78]">Farm life</p>
          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight text-white [text-wrap:balance] sm:text-5xl">
            Hens outside, farmers nearby, cartons packed with intention.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[#dfecd5]">
            We keep the routine small enough to watch closely: fresh pasture, clean nesting boxes,
            careful washing, and steady delivery windows for nearby households.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-bold text-[#f8ead0] sm:grid-cols-2">
            <CheckItem text="Rotated pasture access" />
            <CheckItem text="Reusable delivery crates" />
            <CheckItem text="Washed and packed on farm" />
            <CheckItem text="Weekly local availability" />
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal
            as="figure"
            className="group overflow-hidden rounded-lg border border-white/12 bg-white/8 shadow-[0_24px_70px_rgba(5,17,9,0.22)] transition duration-300 hover:-translate-y-2 hover:bg-white/12"
            variant="right"
          >
            <div
              className="image-load-frame relative aspect-[4/3]"
              style={{ "--image-delay": "180ms" } as CSSProperties}
            >
              <Image
                src="/farm-pasture.png"
                alt="Pasture-raised hens roaming in green grass"
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="image-load-in object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <figcaption className="p-4 text-sm font-bold text-[#eaf4de]">Open pasture rotation</figcaption>
          </Reveal>
          <Reveal
            as="figure"
            className="group overflow-hidden rounded-lg border border-white/12 bg-white/8 shadow-[0_24px_70px_rgba(5,17,9,0.22)] transition duration-300 hover:-translate-y-2 hover:bg-white/12 sm:mt-12"
            delay={120}
            variant="right"
          >
            <div
              className="image-load-frame relative aspect-[4/3]"
              style={{ "--image-delay": "320ms" } as CSSProperties}
            >
              <Image
                src="/family-farm.png"
                alt="Family farmers holding a basket of fresh eggs outdoors"
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="image-load-in object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <figcaption className="p-4 text-sm font-bold text-[#eaf4de]">Packed by our family team</figcaption>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className="bg-[#f4eddc] px-5 py-24 sm:px-8">
      <TestimonialCarousel />
    </section>
  );
}

function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const pauseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [isPaused, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current !== null) {
        window.clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % testimonials.length);
  };

  const pauseAutoplay = () => {
    setIsPaused(true);
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  const resumeAutoplay = () => {
    if (prefersReducedMotion) {
      return;
    }

    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
    }

    pauseTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
      pauseTimerRef.current = null;
    }, 900);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    resumeAutoplay();
  };

  return (
    <Reveal className="mx-auto max-w-4xl">
      <div
        className="rounded-lg border border-[#e1d3b7] bg-[#fffaf0]/72 px-6 py-12 shadow-[0_24px_70px_rgba(75,55,27,0.1)] backdrop-blur-md sm:px-12"
        onBlur={handleBlur}
        onFocusCapture={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
        onMouseEnter={pauseAutoplay}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToPrevious();
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            goToNext();
          }
        }}
        tabIndex={0}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b86728]">
              Customer testimonial
            </p>
            <p className="mt-2 text-sm font-medium text-[#7a6d55]">
              Auto-rotating reviews from nearby customers
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-[#d8c9ab] bg-white/70 text-[#263b23] transition hover:border-[#c06f26] hover:text-[#b45f1e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26]"
              onClick={goToPrevious}
              aria-label="Previous testimonial"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-[#d8c9ab] bg-white/70 text-[#263b23] transition hover:border-[#c06f26] hover:text-[#b45f1e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26]"
              onClick={goToNext}
              aria-label="Next testimonial"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div
          className="relative mt-8 min-h-[16rem] overflow-hidden"
          aria-live="polite"
          aria-roledescription="carousel"
        >
          {testimonials.map((testimonial, index) => {
            const isActive = index === activeIndex;
            const isBefore = index < activeIndex;
            const translateClass = isActive
              ? "translate-x-0 opacity-100"
              : isBefore
                ? "-translate-x-8 opacity-0"
                : "translate-x-8 opacity-0";

            return (
              <article
                aria-hidden={!isActive}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                  prefersReducedMotion ? "transition-none" : ""
                } ${translateClass}`}
                key={testimonial.author}
              >
                <div className="max-w-3xl text-center">
                  <blockquote className="text-3xl font-black leading-tight text-[#1d331f] [text-wrap:balance] sm:text-4xl">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <p className="mt-6 text-base font-bold text-[#69624d]">
                    {testimonial.author}, {testimonial.detail}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.author}
                type="button"
                className={`h-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c06f26] ${
                  index === activeIndex ? "w-8 bg-[#b86728]" : "w-2.5 bg-[#d8c9ab]"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Show testimonial ${index + 1}`}
                aria-pressed={index === activeIndex}
              />
            ))}
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b7d62]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-[#102819] px-5 py-14 text-[#dfead7] sm:px-8">
      <Reveal className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-[#f4eddc] text-[#173b24]">
                  <BrandMark />
                </span>
                <div>
                  <p className="font-black uppercase tracking-[0.14em] text-white">Adamos</p>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5bd78]">
                    Fresh Eggs
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[#b9c9af]">
                Pasture-raised eggs gathered with care for neighbors, home cooks, and breakfast people.
              </p>
            </div>

            <div className="grid gap-10 sm:grid-cols-2">
              <FooterColumn title="Navigate" items={["Our Eggs", "Farm Life", "Promise", "Contact"]} />
              <FooterColumn title="Market" items={["Pickup", "Delivery", "Subscriptions", "Wholesale"]} />
            </div>

            <address className="space-y-2 text-sm not-italic text-[#b9c9af] lg:mt-auto">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">Contact</h3>
              <p>{contactEmail}</p>
              <p>(555) 203-1936</p>
              <p>725 Adamos Farm Road</p>
            </address>
          </div>

          <ContactForm />
        </div>
      </Reveal>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs font-bold text-[#8fa186] sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Adamos Fresh Eggs. All rights reserved.</p>
        <p>Pasture raised. Locally packed. Fresh by design.</p>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  text: string;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b86728]">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-black leading-tight text-[#1d331f] sm:text-5xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-[#62604f]">{text}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-3xl font-black text-[#ffe0a4]">{value}</dt>
      <dd className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#f4ead5]">{label}</dd>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f5bd78] text-[#173b24]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none">
          <path
            d="m6 12.5 3.5 3.5L18.5 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{text}</span>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm font-semibold text-[#b9c9af]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim() || "Website visitor";
    const trimmedMessage = message.trim() || "No message provided.";
    const subject = encodeURIComponent(`Message from ${trimmedName}`);
    const body = encodeURIComponent(`Name: ${trimmedName}\n\nMessage:\n${trimmedMessage}`);

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="rounded-lg border border-white/12 bg-[#173b24] p-6 shadow-[0_24px_70px_rgba(5,17,9,0.22)] sm:p-7">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#f5bd78]">Send a message</p>
        <h3 className="text-2xl font-black leading-tight text-white">Write directly to {contactEmail}</h3>
        <p className="max-w-xl text-sm leading-6 text-[#d7e4cf]">
          Add your name and message, then your email app opens with everything ready to send.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-bold text-[#eaf4de]" htmlFor="contact-name">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 w-full rounded-lg border border-white/12 bg-white/6 px-4 text-sm text-white outline-none transition placeholder:text-[#91a38b] focus:border-[#f5bd78] focus:bg-white/10"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#eaf4de]" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-36 w-full resize-y rounded-lg border border-white/12 bg-white/6 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#91a38b] focus:border-[#f5bd78] focus:bg-white/10"
            placeholder="Write your message"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium leading-5 text-[#aec0a4]">
            This uses your default email app and keeps the message on your device until you send it.
          </p>
          <button
            type="submit"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#f5bd78] px-5 text-sm font-black text-[#173b24] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ffd59b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5bd78]"
          >
            Send message
          </button>
        </div>
      </form>
    </section>
  );
}

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-6" fill="none">
      <path
        d="M7 18c0-6 4.4-10.5 10.8-10.5 4.2 0 7.2 2.3 7.2 5.8 0 5.9-5.8 10.2-13.6 10.2H7V18Z"
        fill="currentColor"
      />
      <path
        d="M10 22.8c3.5-5.6 8-8.7 14.5-9.8"
        stroke="#f5bd78"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 21.8c2.5.4 4.3 1.2 5.7 3.3"
        stroke="#f5bd78"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PromiseIcon({ name }: { name: PromiseItem["icon"] }) {
  if (name === "grain") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8" fill="none">
        <path d="M16 27V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 10c-4 0-6-2-7-5 4 0 6 2 7 5Z" fill="currentColor" />
        <path d="M16 15c4 0 6-2 7-5-4 0-6 2-7 5Z" fill="currentColor" />
        <path d="M16 20c-4 0-6-2-7-5 4 0 6 2 7 5Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "barn") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8" fill="none">
        <path
          d="M6 27V13L16 6l10 7v14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M11 27v-8h10v8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8" fill="none">
      <path
        d="M8 21c0-5.5 4.2-9.5 10-9.5h3.2c2 0 3.8 1.7 3.8 3.8 0 5.3-5 9.7-11.4 9.7H8v-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M21 11V7l3 3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 25l-2 3M14 25l2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
