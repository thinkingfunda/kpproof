import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Card, inputCls, labelCls } from "@/components/Shell";
import { useParties, useEntries, useVehicles, usePayments, todayISO, fmtDate, inr, entryPartyName } from "@/lib/store";
import { buildLedger } from "@/lib/ledger";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Party Ledger Report — FuelLog Pro" },
      { name: "description", content: "Party-wise bills, payments and closing balance." },
      { property: "og:title", content: "Party Ledger Report — FuelLog Pro" },
      { property: "og:description", content: "Party-wise bills, payments and closing balance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Report,
});

function Report() {
  const [parties] = useParties();
  const [entries] = useEntries();
  const [vehicles] = useVehicles();
  const [pays] = usePayments();
  const [partyId, setPartyId] = useState("");
  const [from, setFrom] = useState(todayISO().slice(0, 8) + "01");
  const [to, setTo] = useState(todayISO());
  const party = parties.find((p) => p.id === partyId);

  const L = party ? buildLedger(
    entries.filter((e) => entryPartyName(e, vehicles, parties) === party.name),
    pays.filter((p) => p.partyId === party.id || (!p.partyId && p.partyName === party.name)),
    from, to) : undefined;
  const tax = !!L?.rows.some((r) => r.tds || r.tcs);
  const tb = L?.rows.reduce((s, r) => s + r.bill, 0) ?? 0, tp = L?.rows.reduce((s, r) => s + r.payment, 0) ?? 0;

  return (
    <Shell title="Report">
      <Card className="grid gap-3 md:grid-cols-3">
        <div><label className={labelCls}>Party Name</label>
          <select className={inputCls} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">Select party</option>
            {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></div>
        <div><label className={labelCls}>From</label><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className={labelCls}>To</label><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </Card>
      {!L ? <p className="text-center text-muted-foreground">Select a party to see the report.</p> : (
        <Card className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>{["Date", "Type", "Vehicle No", "Payment Details", "Bill Amount", "Payment Amount", ...(tax ? ["TDS", "TCS"] : []), "Closing Balance"].map((h, i) =>
                <th key={h} className={`px-3 py-2 ${i >= 4 ? "text-right" : "text-left"}`}>{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr className="border-b border-border font-semibold"><td className="px-3 py-2" colSpan={tax ? 8 : 6}>Opening Balance</td><td className="px-3 py-2 text-right tabular-nums">{inr(L.opening)}</td></tr>
              {L.rows.map((r) => (
                <tr key={r.key} className="border-b border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="px-3 py-2"><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${r.type === "Bill" ? "bg-warning-soft" : "bg-success-soft text-success-foreground"}`}>{r.type}</span></td>
                  <td className="px-3 py-2">{r.vehicle}</td>
                  <td className="px-3 py-2">{r.remark}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.bill ? inr(r.bill) : ""}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.payment ? inr(r.payment) : ""}</td>
                  {tax && <><td className="px-3 py-2 text-right tabular-nums">{r.tds ? inr(r.tds) : ""}</td><td className="px-3 py-2 text-right tabular-nums">{r.tcs ? inr(r.tcs) : ""}</td></>}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{inr(r.balance)}</td>
                </tr>
              ))}
              <tr className="bg-muted font-bold">
                <td className="px-3 py-2" colSpan={4}>Total / Closing Balance</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(tb)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(tp)}</td>
                {tax && <td colSpan={2} />}
                <td className="px-3 py-2 text-right tabular-nums">{inr(L.closing)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </Shell>
  );
}
