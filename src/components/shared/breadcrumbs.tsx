import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: string;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="inline-flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="inline-flex items-center gap-1.5">
            {index > 0 && (
              <span className="material-symbols-outlined text-outline-variant text-base select-none">
                chevron_right
              </span>
            )}

            {isLast ? (
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                {item.icon && (
                  <span className="material-symbols-outlined text-sm">
                    {item.icon}
                  </span>
                )}
                <span className="truncate max-w-[200px]">{item.label}</span>
              </span>
            ) : (
              <Link
                href={item.href ?? "#"}
                className="inline-flex items-center gap-1 font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                {item.icon && (
                  <span className="material-symbols-outlined text-sm">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
