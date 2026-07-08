import Image from "next/image";
import type { CSSProperties } from "react";
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

const navItems = [
  { label: "Our Eggs", href: "#products" },
  { label: "Farm Life", href: "#farm" },
  { label: "Promise", href: "#promise" },
  { label: "Contact", href: "#contact" },
];

export function FarmStorefront() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf3] text-[#172516]">
      <SiteHeader />
      <HeroSection />
      <PromiseSection />
      <ProductsSection />
      <FarmLifeSection />
      <TestimonialSection />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8ddc7]/80 bg-[#fbfaf3]/82 shadow-[0_10px_40px_rgba(47,36,18,0.06)] backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#" className="group flex items-center gap-3" aria-label="Adamos Fresh Eggs home">
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

function PromiseSection() {
  return (
    <section id="promise" className="relative bg-[#f4eddc] px-5 py-24 sm:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7c6a1] to-transparent" />
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            eyebrow="Our promise"
            title="Better eggs start with better care."
            text="The difference shows up in the yolk, the shell, and the way your breakfast tastes."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {promises.map((item, index) => (
            <Reveal
              as="article"
              className="group rounded-lg border border-[#e1d3b7] bg-[#fffaf0] p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d5b77d] hover:shadow-[0_22px_50px_rgba(75,55,27,0.12)]"
              delay={index * 90}
              key={item.title}
            >
              <span className="mb-6 grid size-14 place-items-center rounded-full bg-[#e8f0df] text-[#173b24] transition duration-300 group-hover:rotate-6 group-hover:scale-105 group-hover:bg-[#173b24] group-hover:text-[#fff8e8]">
                <PromiseIcon name={item.icon} />
              </span>
              <h3 className="text-xl font-black text-[#1c331f]">{item.title}</h3>
              <p className="mt-3 text-base leading-7 text-[#5d5b49]">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section id="products" className="relative bg-[#fbfaf3] px-5 py-24 sm:px-8">
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
    <section id="farm" className="relative overflow-hidden bg-[#173b24] px-5 py-24 text-white sm:px-8">
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
      <Reveal className="mx-auto max-w-4xl rounded-lg border border-[#e1d3b7] bg-[#fffaf0]/72 px-6 py-12 text-center shadow-[0_24px_70px_rgba(75,55,27,0.1)] backdrop-blur-md sm:px-12">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b86728]">
          Customer testimonial
        </p>
        <blockquote className="mt-5 text-3xl font-black leading-tight text-[#1d331f] [text-wrap:balance] sm:text-4xl">
          &ldquo;The yolks are vibrant, the cartons arrive fresh, and the taste changed our weekend
          breakfasts completely.&rdquo;
        </blockquote>
        <p className="mt-6 text-base font-bold text-[#69624d]">Sarah J., weekly subscriber</p>
      </Reveal>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer id="contact" className="bg-[#102819] px-5 py-14 text-[#dfead7] sm:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
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
        <FooterColumn title="Navigate" items={["Our Eggs", "Farm Life", "Promise", "Contact"]} />
        <FooterColumn title="Market" items={["Pickup", "Delivery", "Subscriptions", "Wholesale"]} />
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">Contact</h3>
          <address className="mt-4 space-y-2 text-sm not-italic text-[#b9c9af]">
            <p>hello@adamosfresh.test</p>
            <p>(555) 203-1936</p>
            <p>725 Adamos Farm Road</p>
          </address>
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
