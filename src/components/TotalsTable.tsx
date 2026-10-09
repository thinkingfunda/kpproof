import type { Total } from "@/lib/totals";
import { inr } from "@/lib/store";

export function TotalsTable({ title, rows, label }: { title: string; rows: Total[]; label: (k: string) => string }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-sm font-bold text-card-foreground">{title}</p>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 text-sm">
        <span className="text-xs text-muted-foreground">Period</span>
        <span className="text-right text-xs text-muted-foreground">Ltr</span>
        <span className="text-right text-xs text-muted-foreground">Amount</span>
        <span className="text-right text-xs text-muted-foreground">Verified</span>
        {rows.map((r) => (
          <div key={r.key} className="contents">
            <span className="font-semibold">{label(r.key)}</span>
            <span className="text-right tabular-nums">{r.litres.toFixed(1)}</span>
            <span className="text-right tabular-nums">{inr(r.amount)}</span>
            <span className="text-right tabular-nums">{r.verified}/{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
