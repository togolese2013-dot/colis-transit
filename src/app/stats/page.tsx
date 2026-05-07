"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Icons = {
  Back: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  TrendUp: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    </svg>
  ),
  Box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
};

export default function StatsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase.from('packages').select('*');
      if (!error) setPackages(data || []);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const stats = {
    total: packages.length,
    china: packages.filter(p => p.status === 'RECU_CHINE').length,
    transit: packages.filter(p => p.status === 'EN_TRANSIT').length,
    lome: packages.filter(p => p.status === 'ARRIVE_LOME').length,
    delivered: packages.filter(p => p.status === 'LIVRE').length,
  };

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      <header className="header">
        <button className="back-btn" onClick={() => router.push("/")}><Icons.Back /></button>
        <h1>Statistiques</h1>
      </header>

      <div className="stat-card primary" style={{ marginBottom: '24px', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.total}</div>
        <div style={{ fontSize: '1rem', opacity: 0.9 }}>Colis gérés au total</div>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Icons.TrendUp />
          <span>+12% ce mois-ci</span>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Répartition</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { label: 'Reçu en Chine', count: stats.china, color: '#f59e0b' },
          { label: 'En Transit', count: stats.transit, color: 'var(--primary)' },
          { label: 'Arrivé à Lomé', count: stats.lome, color: '#10b981' },
          { label: 'Livré', count: stats.delivered, color: '#6366f1' },
        ].map((item, i) => (
          <div key={i} className="package-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontWeight: '700', color: item.color }}>{item.count}</span>
            </div>
            <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: item.color, 
                width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`,
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
        ))}
      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item"><Icons.Home /></Link>
        <Link href="/" className="nav-item"><Icons.Box /></Link>
        <Link href="/add" className="nav-item" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', boxShadow: 'var(--shadow-lg)' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item active"><Icons.BarChart /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>
    </div>
  );
}
