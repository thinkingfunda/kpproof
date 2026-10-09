import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { TotalsTable } from "@/components/TotalsTable";
import { useEntries, inr, todayISO } from "@/lib/store";
import { groupTotals, monthKey, monthLabel, shiftKey } from "@/lib/totals";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FuelLog Pro" },
      { name: "description", content: "Live litres, amount and verified fuel entries at a glance." },
      { property: "og:title", content: "Dashboard — FuelLog Pro" },
      { property: "og:description", content: "Live litres, amount and verified fuel entries at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-card-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const [entries] = useEntries();
  const today = todayISO();
  const month = today.slice(0, 7);
  const sum = (es: typeof entries) => ({ l: es.reduce((s, e) => s + e.litres, 0), a: es.reduce((s, e) => s + e.amount, 0), v: es.filter((e) => e.verified).length, n: es.length });
  const all = sum(entries), td = sum(entries.filter((e) => e.date === today)), mo = sum(entries.filter((e) => e.date.startsWith(month)));
  const pct = all.n ? Math.round((all.v / all.n) * 100) : 0;
  const parties = groupTotals(entries.filter((e) => e.date.startsWith(month)), (e) => e.partyName).sort((a, b) => b.amount - a.amount);
  return (
    <Shell title="Dashboard">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Today · Litres" value={td.l.toFixed(1)} sub={`${td.n} entries`} />
        <Stat label="Today · Amount" value={inr(td.a)} />
        <Stat label="This month · Litres" value={mo.l.toFixed(1)} sub={`${mo.n} entries`} />
        <Stat label="This month · Amount" value={inr(mo.a)} />
        <Stat label="All time · Litres" value={all.l.toFixed(1)} />
        <Stat label="All time · Amount" value={inr(all.a)} />
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="flex justify-between text-sm"><span className="font-bold">Verified entries</span><span className="font-bold text-primary">{all.v} / {all.n} ({pct}%)</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
      </div>
      <TotalsTable title="This month by shift" rows={groupTotals(entries.filter((e) => e.date.startsWith(month)), shiftKey)} label={(k) => k} />
      <TotalsTable title="This month by party" rows={parties} label={(k) => k} />
      <TotalsTable title="By month" rows={groupTotals(entries, monthKey).sort((a, b) => b.key.localeCompare(a.key))} label={monthLabel} />
      {entries.length === 0 && <p className="text-center text-muted-foreground">No entries yet.</p>}
    </Shell>
  );
}
