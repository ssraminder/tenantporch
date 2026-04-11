import { cn } from "@/lib/utils";

const METHOD_CONFIG: Record<string, { icon: string; label: string; className: string }> = {
  etransfer: {
    icon: "swap_horiz",
    label: "E-Transfer",
    className: "bg-tertiary-fixed/20 text-on-tertiary-fixed-variant",
  },
  card: {
    icon: "credit_card",
    label: "Card",
    className: "bg-primary-fixed/20 text-on-primary-fixed-variant",
  },
  pad: {
    icon: "account_balance",
    label: "PAD",
    className: "bg-secondary-fixed/20 text-on-secondary-fixed-variant",
  },
  cash: {
    icon: "payments",
    label: "Cash",
    className: "bg-surface-variant text-on-surface-variant",
  },
  cheque: {
    icon: "receipt",
    label: "Cheque",
    className: "bg-surface-variant text-on-surface-variant",
  },
};

export function PaymentMethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  const config = METHOD_CONFIG[method.toLowerCase()] ?? {
    icon: "help",
    label: method,
    className: "bg-surface-variant text-on-surface-variant",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
        config.className,
        className
      )}
    >
      <span className="material-symbols-outlined text-sm">{config.icon}</span>
      {config.label}
    </span>
  );
}
