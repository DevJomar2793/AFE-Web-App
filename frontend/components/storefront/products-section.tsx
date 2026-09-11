import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { products, type Product } from "@/components/storefront/data";
import { FadeIn } from "@/components/storefront/fade-in";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group overflow-hidden border border-[#dedbd2] bg-[#fdfcf8] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(30,45,31,0.12)]">
      <div className="relative aspect-4/3 overflow-hidden bg-[#efe6d2]">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black leading-tight text-[#18331f]">
          {product.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#62695f]">
          {product.description}
        </p>
      </div>
    </article>
  );
}

export function ProductsSection() {
  return (
    <section
      id="products"
      className="section-shell scroll-mt-24 border-t border-[#e1ddd2] bg-white"
    >
      <div className="mx-auto max-w-7xl">
        <FadeIn className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Our products</p>
            <h2 className="section-title mt-4">
              Everyday essentials for your kitchen.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#62695f]">
              Quality eggs and trusted pantry staples selected for households
              and local businesses.
            </p>
          </div>
          <a className="text-link" href="#contact">
            Ask about availability <ArrowRight aria-hidden="true" size={17} />
          </a>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <FadeIn key={product.name} delay={index * 100}>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
