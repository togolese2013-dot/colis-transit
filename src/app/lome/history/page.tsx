"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const Icons = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    </svg>
  ),
  Truck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
};

export default function LomeHistory() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('status', 'LIVRE')
      .order('created_at', { ascending: false });

    if (!error) setPackages(data || []);
    setLoading(false);
  }

  const filteredPackages = packages.filter(pkg => 
    pkg.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pkg.customer_name && pkg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      <header className="header">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Historique Livraisons</h1>
      </header>

      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon"><Icons.Search /></span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Rechercher dans l'historique..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ background: '#ecfdf5', color: '#059669', padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{loading ? '--' : packages.length}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Total colis livrés</div>
          </div>
          <Icons.CheckCircle />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement de l'historique...</div>
      ) : filteredPackages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Aucune livraison enregistrée
        </div>
      ) : (
        <div className="package-list">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="package-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{pkg.tracking_number}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {pkg.customer_name} • {pkg.customer_phone}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icons.CheckCircle /> LIVRÉ
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="bottom-nav">
        <Link href="/lome" className="nav-item"><Icons.Home /></Link>
        <Link href="/lome" className="nav-item"><Icons.Truck /></Link>
        <Link href="/lome/history" className="nav-item active" style={{ color: '#0052cc' }}><Icons.CheckCircle /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>
    </div>
  );
}
