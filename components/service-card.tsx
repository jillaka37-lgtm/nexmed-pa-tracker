import { ButtonLink } from "./ui/button";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/services";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col rounded-xl border border-divider bg-surface p-7 transition-colors hover:border-teal/50">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
          {service.duration_min} min
        </span>
        <span className="font-mono text-xl font-bold text-gold">
          {formatPrice(service.price_cents, service.currency)}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{service.description}</p>
      <ButtonLink
        href={`/book?service=${service.slug}`}
        className="mt-6 w-full"
      >
        Book now
      </ButtonLink>
    </div>
  );
}
