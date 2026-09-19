"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  AlertTriangle,
  Map as MapIcon,
  ListOrdered,
  Brain,
  Wrench,
  Timer,
  BarChart3,
  ScrollText,
  MessageSquarePlus,
  FileClock,
  LogOut,
  Radar,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={18} />, roles: ["admin", "department_officer"] },
  { href: "/incidents", label: "Incidents", icon: <AlertTriangle size={18} />, roles: ["admin", "department_officer", "field_officer"] },
  { href: "/map", label: "Live Map", icon: <MapIcon size={18} />, roles: ["admin", "department_officer"] },
  { href: "/priority", label: "Priority Queue", icon: <ListOrdered size={18} />, roles: ["admin", "department_officer"] },
  { href: "/root-cause", label: "Root Cause Intel", icon: <Brain size={18} />, roles: ["admin", "department_officer"] },
  { href: "/work-orders", label: "Work Orders", icon: <Wrench size={18} />, roles: ["admin", "department_officer", "field_officer"] },
  { href: "/sla", label: "SLA Monitor", icon: <Timer size={18} />, roles: ["admin", "department_officer"] },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 size={18} />, roles: ["admin", "department_officer"] },
  { href: "/audit-logs", label: "Audit Logs", icon: <ScrollText size={18} />, roles: ["admin", "department_officer"] },
  { href: "/complaints/new", label: "Report a Complaint", icon: <MessageSquarePlus size={18} />, roles: ["citizen"] },
  { href: "/complaints/mine", label: "My Complaints", icon: <FileClock size={18} />, roles: ["citizen"] },
];

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-950">
        <Radar className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  if (roles && !roles.includes(user.role)) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-crit/30 bg-crit/5 py-20 text-center">
          <ShieldAlert className="h-10 w-10 text-crit" />
          <p className="text-lg font-semibold text-white">Access restricted</p>
          <p className="max-w-sm text-sm text-base-500">
            Your role ({user.role.replace(/_/g, " ")}) doesn&apos;t have permission to view this section.
          </p>
        </div>
      </Shell>
    );
  }

  return <Shell>{children}</Shell>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS.filter((i) => !user || i.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-base-950">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-base-700 bg-base-900/80 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-base-700 px-5 py-5">
          <Radar className="h-6 w-6 text-accent" />
          <div>
            <p className="text-sm font-extrabold tracking-widest text-white">JanSamadhan</p>
            <p className="mono text-[10px] tracking-wider text-base-500">JAN SAMADHAN CIVIC PLATFORM</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-accent/10 text-accent shadow-glow border border-accent/20"
                    : "text-base-500 hover:bg-base-800 hover:text-base-100"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-base-700 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs capitalize text-base-500">{user?.role.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-base-600 bg-base-800 px-3 py-2 text-sm font-medium text-base-100 transition hover:bg-base-700"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}

export function Greeting() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return (
    <span>
      Good {part}, {user?.name?.split(" ")[0] || "Officer"}
    </span>
  );
}
