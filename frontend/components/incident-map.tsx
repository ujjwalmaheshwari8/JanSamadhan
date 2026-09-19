"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Hotspot, Incident } from "@/lib/types";

const severityColor: Record<string, string> = {
  critical: "#ff5470",
  high: "#f5b942",
  medium: "#4fa9ff",
  low: "#3ddc97",
};

export function IncidentMap({ points, height = 480 }: { points: (Hotspot | Incident)[]; height?: number }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const W = 900;
  const H = height;

  const bounds = useMemo(() => {
    if (!points.length) return { minLat: 18, maxLat: 20, minLon: 72, maxLon: 73 };
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const pad = 0.02;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLon: Math.min(...lons) - pad,
      maxLon: Math.max(...lons) + pad,
    };
  }, [points]);

  const project = (lat: number, lon: number) => {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1)) * (W - 80) + 40;
    const y = H - (((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * (H - 80) + 40);
    return { x, y };
  };

  const gridLines = 10;

  return (
    <div className="relative overflow-hidden rounded-lg border border-base-700 bg-base-900">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d1220" />
            <stop offset="100%" stopColor="#05070d" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#mapGlow)" />
        {Array.from({ length: gridLines }).map((_, i) => (
          <line key={`v${i}`} x1={(i / gridLines) * W} y1={0} x2={(i / gridLines) * W} y2={H} stroke="#1b2333" strokeWidth={1} />
        ))}
        {Array.from({ length: gridLines }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(i / gridLines) * H} x2={W} y2={(i / gridLines) * H} stroke="#1b2333" strokeWidth={1} />
        ))}
        {points.map((p) => {
          const { x, y } = project(p.lat, p.lon);
          const color = severityColor[p.severity?.toLowerCase()] || "#4fa9ff";
          const isIncident = "priority" in p && "title" in (p as Incident);
          return (
            <g
              key={p.id}
              transform={`translate(${x},${y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => router.push(`/incidents/${p.id}`)}
            >
              <circle r={14} fill={color} opacity={0.15} className="animate-pulseSlow" />
              <circle r={6} fill={color} stroke="#05070d" strokeWidth={2} />
              {hover === p.id && (
                <g>
                  <rect x={12} y={-32} width={190} height={isIncident ? 50 : 30} rx={6} fill="#111827" stroke="#2a3448" />
                  <text x={22} y={-14} fill="#fff" fontSize={12} fontWeight={700}>
                    {isIncident ? (p as Incident).title : p.id}
                  </text>
                  {isIncident && (
                    <text x={22} y={4} fill="#8a97ad" fontSize={11}>
                      {(p as Incident).area} · P{(p as Incident).priority}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg border border-base-700 bg-base-900/90 px-3 py-2 text-xs">
        {Object.entries(severityColor).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: v }} />
            <span className="capitalize text-base-500">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
