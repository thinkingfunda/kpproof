import { Icon } from "@iconify/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Card, inputCls, labelCls, btnCls } from "@/components/Shell";
import { useParties, useEntries, useVehicles, usePayments, todayISO, fmtDate, inr, entryPartyName } from "@/lib/store";
import { TAX_LIMIT, finalPayment, fyStart } from "@/lib/ledger";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Payment Entry — FuelLog Pro" },
      { name: "description", content: "Record party payments with TDS and TCS." },
      { property: "og:title", content: "Payment Entry — FuelLog Pro" },
      { property: "og:description", content: "Record party payments with TDS and TCS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const [parties] = useParties();
  const [entries] = useEntries();
  const [vehicles] = useVehicles();
  const [pays, setPays] = usePayments();
  const [date, setDate] = useState(todayISO());
  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState("");
  const [tds, setTds] = useState("");
  const [tcs, setTcs] = useState("");
  const [remark, setRemark] = useState("");
  const [msg, setMsg] = useState("");

  const party = parties.find((p) => p.id === partyId);
  const fy = fyStart(date);
  const billed = party ? entries.filter((e) => e.date >= fy && entryPartyName(e, vehicles, parties) === party.name).reduce((s, e) => s + e.amount, 0) : 0;
  const amt = Number(amount) || 0;
  const showTax = billed > TAX_LIMIT || amt > TAX_LIMIT;
  const T = showTax ? Number(tds) || 0 : 0, C = showTax ? Number(tcs) || 0 : 0;
  const fin = finalPayment(amt, T, C);

  const save = async () => {
    if (!party || amt <= 0) return setMsg("Select party and enter amount");
    await setPays([{ id: crypto.randomUUID(), date, partyId: party.id, partyName: party.name, amount: amt, tds: T, tcs: C, final: fin, remark: remark.trim() || undefined, createdAt: Date.now() }, ...pays]);
    setAmount(""); setTds(""); setTcs(""); setRemark(""); setMsg("Payment saved");
  };

  return (
    <Shell title="Payment Entry">
      <Card className="space-y-4">
        <div><label className={labelCls}>Date</label><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className={labelCls}>Party Name</label>
          <select className={inputCls} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">Select party</option>
            {parties.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {party && <p className="mt-1 text-xs text-muted-foreground">Billed this financial year: {inr(billed)}</p>}
        </div>
        <div><label className={labelCls}>Amount (₹)</label><input inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
        {showTax && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-warning-soft p-3">
            <p className="col-span-2 text-xs font-semibold">Billing crossed ₹50 lakh — TDS / TCS applicable</p>
            <div><label className={labelCls}>TDS (₹)</label><input inputMode="decimal" className={inputCls} value={tds} onChange={(e) => setTds(e.target.value)} /></div>
            <div><label className={labelCls}>TCS (₹)</label><input inputMode="decimal" className={inputCls} value={tcs} onChange={(e) => setTcs(e.target.value)} /></div>
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl bg-muted p-3">
          <span className="text-sm font-semibold">Final Payment</span><span className="text-lg font-bold">{inr(fin)}</span>
        </div>
        <div><label className={labelCls}>Remark</label><input className={inputCls} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Cheque / UPI / NEFT details" /></div>
        {msg && <p className="text-sm font-semibold text-primary">{msg}</p>}
        <button className={btnCls} onClick={save}><Icon icon="solar:diskette-bold" className="h-5 w-5" />Save</button>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-bold">Recent payments</p>
        {pays.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
        {pays.slice(0, 20).map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
            <div><p className="font-semibold">{p.partyName}</p><p className="text-xs text-muted-foreground">{fmtDate(p.date)}{p.remark ? ` • ${p.remark}` : ""}</p></div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{inr(p.final)}</span>
              <button aria-label="Delete payment" onClick={() => confirm("Delete this payment?") && setPays(pays.filter((x) => x.id !== p.id))} className="text-destructive"><Icon icon="solar:trash-bin-trash-bold" className="h-5 w-5" /></button>
            </div>
          </div>
        ))}
      </Card>
    </Shell>
  );
}
