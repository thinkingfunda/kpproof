import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const tab = "flex-1 py-3 text-center text-xs font-semibold text-muted-foreground";
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground">
        <p className="text-xs uppercase tracking-widest opacity-80">FuelLog Pro</p>
        <h1 className="text-xl font-bold">{title}</h1>
      </header>
      <main className="space-y-4 p-4">{children}</main>
      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t bg-card">
        <Link to="/" className={tab} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>⛽ New Entry</Link>
        <Link to="/parties" className={tab} activeProps={{ className: "text-primary" }}>👥 Parties</Link>
        <Link to="/history" className={tab} activeProps={{ className: "text-primary" }}>📋 History</Link>
      </nav>
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
export const labelCls = "mb-1 block text-sm font-semibold text-foreground";
export const btnCls = "w-full rounded-lg bg-primary py-3.5 text-base font-bold text-primary-foreground active:opacity-80 disabled:opacity-50";
