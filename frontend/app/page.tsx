"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { homeRouteForRole } from "@/lib/routing";
import { Radar } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homeRouteForRole(user.role) : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-base-950">
      <div className="flex flex-col items-center gap-3 text-base-500">
        <Radar className="h-8 w-8 animate-spin text-accent" />
        <p className="mono text-xs tracking-widest">INITIALIZING JanSamadhan</p>
      </div>
    </div>
  );
}
