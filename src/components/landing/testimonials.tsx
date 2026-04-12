const testimonials = [
  {
    quote:
      "As an Ontario landlord, compliance is my biggest headache. TenantPorch automated my standard lease agreements and saved me hours of legal research.",
    name: "Marcus Thorne",
    title: "Owner, Thorne Properties (Toronto)",
    initials: "MT",
  },
  {
    quote:
      "Rent collection is finally seamless. The CAD formatting and strong vertical alignment of financial data makes it so easy to see my cash flow at a glance.",
    name: "Elena Rodriguez",
    title: "Property Manager (Vancouver)",
    initials: "ER",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-24 px-6 max-w-7xl mx-auto">
      <h2 className="font-headline text-2xl md:text-3xl font-bold text-center text-primary mb-12 md:mb-16 italic max-w-3xl mx-auto">
        &ldquo;The editorial interface makes my monthly reports feel like a
        high-end portfolio presentation.&rdquo;
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="bg-surface-container-low p-8 md:p-10 rounded-xl relative"
          >
            <span className="absolute -top-5 left-4 text-8xl md:text-9xl font-headline font-bold text-secondary/10 leading-none select-none" aria-hidden="true">
              &ldquo;
            </span>
            <p className="text-base md:text-lg text-on-surface-variant leading-relaxed mb-6">
              {t.quote}
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
                {t.initials}
              </div>
              <div>
                <p className="font-bold text-primary">{t.name}</p>
                <p className="text-sm text-on-surface-variant">{t.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
