import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { inputCls, btnCls } from "@/components/Shell";
import { listGeminiKeys, saveGeminiKey, deleteGeminiKey, resetGeminiKey, type GeminiKeyRow } from "@/lib/gemini.functions";

export function GeminiMaster() {
  const list = useServerFn(listGeminiKeys), save = useServerFn(saveGeminiKey), del = useServerFn(deleteGeminiKey), reset = useServerFn(resetGeminiKey);
  const [rows, setRows] = useState<GeminiKeyRow[]>([]);
  const [name, setName] = useState(""); const [key, setKey] = useState(""); const [editId, setEditId] = useState<string>();
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const load = async () => setRows(await list());
  useEffect(() => { load(); }, []);
  const submit = async () => {
    setBusy(true); setMsg("");
    const r = await save({ data: { id: editId, accountName: name, apiKey: key || undefined } });
    setBusy(false);
    if (r.error) return setMsg(r.error);
    setName(""); setKey(""); setEditId(undefined); load();
  };
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
        <p className="text-sm text-muted-foreground">Used for slip reading when AI credits run out. Keys are tried one by one; an exhausted key is skipped for 1 hour.</p>
        <input className={inputCls} placeholder="Account Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} type="password" placeholder={editId ? "New API key (leave blank to keep)" : "Gemini API key"} value={key} onChange={(e) => setKey(e.target.value)} />
        <button className={btnCls} disabled={!name.trim() || (!editId && !key.trim()) || busy} onClick={submit}><Icon icon="solar:diskette-bold" className="h-5 w-5" />{editId ? "Update" : "Add Key"}</button>
        {editId && <button className="w-full text-sm font-bold text-muted-foreground" onClick={() => { setEditId(undefined); setName(""); setKey(""); }}>Cancel</button>}
        {msg && <p className="text-sm font-semibold text-destructive">{msg}</p>}
      </div>
      {rows.map((r, i) => (
        <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
          <div className="flex-1">
            <p className="font-bold">{r.accountName}</p>
            <p className="text-xs text-muted-foreground">{r.masked} · {r.exhaustedAt ? <span className="text-destructive">Exhausted {new Date(r.exhaustedAt).toLocaleString("en-IN")}</span> : <span className="text-primary">Ready</span>}</p>
          </div>
          {r.exhaustedAt && <button title="Mark ready" onClick={async () => { await reset({ data: { id: r.id } }); load(); }}><Icon icon="solar:restart-bold" className="h-5 w-5 text-primary" /></button>}
          <button title="Edit" onClick={() => { setEditId(r.id); setName(r.accountName); setKey(""); }}><Icon icon="solar:pen-bold" className="h-5 w-5" /></button>
          <button title="Delete" onClick={async () => { if (confirm(`Delete ${r.accountName}?`)) { await del({ data: { id: r.id } }); load(); } }}><Icon icon="solar:trash-bin-trash-bold" className="h-5 w-5 text-destructive" /></button>
        </div>
      ))}
      {rows.length === 0 && <p className="text-center text-sm text-muted-foreground">No Gemini keys added yet.</p>}
    </div>
  );
}
