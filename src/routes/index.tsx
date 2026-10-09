import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, inputCls, labelCls, btnCls } from "@/components/Shell";
import { useParties, useEntries, useProducts, useVehicles, rateOn, todayISO, inr, fmtDate } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { signUpload } from "@/lib/cloudinary.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Fuel Entry — FuelLog Pro" },
      { name: "description", content: "Log fuel entries with party, vehicle, litres, amount, slip photo and driver signature." },
      { property: "og:title", content: "New Fuel Entry — FuelLog Pro" },
      { property: "og:description", content: "Log fuel entries with party, vehicle, litres, amount, slip photo and driver signature." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

const shiftOf = (h: number) => (h >= 6 && h < 14 ? "Morning Shift" : h >= 14 && h < 22 ? "Evening Shift" : "Night Shift");
const timeStr = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

function SignaturePad({ onChange }: { onChange: (v?: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);
  useEffect(() => {
    const c = ref.current!; const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    const ctx = c.getContext("2d")!; ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(c).color;
  }, []);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  const down = (e: React.PointerEvent) => { drawing.current = true; ref.current!.setPointerCapture(e.pointerId); const ctx = ref.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(...pos(e)); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; ctx.lineTo(...pos(e)); ctx.stroke(); };
  const up = () => { if (!drawing.current) return; drawing.current = false; setHas(true); onChange(ref.current!.toDataURL("image/png")); };
  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setHas(false); onChange(undefined); };
  return (
    <div className="relative">
      <canvas ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="h-36 w-full touch-none rounded-lg border-2 border-dashed border-input bg-card text-foreground" />
      {!has && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Driver signs here</p>}
      {has && <button onClick={clear} className="absolute right-2 top-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">Clear</button>}
    </div>
  );
}

function NewEntry() {
  const [parties] = useParties();
  const [entries, setEntries] = useEntries();
  const [products] = useProducts();
  const [vehicles] = useVehicles();
  const active = parties.filter((p) => p.active);
  const [now, setNow] = useState<Date | null>(null);
  const [date, setDate] = useState(todayISO());
  const [partyId, setPartyId] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [litres, setLitres] = useState("");
  const [amount, setAmount] = useState("");
  const [image, setImage] = useState<string>();
  const [signature, setSignature] = useState<string>();
  const [ack, setAck] = useState(false);
  const [sigKey, setSigKey] = useState(0);
  const [msg, setMsg] = useState("");
  const [productId, setProductId] = useState("");
  const [busy, setBusy] = useState(false);
  const sign = useServerFn(signUpload);

  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const product = products.find((p) => p.id === productId);
  const rate = product ? rateOn(product.rates, date) : undefined;
  useEffect(() => { if (!productId && products.length === 1) setProductId(products[0]!.id); }, [products, productId]);
  useEffect(() => {
    if (rate !== undefined && Number(litres) > 0) setAmount((Number(litres) * rate).toFixed(2));
  }, [rate, litres]);

  const party = parties.find((p) => p.id === partyId);
  const used = entries.filter((e) => e.partyId === partyId).reduce((s, e) => s + e.amount, 0);
  const headroom = party?.creditLimit ? party.creditLimit - used - (Number(amount) || 0) : undefined;
  const partyVeh = vehicles.filter((v) => v.partyId === partyId).map((v) => v.number);
  const chips = [...new Set([...partyVeh, ...entries.map((e) => e.vehicle)])].slice(0, 6);
  const tank = vehicles.find((v) => v.number === vehicle.trim().toUpperCase())?.tankCapacity;
  const addL = (n: number) => setLitres(String(+((Number(litres) || 0) + n).toFixed(2)));

  const onFile = async (f?: File) => { if (f) setImage(await compress(f)); };
  const valid = partyId && vehicle.trim() && Number(litres) > 0 && Number(amount) > 0 && signature && ack;

  const upload = async (file: string, partyName: string, v: string) => {
    const s = await sign({ data: { partyName, date, vehicle: v } });
    const fd = new FormData();
    fd.append("file", file); fd.append("api_key", s.apiKey); fd.append("timestamp", String(s.timestamp));
    fd.append("folder", s.folder); fd.append("public_id", s.public_id); fd.append("signature", s.signature);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${s.cloud}/image/upload`, { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || "Upload failed");
    return j.secure_url as string;
  };

  const save = async () => {
    const p = party!;
    const v = vehicle.trim().toUpperCase();
    setBusy(true);
    try {
      const url = image ? await upload(image, p.name, v) : undefined;
      const sigUrl = await upload(signature!, p.name, `${v}_SIGN`);
      const at = new Date();
      setEntries([{ id: crypto.randomUUID(), date, partyId, partyName: p.name, vehicle: v,
        litres: Number(litres), amount: Number(amount), image: url, createdAt: at.getTime(),
        productId: product?.id, productName: product?.name, rate, signature: sigUrl, shift: shiftOf(at.getHours()) }, ...entries]);
      setVehicle(""); setLitres(""); setAmount(""); setImage(undefined); setDate(todayISO());
      setSignature(undefined); setAck(false); setSigKey((k) => k + 1);
      setMsg(`Entry saved ✓ ${timeStr(at)}`);
    } catch (e) {
      setMsg("Error: " + (e as Error).message);
    } finally { setBusy(false); setTimeout(() => setMsg(""), 3500); }
  };

  const pill = "rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground active:opacity-70";

  return (
    <Shell title="New Fuel Entry">
      <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
        <div>
          <p className="text-xs text-muted-foreground">{date === todayISO() ? "Today" : "Entry date"}</p>
          <p className="font-bold text-secondary-foreground">{fmtDate(date)}{now && date === todayISO() ? ` • ${timeStr(now)} IST` : ""}</p>
        </div>
        {now && <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{shiftOf(now.getHours())}</span>}
      </div>
      <div><label className={labelCls}>Date</label>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div><label className={labelCls}>Party Name</label>
        <select className={inputCls} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
          <option value="">Select active party</option>
          {active.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {party && (headroom !== undefined
          ? <p className={`mt-1 text-sm font-semibold ${headroom < 0 ? "text-destructive" : "text-primary"}`}>
              Credit available: {inr(headroom)} of {inr(party.creditLimit!)}{headroom < 0 ? " — limit exceeded" : ""}</p>
          : <p className="mt-1 text-xs text-muted-foreground">No credit limit set (add one in Masters)</p>)}</div>
      <div><label className={labelCls}>Vehicle No</label>
        <input list="veh-list" className={`${inputCls} uppercase`} placeholder="MH12AB1234" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        <datalist id="veh-list">{vehicles.map((v) => <option key={v.id} value={v.number} />)}</datalist>
        {chips.length > 0 && <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((v) => <button key={v} onClick={() => setVehicle(v)} className={pill}>{v}</button>)}
        </div>}</div>
      <div><label className={labelCls}>Product</label>
        <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Select product</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></div>
      <div className="rounded-lg border bg-card p-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Ltr</label>
            <input type="number" inputMode="decimal" className={`${inputCls} text-2xl font-bold tabular-nums`} value={litres} onChange={(e) => setLitres(e.target.value)} /></div>
          <div><label className={labelCls}>Amount (₹)</label>
            <input type="number" inputMode="decimal" className={`${inputCls} text-2xl font-bold tabular-nums`} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[5, 10, 25, 50].map((n) => <button key={n} onClick={() => addL(n)} className={pill}>+{n}L</button>)}
          {tank && <button onClick={() => setLitres(String(tank))} className={pill}>Full Tank ({tank}L)</button>}
          <button onClick={() => { setLitres(""); setAmount(""); }} className={`${pill} text-destructive`}>Clear</button>
        </div>
        {product && <p className="mt-2 text-sm font-semibold text-primary">
          {rate !== undefined
            ? `${inr(rate)}/L${Number(litres) > 0 ? ` × ${litres} L → ${inr(Number(litres) * rate)}` : ""}`
            : "No rate set for this date — add one in Masters"}</p>}
      </div>
      <div><label className={labelCls}>Meter / Slip Photo</label>
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
      <div><label className={labelCls}>Driver Signature</label>
        <SignaturePad key={sigKey} onChange={setSignature} /></div>
      <label className="flex items-start gap-3 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-primary" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span>Driver confirms {litres || "—"} L{product ? ` of ${product.name}` : ""} received for {vehicle.toUpperCase() || "vehicle"}{now ? ` at ${timeStr(now)} on ${fmtDate(date)}` : ""}.</span>
      </label>
      <button className={btnCls} disabled={!valid || busy} onClick={save}>{busy ? "Uploading…" : "Save Entry"}</button>
      {msg && <p className="text-center font-semibold text-primary">{msg}</p>}
    </Shell>
  );
}
