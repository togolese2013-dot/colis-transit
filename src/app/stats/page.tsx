"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, TrendingUp, Home, Plus, BarChart2, User, Users, DollarSign, Clock, Package } from "lucide-react";

const PRICE_MAP: Record<string, number> = {
  ORDINAIRE: 10000,
  EXPRESS: 13000,
  COLIS_BATTERIE: 11000,
};

const STATUS_ITEMS = [
  { key: "china",     label: "Reçu en Chine",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", status: "RECU_CHINE"  },
  { key: "transit",   label: "En Transit",       color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", status: "EN_TRANSIT"  },
  { key: "lome",      label: "Arrivé à Lomé",   color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", status: "ARRIVE_LOME" },
  { key: "delivered", label: "Livré",            color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", status: "LIVRE"       },
];

function getWeekLabel(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getWeekStart(weeksAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7 - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({ data, color = "#f97316" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 280, H = 80, barW = Math.floor((W - (data.length - 1) * 6) / data.length);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ display: "block" }}>
      {data.map((val, i) => {
        const bh = Math.max((val / max) * H, val > 0 ? 4 : 0);
        const x = i * (barW + 6);
        const y = H - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill={color} opacity={i === data.length - 1 ? 1 : 0.5} />
            {val > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={color} fontSize="8" fontWeight="700">{val}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from("packages")
        .select("status, shipping_type, weight_kg, created_at, customer_name, customer_phone");
      if (!error) setPackages(data || []);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const total = packages.length;
  const counts = {
    china:     packages.filter(p => p.status === "RECU_CHINE").length,
    transit:   packages.filter(p => p.status === "EN_TRANSIT").length,
    lome:      packages.filter(p => p.status === "ARRIVE_LOME").length,
    delivered: packages.filter(p => p.status === "LIVRE").length,
  };

  // Revenue estimate (livré seulement)
  const revenue = packages
    .filter(p => p.status === "LIVRE" && p.weight_kg)
    .reduce((acc, p) => acc + (p.weight_kg * (PRICE_MAP[p.shipping_type] ?? 10000)), 0);

  // Weekly packages — last 8 weeks
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = getWeekStart(7 - i);
    const weekEnd = getWeekStart(6 - i);
    return packages.filter(p => {
      const d = new Date(p.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
  });

  // Top clients
  const clientMap: Record<string, number> = {};
  packages.forEach(p => {
    if (p.customer_name) {
      clientMap[p.customer_name] = (clientMap[p.customer_name] || 0) + 1;
    }
  });
  const topClients = Object.entries(clientMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Avg weight
  const withWeight = packages.filter(p => p.weight_kg);
  const avgWeight = withWeight.length > 0
    ? (withWeight.reduce((a, p) => a + p.weight_kg, 0) / withWeight.length).toFixed(1)
    : "—";

  // Shipping type breakdown
  const typeCount = {
    ORDINAIRE:      packages.filter(p => p.shipping_type === "ORDINAIRE").length,
    EXPRESS:        packages.filter(p => p.shipping_type === "EXPRESS").length,
    COLIS_BATTERIE: packages.filter(p => p.shipping_type === "COLIS_BATTERIE").length,
  };

  return (
    <div className="container" style={{ paddingBottom: "120px" }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Statistiques</span>
        </div>
      </div>

      {/* Total card */}
      <div style={{ background: "linear-gradient(135deg, var(--accent) 0%, #fb923c 100%)", borderRadius: "var(--r-2xl)", padding: "1.75rem", marginBottom: "1rem", boxShadow: "0 8px 32px rgba(249,115,22,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.75)", marginBottom: "0.5rem" }}>Total colis</p>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {loading ? "—" : total}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "var(--r-lg)", padding: "0.625rem", color: "white" }}>
            <Package size={22} />
          </div>
        </div>
        {/* Mini KPIs */}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.75rem 1rem" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Revenus estimés</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
              {loading ? "—" : revenue > 0 ? `${(revenue / 1000000).toFixed(1)}M` : "0"} <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>FCFA</span>
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.75rem 1rem" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Poids moyen</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
              {loading ? "—" : avgWeight} <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>kg</span>
            </p>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-xl)", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)" }}>Colis / semaine</p>
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>8 dernières semaines</span>
        </div>
        {loading ? (
          <div style={{ height: 80, background: "var(--bg-subtle)", borderRadius: 8 }} />
        ) : (
          <BarChart data={weeklyData} />
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 9, color: "var(--text-3)" }}>{getWeekLabel(7)}</span>
          <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 700 }}>Cette sem.</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", marginBottom: "0.875rem" }}>Répartition statuts</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {STATUS_ITEMS.map((item) => {
            const count = counts[item.key as keyof typeof counts];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={item.key} style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-xl)", padding: "0.875rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-2)" }}>{item.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{pct}%</span>
                    <span style={{ fontSize: "1.0625rem", fontWeight: 700, color: item.color }}>{loading ? "—" : count}</span>
                  </div>
                </div>
                <div style={{ height: 5, background: "var(--bg-subtle)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: item.color, width: `${pct}%`, borderRadius: "var(--r-full)", transition: "width 0.7s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping type */}
      <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-xl)", padding: "1.25rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", marginBottom: "0.875rem" }}>Formules utilisées</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "Ordinaire", key: "ORDINAIRE", color: "#3b82f6", price: "10 000" },
            { label: "Express 🚀", key: "EXPRESS", color: "#f97316", price: "13 000" },
            { label: "Batterie 🔋", key: "COLIS_BATTERIE", color: "#f59e0b", price: "11 000" },
          ].map(item => {
            const count = typeCount[item.key as keyof typeof typeCount];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-2)", minWidth: 90 }}>{item.label}</span>
                <div style={{ flex: 1, height: 5, background: "var(--bg-subtle)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: item.color, width: `${pct}%`, borderRadius: "var(--r-full)", transition: "width 0.7s ease" }} />
                </div>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: item.color, minWidth: 28, textAlign: "right" }}>{loading ? "—" : count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top clients */}
      {topClients.length > 0 && (
        <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-xl)", padding: "1.25rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", marginBottom: "0.875rem" }}>Top clients</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {topClients.map(([name, count], i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: i < topClients.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "var(--accent)" : "var(--bg-subtle)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: i === 0 ? "white" : "var(--text-3)", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--accent)" }}>{count} colis</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn active" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
