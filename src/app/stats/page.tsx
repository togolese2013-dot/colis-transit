"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, TrendingUp, Home, Plus, BarChart2, User, Users } from "lucide-react";

const STATUS_ITEMS = [
  { key: 'china',     label: 'Reçu en Chine',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', status: 'RECU_CHINE'  },
  { key: 'transit',   label: 'En Transit',        color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', status: 'EN_TRANSIT'  },
  { key: 'lome',      label: 'Arrivé à Lomé',    color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', status: 'ARRIVE_LOME' },
  { key: 'delivered', label: 'Livré',             color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', status: 'LIVRE'       },
];

export default function StatsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase.from('packages').select('status');
      if (!error) setPackages(data || []);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const total     = packages.length;
  const counts = {
    china:     packages.filter(p => p.status === 'RECU_CHINE').length,
    transit:   packages.filter(p => p.status === 'EN_TRANSIT').length,
    lome:      packages.filter(p => p.status === 'ARRIVE_LOME').length,
    delivered: packages.filter(p => p.status === 'LIVRE').length,
  };

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Statistiques</span>
        </div>
      </div>

      {/* Total card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, #fb923c 100%)',
        borderRadius: 'var(--r-2xl)', padding: '1.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px rgba(249,115,22,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)', marginBottom: '0.5rem' }}>
              Total colis
            </p>
            <div style={{ fontSize: '3rem', fontWeight: '800', color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {loading ? '—' : total}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-lg)', padding: '0.625rem', color: 'white' }}>
            <TrendingUp size={22} />
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>
          <TrendingUp size={14} />
          <span>Plateforme Hamid Cargo</span>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: '0.875rem' }}>
          Répartition
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {STATUS_ITEMS.map((item) => {
            const count = counts[item.key as keyof typeof counts];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={item.key}
                style={{
                  background: 'white', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--r-xl)', padding: '1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-2)' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{pct}%</span>
                    <span style={{ fontSize: '1.0625rem', fontWeight: '700', color: item.color }}>{loading ? '—' : count}</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-full)', overflow: 'hidden', border: `1px solid ${item.border}` }}>
                  <div style={{
                    height: '100%', background: item.color,
                    width: `${pct}%`, borderRadius: 'var(--r-full)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
