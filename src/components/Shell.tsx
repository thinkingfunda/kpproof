import { Link } from "@tanstack/react-router";
import { Icon } from "@iconify/react";
import { useEffect, useState, type ReactNode } from "react";
import { importLocalData } from "@/lib/import-local";

let importStarted = false;

const NAV = [
  { to: "/", label: "New Entry", icon: "solar:gas-station-bold-duotone", exact: true },
  { to: "/dashboard", label: "Dashboard", icon: "solar:chart-2-bold-duotone" },
  { to: "/history", label: "History", icon: "solar:clipboard-list-bold-duotone" },
  { to: "/parties", label: "Masters", icon: "solar:folder-with-files-bold-duotone" },
] as const;

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const [note, setNote] = useState("");
  useEffect(() => {
    if (importStarted) return; importStarted = true;
    importLocalData()
      .then((n) => n > 0 && setNote(`${n} old entries from this phone were added to the shared data`))
      .catch((e) => { importStarted = false; setNote("Could not move old phone entries: " + (e as Error).message); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop / tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <Brand />
        <nav className="mt-8 space-y-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-muted"
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-accent-foreground" }}>
              <Icon icon={n.icon} className="h-6 w-6" />{n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="pb-24 md:pb-10 md:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8 md:py-5">
            <div className="md:hidden"><Brand compact /></div>
            <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
          </div>
        </header>
        {note && (
          <div className="mx-auto max-w-5xl px-4 pt-4 md:px-8">
            <button onClick={() => setNote("")} className="flex w-full items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-left text-sm font-semibold text-success-foreground">
              <Icon icon="solar:check-circle-bold" className="h-5 w-5 shrink-0" /><span className="flex-1">{note}</span>
              <Icon icon="mingcute:close-line" className="h-4 w-4" />
            </button>
          </div>
        )}
        <main className="mx-auto max-w-5xl space-y-4 px-4 py-4 md:space-y-6 md:px-8 md:py-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "!text-primary" }}>
            <Icon icon={n.icon} className="h-6 w-6" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <Icon icon="solar:gas-station-bold" className="h-5 w-5" />
      </span>
      {!compact && <span className="font-display text-lg font-extrabold">FuelLog Pro</span>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card p-4 text-card-foreground shadow-card md:p-5 ${className}`}>{children}</div>;
}

export const inputCls = "w-full rounded-lg border border-input bg-card px-3.5 py-3 text-base text-foreground transition-colors placeholder:text-muted-foreground hover:border-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
export const labelCls = "mb-1.5 block text-sm font-semibold text-foreground";
export const btnCls = "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3.5 text-base font-bold text-background transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40";
