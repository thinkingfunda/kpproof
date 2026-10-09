import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, inputCls, btnCls } from "@/components/Shell";
import { useParties, useProducts, useVehicles, fmtDate, inr, todayISO, rateOn } from "@/lib/store";

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Masters — FuelLog Pro" },
      { name: "description", content: "Manage parties, products with date-wise rates, and vehicles." },
      { property: "og:title", content: "Masters — FuelLog Pro" },
      { property: "og:description", content: "Manage parties, products with date-wise rates, and vehicles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Masters,
});

const smBtn = "rounded-md px-3 py-1 text-xs font-bold";

function Masters() {
  const [tab, setTab] = useState<"party" | "product" | "vehicle">("party");
  return (
    <Shell title="Masters">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
        {([["party", "Party"], ["product", "Product & Rate"], ["vehicle", "Vehicle"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-md py-2 text-xs font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-secondary-foreground"}`}>{l}</button>
        ))}
      </div>
      {tab === "party" && <PartyMaster />}
      {tab === "product" && <ProductMaster />}
      {tab === "vehicle" && <VehicleMaster />}
    </Shell>
  );
}

function PartyMaster() {
  const [parties, setParties] = useParties();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [editId, setEditId] = useState<string>();
  const submit = () => {
    if (!name.trim()) return;
    const creditLimit = Number(limit) > 0 ? Number(limit) : undefined;
    if (editId) setParties(parties.map((p) => p.id === editId ? { ...p, name: name.trim(), creditLimit } : p));
    else setParties([...parties, { id: crypto.randomUUID(), name: name.trim(), active: true, creditLimit }]);
    setName(""); setLimit(""); setEditId(undefined);
  };
  return (
    <>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Party name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" inputMode="decimal" className={`${inputCls} w-32`} placeholder="Credit ₹" value={limit} onChange={(e) => setLimit(e.target.value)} />
      </div>
      <button className={btnCls} onClick={submit}>{editId ? "Update Party" : "Add Party"}</button>
      {parties.map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <div className="flex-1"><p className="font-semibold text-card-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.creditLimit ? `Credit limit ${inr(p.creditLimit)}` : "No credit limit"}</p></div>
          <button onClick={() => setParties(parties.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))}
            className={`${smBtn} ${p.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {p.active ? "Active" : "Inactive"}</button>
          <button className={`${smBtn} bg-secondary text-secondary-foreground`} onClick={() => { setEditId(p.id); setName(p.name); setLimit(p.creditLimit ? String(p.creditLimit) : ""); }}>Edit</button>
          <button className={`${smBtn} text-destructive`} onClick={() => confirm("Delete party?") && setParties(parties.filter((x) => x.id !== p.id))}>Delete</button>
        </div>
      ))}
    </>
  );
}

function ProductMaster() {
  const [products, setProducts] = useProducts();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string>();
  const [open, setOpen] = useState<string>();
  const submit = () => {
    if (!name.trim()) return;
    if (editId) setProducts(products.map((p) => p.id === editId ? { ...p, name: name.trim() } : p));
    else setProducts([...products, { id: crypto.randomUUID(), name: name.trim(), rates: [] }]);
    setName(""); setEditId(undefined);
  };
  return (
    <>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Product (e.g. Diesel)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={`${btnCls} w-28`} onClick={submit}>{editId ? "Update" : "Add"}</button>
      </div>
      {products.map((p) => {
        const cur = rateOn(p.rates, todayISO());
        return (
          <div key={p.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <button className="flex-1 text-left" onClick={() => setOpen(open === p.id ? undefined : p.id)}>
                <p className="font-semibold text-card-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">Today: {cur !== undefined ? `${inr(cur)}/L` : "No rate"} · {p.rates.length} rate(s) ▾</p>
              </button>
              <button className={`${smBtn} bg-secondary text-secondary-foreground`} onClick={() => { setEditId(p.id); setName(p.name); }}>Edit</button>
              <button className={`${smBtn} text-destructive`} onClick={() => confirm("Delete product?") && setProducts(products.filter((x) => x.id !== p.id))}>Delete</button>
            </div>
            {open === p.id && <RateEditor product={p} onChange={(rates) => setProducts(products.map((x) => x.id === p.id ? { ...x, rates } : x))} />}
          </div>
        );
      })}
    </>
  );
}

function RateEditor({ product, onChange }: { product: { rates: { id: string; date: string; rate: number }[] }; onChange: (r: { id: string; date: string; rate: number }[]) => void }) {
  const [date, setDate] = useState(todayISO());
  const [rate, setRate] = useState("");
  const [editId, setEditId] = useState<string>();
  const sorted = [...product.rates].sort((a, b) => b.date.localeCompare(a.date));
  const submit = () => {
    const r = Number(rate);
    if (!date || !(r > 0)) return;
    const others = product.rates.filter((x) => x.id !== editId && x.date !== date);
    onChange([...others, { id: editId ?? crypto.randomUUID(), date, rate: r }]);
    setRate(""); setEditId(undefined); setDate(todayISO());
  };
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="flex gap-2">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="number" inputMode="decimal" placeholder="Rate ₹/L" className={inputCls} value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <button className={btnCls} onClick={submit}>{editId ? "Update Rate" : "Add Rate"}</button>
      {sorted.map((r, i) => (
        <div key={r.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1">
            <b>{inr(r.rate)}</b> from {fmtDate(r.date)}
            <span className="text-muted-foreground"> {i === 0 ? "onwards" : `to ${fmtDate(prevDay(sorted[i - 1]!.date))}`}</span>
          </span>
          <button className={`${smBtn} bg-secondary text-secondary-foreground`} onClick={() => { setEditId(r.id); setDate(r.date); setRate(String(r.rate)); }}>Edit</button>
          <button className={`${smBtn} text-destructive`} onClick={() => confirm("Delete rate?") && onChange(product.rates.filter((x) => x.id !== r.id))}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function prevDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function VehicleMaster() {
  const [vehicles, setVehicles] = useVehicles();
  const [parties] = useParties();
  const [num, setNum] = useState("");
  const [partyId, setPartyId] = useState("");
  const [tank, setTank] = useState("");
  const [editId, setEditId] = useState<string>();
  const submit = () => {
    const n = num.trim().toUpperCase();
    if (!n) return;
    const v = { id: editId ?? crypto.randomUUID(), number: n, partyId: partyId || undefined, tankCapacity: Number(tank) > 0 ? Number(tank) : undefined };
    setVehicles(editId ? vehicles.map((x) => x.id === editId ? v : x) : [...vehicles, v]);
    setNum(""); setPartyId(""); setTank(""); setEditId(undefined);
  };
  return (
    <>
      <input className={`${inputCls} uppercase`} placeholder="Vehicle No (MH12AB1234)" value={num} onChange={(e) => setNum(e.target.value)} />
      <select className={inputCls} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
        <option value="">Party (optional)</option>
        {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input type="number" inputMode="decimal" className={inputCls} placeholder="Tank capacity (L, optional)" value={tank} onChange={(e) => setTank(e.target.value)} />
      <button className={btnCls} onClick={submit}>{editId ? "Update Vehicle" : "Add Vehicle"}</button>
      {vehicles.map((v) => (
        <div key={v.id} className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <div className="flex-1">
            <p className="font-semibold text-card-foreground">{v.number}</p>
            <p className="text-xs text-muted-foreground">{parties.find((p) => p.id === v.partyId)?.name ?? "—"}{v.tankCapacity ? ` · Tank ${v.tankCapacity} L` : ""}</p>
          </div>
          <button className={`${smBtn} bg-secondary text-secondary-foreground`} onClick={() => { setEditId(v.id); setNum(v.number); setPartyId(v.partyId ?? ""); setTank(v.tankCapacity ? String(v.tankCapacity) : ""); }}>Edit</button>
          <button className={`${smBtn} text-destructive`} onClick={() => confirm("Delete vehicle?") && setVehicles(vehicles.filter((x) => x.id !== v.id))}>Delete</button>
        </div>
      ))}
    </>
  );
}
