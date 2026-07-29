import { Eye, Target } from "lucide-react";
import { Reveal } from "@/components/reveal";

export function MissionVisionSection() {
  return (
    <section id="promise" className="section-shell scroll-mt-24 bg-[#f9f7f0]">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">Purpose &amp; direction</p>
            <h2 className="section-title mt-4">
              Fresh eggs made accessible, today and tomorrow.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#5f675e] lg:justify-self-end">
            Our mission guides how we serve customers today. Our vision shapes
            how we grow alongside nearby communities.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal
            as="article"
            className="border border-[#dcd7ca] bg-white p-7 sm:p-9"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-[#e3ebdc] text-[#173b24]">
                <Target aria-hidden="true" size={23} />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#957549]">
                01
              </span>
            </div>
            <p className="eyebrow mt-8">What guides us</p>
            <h3 className="mt-3 text-3xl font-black text-[#1c331f]">
              Our Mission
            </h3>
            <p className="mt-5 text-base leading-8 text-[#60685f] sm:text-lg">
              Our mission is to provide high-quality eggs at affordable prices
              through convenient, reliable service. By delivering fresh eggs
              directly from our farm to your doorstep, we make farm-fresh
              quality easier to bring to your table.
            </p>
          </Reveal>

          <Reveal
            as="article"
            className="bg-[#173b24] p-7 text-white sm:p-9"
            delay={100}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-[#f5bd78] text-[#173b24]">
                <Eye aria-hidden="true" size={23} />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#f5bd78]">
                02
              </span>
            </div>
            <p className="eyebrow mt-8 text-[#f5bd78]">Where we are going</p>
            <h3 className="mt-3 text-3xl font-black">Our Vision</h3>
            <p className="mt-5 text-base leading-8 text-[#dce8d5] sm:text-lg">
              Our vision is to become a trusted fresh-egg supplier for
              businesses of every size and expand into neighboring towns
              through additional stores. We aim to make high-quality,
              affordable eggs more accessible while maintaining excellent
              customer service and dependable delivery.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
