import { Icon } from "@iconify/react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { useState } from "react";
import { useEntries, useVehicles, useParties, inr, canEdit, isVerified, entryPartyName, type Entry } from "@/lib/store";
import { inputCls } from "@/components/Shell";
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
  const [vehicles] = useVehicles();
  const [parties] = useParties();
  const [ed, setEd] = useState<Entry>();
  const saveEd = () => { if (!ed) return; setEntries(entries.map((x) => (x.id === ed.id ? { ...ed, vehicle: ed.vehicle.trim().toUpperCase(), verified: isVerified(ed, ed.ocr) } : x))); setEd(undefined); };
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
            <p className="text-muted-foreground">{entryPartyName(e, vehicles, parties)}</p>
            <div className="flex justify-between"><span>{e.litres} L</span><span className="font-bold text-primary">{inr(e.amount)}</span></div>
          </div>
          {canEdit(e.date) && <button aria-label="Edit" className="self-start rounded-full p-1.5 text-primary hover:bg-primary-soft" onClick={() => setEd({ ...e })}><Icon icon="solar:pen-bold" className="h-5 w-5" /></button>}
          <button aria-label="Delete" className="self-start rounded-full p-1.5 text-destructive hover:bg-destructive-soft" onClick={() => confirm("Delete entry?") && setEntries(entries.filter((x) => x.id !== e.id))}><Icon icon="solar:trash-bin-trash-bold" className="h-5 w-5" /></button>
        </div>
      ))}
      {ed && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 md:items-center" onClick={() => setEd(undefined)}>
        <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-4 shadow-card" onClick={(x) => x.stopPropagation()}>
          <h2 className="font-display text-lg font-bold">Edit entry</h2>
          <label className="block text-sm">Date<input type="date" className={inputCls} value={ed.date} onChange={(x) => setEd({ ...ed, date: x.target.value })} /></label>
          <label className="block text-sm">Vehicle No<input className={`${inputCls} uppercase`} value={ed.vehicle} onChange={(x) => setEd({ ...ed, vehicle: x.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">Ltr<input type="number" inputMode="decimal" className={inputCls} value={ed.litres} onChange={(x) => setEd({ ...ed, litres: Number(x.target.value) })} /></label>
            <label className="block text-sm">Amount (₹)<input type="number" inputMode="decimal" className={inputCls} value={ed.amount} onChange={(x) => setEd({ ...ed, amount: Number(x.target.value) })} /></label>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-secondary py-2.5 font-bold text-secondary-foreground" onClick={() => setEd(undefined)}>Cancel</button>
            <button className="flex-1 rounded-lg bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50" disabled={!ed.vehicle.trim() || !(ed.litres > 0) || !(ed.amount > 0)} onClick={saveEd}>Save</button>
          </div>
        </div>
      </div>}
    </Shell>
  );
}
