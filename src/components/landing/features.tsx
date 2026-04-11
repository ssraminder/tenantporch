const features = [
  {
    icon: "payments",
    title: "Rent Collection",
    description:
      "Automated CAD transfers directly to your account. No more chasing cheques or e-transfers.",
    span: "md:col-span-2",
    style: "bg-surface-container-lowest border border-outline-variant/5 hover:shadow-md",
    iconBg: "bg-secondary-fixed",
    iconColor: "text-secondary",
    textColor: "text-primary",
    descColor: "text-on-surface-variant",
  },
  {
    icon: "handyman",
    title: "Maintenance Tracking",
    description:
      "Centralized ticketing system for tenants and contractors. Track status from report to resolution.",
    span: "md:col-span-2",
    style: "bg-primary text-white",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    textColor: "text-white",
    descColor: "text-blue-100/70",
    hasBlob: true,
  },
  {
    icon: "description",
    title: "Document Vault",
    description: "Encrypted storage for leases, IDs, and insurance documents.",
    span: "md:col-span-1",
    style: "bg-surface-container-lowest border border-outline-variant/5 hover:shadow-md",
    iconBg: "bg-surface-container",
    iconColor: "text-primary",
    textColor: "text-primary",
    descColor: "text-on-surface-variant",
    small: true,
  },
  {
    icon: "gavel",
    title: "Compliance Tools",
    description:
      "Automated province-specific forms (Ontario Standard Lease, BC Form RTB-1) updated to the latest regulations.",
    span: "md:col-span-3",
    style: "bg-surface-container-low border border-outline-variant/5",
    iconBg: "bg-tertiary/10",
    iconColor: "text-tertiary",
    textColor: "text-primary",
    descColor: "text-on-surface-variant",
    hasWidget: true,
  },
  {
    icon: "domain",
    title: "Portfolio Architecture",
    description:
      "Organize multi-unit dwellings with architectural precision. Visualized data for effortless oversight across provinces.",
    span: "md:col-span-2",
    style: "bg-surface-container-lowest border border-outline-variant/5 hover:shadow-md",
    iconBg: "bg-primary",
    iconColor: "text-secondary-fixed",
    textColor: "text-primary",
    descColor: "text-on-surface-variant",
  },
  {
    icon: "edit_note",
    title: "Lease Composition",
    description:
      "Provincial-standard lease agreements generated instantly. Editorial clarity meets legal compliance.",
    span: "md:col-span-2",
    style: "bg-surface-container-low border border-outline-variant/5 hover:shadow-md",
    iconBg: "bg-secondary",
    iconColor: "text-white",
    textColor: "text-primary",
    descColor: "text-on-surface-variant",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-4">
        <div className="max-w-2xl">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
            Precision tools for modern management
          </h2>
          <p className="text-on-surface-variant">
            We&rsquo;ve replaced the chaos of spreadsheets with an editorial,
            structured flow designed for efficiency.
          </p>
        </div>
        <a
          href="/pricing"
          className="text-secondary font-bold flex items-center gap-2 group shrink-0"
        >
          View all features{" "}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className={`${f.span} ${f.style} p-7 md:p-8 rounded-xl shadow-sm flex flex-col justify-between ${f.small ? "" : "min-h-[280px] md:min-h-[320px]"} transition-shadow relative overflow-hidden`}
          >
            <div>
              <div
                className={`w-10 h-10 md:w-12 md:h-12 ${f.iconBg} rounded-lg flex items-center justify-center ${f.iconColor} mb-5 md:mb-6`}
              >
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3
                className={`text-xl md:text-2xl font-bold ${f.textColor} mb-2 md:mb-3 ${f.small ? "!text-xl" : ""}`}
              >
                {f.title}
              </h3>
              <p
                className={`${f.descColor} leading-relaxed ${f.small ? "text-sm" : ""}`}
              >
                {f.description}
              </p>
            </div>

            {f.hasBlob && (
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            )}

            {f.hasWidget && (
              <div className="flex-shrink-0 bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/10 w-full md:w-64 mt-6 md:mt-0 md:absolute md:right-8 md:bottom-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Compliance Status
                  </span>
                  <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] rounded-full font-medium">
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed-dim w-3/4" />
                  </div>
                  <p className="text-[10px] text-on-surface-variant">
                    RTB Form Filing: 75% Complete
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
