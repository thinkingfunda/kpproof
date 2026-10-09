import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, inputCls, btnCls } from "@/components/Shell";
import { useParties } from "@/lib/store";

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Party Master — FuelLog Pro" },
      { name: "description", content: "Manage parties and their active status." },
      { property: "og:title", content: "Party Master — FuelLog Pro" },
      { property: "og:description", content: "Manage parties and their active status." },
    ],
  }),
  component: Parties,
});

function Parties() {
  const [parties, setParties] = useParties();
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) return;
    setParties([...parties, { id: crypto.randomUUID(), name: name.trim(), active: true }]);
    setName("");
  };
  return (
    <Shell title="Party Master">
      <div className="flex gap-2">
        <input className={inputCls} placeholder="New party name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={`${btnCls} w-24`} onClick={add}>Add</button>
      </div>
      {parties.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
          <span className="font-semibold text-card-foreground">{p.name}</span>
          <button onClick={() => setParties(parties.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))}
            className={`rounded-full px-3 py-1 text-xs font-bold ${p.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {p.active ? "Active" : "Inactive"}
          </button>
        </div>
      ))}
    </Shell>
  );
}
