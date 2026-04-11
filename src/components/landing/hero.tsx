import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface py-20 md:py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — Copy */}
        <div className="space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            Trusted across Canada
          </div>

          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary tracking-tight leading-[1.1]">
            Property Management{" "}
            <span className="text-secondary">Made Simple</span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-lg font-light leading-relaxed">
            Built for Canadian landlords. Province-compliant. Tenant-friendly.
            Manage your portfolio with architectural precision.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
            >
              Start Free
            </Link>
            <a
              href="#pricing"
              className="px-8 py-4 bg-secondary-fixed text-on-secondary-fixed rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              See Pricing
            </a>
          </div>

          <div className="flex gap-3 pt-2">
            {["AB", "ON", "BC"].map((prov) => (
              <span
                key={prov}
                className="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase rounded-full tracking-widest"
              >
                {prov}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Dashboard preview */}
        <div className="relative">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-2xl shadow-primary/5 transform lg:rotate-2 border border-outline-variant/10">
            {/* Mock dashboard */}
            <div className="rounded-lg bg-surface-container-low p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Portfolio Overview
                  </p>
                  <p className="text-2xl font-bold text-primary font-headline">
                    CAD $12,450
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Monthly revenue
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-tertiary-fixed/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim">
                    trending_up
                  </span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end gap-2 h-20">
                {[40, 55, 35, 65, 50, 72, 60, 80, 68, 75, 85, 90].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t"
                      style={{
                        height: `${h}%`,
                        backgroundColor:
                          i === 11
                            ? "var(--color-secondary, #7b5804)"
                            : "var(--color-primary-container, #1b2a4a)",
                      }}
                    />
                  )
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Properties", value: "8" },
                  { label: "Tenants", value: "14" },
                  { label: "Collected", value: "96%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-surface-container-lowest rounded-lg p-3 text-center"
                  >
                    <p className="text-lg font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating payment card */}
          <div className="absolute -bottom-6 -left-4 md:-left-8 bg-surface-container-lowest p-4 md:p-6 rounded-xl shadow-xl border border-outline-variant/10 hidden md:block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-tertiary-fixed/10 rounded-full flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-tertiary-fixed-dim"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  payments
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">
                  Recent Rent Collection
                </p>
                <p className="text-lg font-bold text-primary">CAD $2,450.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
