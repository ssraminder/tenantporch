import { formatCurrency } from "@/lib/currency";

export function CurrencyDisplay({
  amount,
  currency = "CAD",
  showCode = false,
  className,
}: {
  amount: number;
  currency?: string;
  showCode?: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      {showCode && (
        <span className="text-sm font-bold text-secondary mr-1">{currency}</span>
      )}
      {formatCurrency(amount, currency)}
    </span>
  );
}
