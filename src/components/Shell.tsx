import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { importLocalData } from "@/lib/import-local";

let importStarted = false;

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const tab = "flex-1 py-3 text-center text-xs font-semibold text-muted-foreground";
  const [note, setNote] = useState("");
  useEffect(() => {
    if (importStarted) return; importStarted = true;
    importLocalData()
      .then((n) => n > 0 && setNote(`${n} old entries from this phone were added to the shared data ✓`))
      .catch((e) => { importStarted = false; setNote("Could not move old phone entries: " + (e as Error).message); });
  }, []);
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground">
        <p className="text-xs uppercase tracking-widest opacity-80">FuelLog Pro</p>
        <h1 className="text-xl font-bold">{title}</h1>
      </header>
      {note && <button onClick={() => setNote("")} className="w-full bg-secondary px-4 py-2 text-left text-sm font-semibold text-secondary-foreground">{note} ✕</button>}
      <main className="space-y-4 p-4">{children}</main>
      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t bg-card">
        <Link to="/" className={tab} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>⛽ New Entry</Link>
        <Link to="/parties" className={tab} activeProps={{ className: "text-primary" }}>🗂️ Masters</Link>
        <Link to="/dashboard" className={tab} activeProps={{ className: "text-primary" }}>📊 Dashboard</Link>
        <Link to="/history" className={tab} activeProps={{ className: "text-primary" }}>📋 History</Link>
      </nav>
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
export const labelCls = "mb-1 block text-sm font-semibold text-foreground";
export const btnCls = "w-full rounded-lg bg-primary py-3.5 text-base font-bold text-primary-foreground active:opacity-80 disabled:opacity-50";
