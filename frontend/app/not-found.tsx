"use client";

import Link from "next/link";
import { Radar, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-950 px-4 text-center">
      <Radar className="h-10 w-10 text-accent" />
      <h1 className="text-2xl font-bold text-white">404 — Signal not found</h1>
      <p className="max-w-sm text-sm text-base-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-base-950 shadow-glow hover:bg-accent-glow"
      >
        <Home size={16} /> Return home
      </Link>
    </div>
  );
}
