import { Icon } from "@iconify/react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { useEntries, inr } from "@/lib/store";
import { TotalsTable } from "@/components/TotalsTable";
import { groupTotals, monthKey, monthLabel, shiftKey } from "@/lib/totals";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Fuel History — FuelLog Pro" },
      { name: "description", content: "All logged fuel entries with totals." },
      { property: "og:title", content: "Fuel History — FuelLog Pro" },
      { property: "og:description", content: "All logged fuel entries with totals." },
    ],
  }),
  component: History,
});

function History() {
  const [entries, setEntries] = useEntries();
  const L = entries.reduce((s, e) => s + e.litres, 0);
  const A = entries.reduce((s, e) => s + e.amount, 0);
  return (
    <Shell title="Fuel History">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card p-4 text-center shadow-card">
        <div><p className="text-xs text-muted-foreground">Entries</p><p className="font-bold">{entries.length}</p></div>
        <div><p className="text-xs text-muted-foreground">Litres</p><p className="font-bold">{L.toFixed(1)}</p></div>
        <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold">{inr(A)}</p></div>
      </div>
      <TotalsTable title="Monthly totals" rows={groupTotals(entries, monthKey).sort((a, b) => b.key.localeCompare(a.key))} label={monthLabel} />
      <TotalsTable title="Shift-wise totals" rows={groupTotals(entries, shiftKey)} label={(k) => k} />
      {entries.length === 0 && <p className="text-center text-muted-foreground">No entries yet.</p>}
      {entries.map((e) => (
        <div key={e.id} className="flex gap-3 rounded-2xl bg-card shadow-card p-3">
          {e.image && <img src={e.image} alt="" className="h-16 w-16 rounded object-cover" />}
          <div className="flex-1 text-sm">
            <div className="flex justify-between"><span className="font-bold">{e.vehicle} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${e.verified ? "bg-success-soft text-success-foreground" : "bg-warning-soft text-warning-foreground"}`}>{e.verified ? "Verified" : "Unverified"}</span></span><span className="text-muted-foreground">{e.date}</span></div>
            <p className="text-muted-foreground">{e.partyName}</p>
            <div className="flex justify-between"><span>{e.litres} L</span><span className="font-bold text-primary">{inr(e.amount)}</span></div>
          </div>
          <button aria-label="Delete" className="self-start rounded-full p-1.5 text-destructive hover:bg-destructive-soft" onClick={() => confirm("Delete entry?") && setEntries(entries.filter((x) => x.id !== e.id))}><Icon icon="solar:trash-bin-trash-bold" className="h-5 w-5" /></button>
        </div>
      ))}
    </Shell>
  );
}
