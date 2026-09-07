import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";

export function HeroSection() {
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
            Pasture-raised eggs, gathered with care and packed by a family farm
            for nearby tables.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <a className="button-primary" href="#orders">
              Customer orders
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a className="button-on-dark" href="#products">
              View our eggs
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-5 text-sm font-bold text-[#f4ead8] sm:mt-12">
            <span className="inline-flex items-center gap-2">
              <Check aria-hidden="true" size={16} /> Pasture access
            </span>
            <span className="inline-flex items-center gap-2">
              <Check aria-hidden="true" size={16} /> Clean feed
            </span>
            <span className="inline-flex items-center gap-2">
              <Check aria-hidden="true" size={16} /> Packed on farm
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
