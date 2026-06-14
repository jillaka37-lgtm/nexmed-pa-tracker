import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { AddToCart } from "@/components/cart/add-to-cart";
import { CategoryIcon } from "@/components/category-icon";
import { getActiveProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop over-the-counter health products, vitamins, and devices from NexMed, with pickup or delivery.",
};

export default async function ShopPage() {
  const products = await getActiveProducts();
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div>
      {/* Hero banner */}
      <div className="relative overflow-hidden min-h-[260px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/5995055/pexels-photo-5995055.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/30" />
        <div className="relative mx-auto max-w-6xl w-full px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            Pharmacy shop
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl text-white">
            Health &amp; wellness products
          </h1>
          <p className="mt-4 max-w-xl text-lg text-offwhite/80">
            Over-the-counter medicines, vitamins, and everyday health essentials.
            Prescription items are reviewed by our pharmacist before fulfilment.
          </p>
        </div>
      </div>

    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/8669899/pexels-photo-8669899.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/97 via-navy/93 to-navy/85" />
    <div className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="flex gap-10 items-start">

        {/* Left: product grid */}
        <div className="flex-1 min-w-0">
      {categories.map((category) => (
        <section key={category} id={category} className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-5 w-1 rounded-full bg-teal" />
            <h2 className="text-xl font-bold text-white">{category}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {products
              .filter((p) => p.category === category)
              .map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-divider bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-teal/50 hover:shadow-xl hover:shadow-teal/5"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-teal/10 via-card to-navy flex items-center justify-center">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <CategoryIcon category={p.category} className="h-14 w-14 text-teal/60 transition-transform duration-300 group-hover:scale-110" />
                    )}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    {p.requires_rx && (
                      <span className="absolute top-3 right-3 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold backdrop-blur">Rx</span>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-navy/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-teal backdrop-blur">{p.category}</span>
                  </div>
                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-white leading-snug">{p.name}</h3>
                    <p className="mt-1.5 flex-1 text-xs text-muted leading-relaxed">{p.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-mono text-lg font-bold text-gold">{formatPrice(p.price_cents, p.currency)}</span>
                      {p.requires_rx ? (
                        <ButtonLink href="/refill" size="sm" variant="outline">Request via Rx</ButtonLink>
                      ) : (
                        <AddToCart item={{ slug: p.slug, name: p.name, price_cents: p.price_cents, currency: p.currency, requires_rx: p.requires_rx }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}

        </div>{/* end product list */}

        {/* Right: sidebar */}
        <aside className="hidden lg:flex flex-col gap-5 w-64 shrink-0 sticky top-24">

          {/* Pharmacist image card */}
          <div className="relative overflow-hidden rounded-2xl border border-divider h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/6940852/pexels-photo-6940852.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Pharmacist"
              className="h-full w-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-sm font-bold text-white">Expert guidance</p>
              <p className="mt-0.5 text-xs text-offwhite/70">Our pharmacists are here to help you find the right product.</p>
            </div>
          </div>

          {/* Need a prescription? */}
          <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5">
            <h3 className="text-sm font-bold text-white">Need a prescription?</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">Our pharmacist reviews every refill request personally.</p>
            <a href="/refill" className="mt-4 flex items-center justify-center rounded-xl bg-teal px-4 py-2 text-xs font-bold text-navy hover:brightness-110 transition-all">
              Request a refill
            </a>
          </div>

          {/* Talk to a pharmacist */}
          <div className="rounded-2xl border border-divider bg-surface p-5">
            <h3 className="text-sm font-bold text-white">Talk to a pharmacist</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">Have a question about a product? Book a free 10-minute chat.</p>
            <a href="/book" className="mt-4 flex items-center justify-center rounded-xl border border-teal/40 px-4 py-2 text-xs font-semibold text-teal hover:bg-teal/10 transition-all">
              Book consultation
            </a>
          </div>

        </aside>

      </div>{/* end flex */}
    </div>
    </div>
    </div>
  );
}
