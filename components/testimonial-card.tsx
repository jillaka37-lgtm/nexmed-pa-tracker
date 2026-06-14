type Testimonial = {
  name: string;
  role: string;
  rating: number;
  content: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${i < rating ? "fill-gold" : "fill-divider"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79L1.58 7.62l5.82-.85L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-divider bg-surface p-7">
      <Stars rating={testimonial.rating} />
      <blockquote className="mt-4 flex-1 font-serif text-sm leading-relaxed text-offwhite/90">
        &ldquo;{testimonial.content}&rdquo;
      </blockquote>
      <figcaption className="mt-5 border-t border-divider pt-4">
        <p className="text-sm font-semibold text-offwhite">{testimonial.name}</p>
        <p className="text-xs text-muted">{testimonial.role}</p>
      </figcaption>
    </figure>
  );
}
