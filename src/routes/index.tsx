import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, inputCls, labelCls, btnCls } from "@/components/Shell";
import { useParties, useEntries, todayISO } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Fuel Entry — FuelLog Pro" },
      { name: "description", content: "Log fuel entries with party, vehicle, litres, amount and photo." },
      { property: "og:title", content: "New Fuel Entry — FuelLog Pro" },
      { property: "og:description", content: "Log fuel entries with party, vehicle, litres, amount and photo." },
    ],
  }),
  component: NewEntry,
});

function compress(file: File): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}

function NewEntry() {
  const [parties] = useParties();
  const [entries, setEntries] = useEntries();
  const active = parties.filter((p) => p.active);
  const [date, setDate] = useState(todayISO());
  const [partyId, setPartyId] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [litres, setLitres] = useState("");
  const [amount, setAmount] = useState("");
  const [image, setImage] = useState<string>();
  const [msg, setMsg] = useState("");
  const recent = [...new Set(entries.map((e) => e.vehicle))].slice(0, 4);

  const onFile = async (f?: File) => { if (f) setImage(await compress(f)); };
  const valid = partyId && vehicle.trim() && Number(litres) > 0 && Number(amount) > 0;

  const save = () => {
    const p = parties.find((x) => x.id === partyId)!;
    setEntries([{ id: crypto.randomUUID(), date, partyId, partyName: p.name, vehicle: vehicle.trim().toUpperCase(),
      litres: Number(litres), amount: Number(amount), image, createdAt: Date.now() }, ...entries]);
    setVehicle(""); setLitres(""); setAmount(""); setImage(undefined); setDate(todayISO());
    setMsg("Entry saved ✓"); setTimeout(() => setMsg(""), 2500);
  };

  return (
    <Shell title="New Fuel Entry">
      <div><label className={labelCls}>Date</label>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div><label className={labelCls}>Party Name</label>
        <select className={inputCls} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
          <option value="">Select active party</option>
          {active.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></div>
      <div><label className={labelCls}>Vehicle No</label>
        <input className={`${inputCls} uppercase`} placeholder="MH12AB1234" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        {recent.length > 0 && <div className="mt-2 flex flex-wrap gap-2">
          {recent.map((v) => <button key={v} onClick={() => setVehicle(v)} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{v}</button>)}
        </div>}</div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Ltr</label>
          <input type="number" inputMode="decimal" className={inputCls} value={litres} onChange={(e) => setLitres(e.target.value)} /></div>
        <div><label className={labelCls}>Amount (₹)</label>
          <input type="number" inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      </div>
      {Number(litres) > 0 && Number(amount) > 0 && <p className="text-sm text-muted-foreground">Rate: ₹{(Number(amount) / Number(litres)).toFixed(2)}/L</p>}
      <div><label className={labelCls}>Attach / Capture Image</label>
        {image ? (
          <div className="relative"><img src={image} alt="Receipt" className="w-full rounded-lg border" />
            <button onClick={() => setImage(undefined)} className="absolute right-2 top-2 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">Remove</button></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer rounded-lg border-2 border-dashed border-primary p-4 text-center text-sm font-semibold text-primary">📷 Capture
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} /></label>
            <label className="cursor-pointer rounded-lg border-2 border-dashed border-input p-4 text-center text-sm font-semibold text-muted-foreground">🖼️ Attach
              <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} /></label>
          </div>
        )}</div>
      <button className={btnCls} disabled={!valid} onClick={save}>Save Entry</button>
      {msg && <p className="text-center font-semibold text-primary">{msg}</p>}
    </Shell>
  );
}
