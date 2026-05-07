"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Icons = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
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
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Bell: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  Truck: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  )
};

export default function LomeDashboard() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>("EN_TRANSIT");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();

    // Abonnement Temps Réel pour les nouveaux colis expédiés de Chine
    const channel = supabase
      .channel('lome-updates')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'packages', filter: 'status=eq.EN_TRANSIT' },
        (payload) => {
          setNotification(`Nouveau colis expédié de Chine ! (${payload.new.tracking_number})`);
          fetchPackages();
          // Auto-hide notification after 5 seconds
          setTimeout(() => setNotification(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .in('status', ['EN_TRANSIT', 'ARRIVE_LOME', 'LIVRE'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur Supabase:", error);
      alert("Erreur de chargement: " + error.message);
    } else {
      console.log("Colis récupérés à Lomé:", data);
      setPackages(data || []);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('packages').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setPackages(packages.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (pkg.customer_name && pkg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter) {
      return matchesSearch && pkg.status === activeFilter;
    }
    return matchesSearch;
  });

  const inTransitCount = packages.filter(p => p.status === 'EN_TRANSIT').length;
  const arrivedCount = packages.filter(p => p.status === 'ARRIVE_LOME').length;
  const deliveredCount = packages.filter(p => p.status === 'LIVRE').length;

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      <header className="header">
        <div className="header-user">
          <div className="avatar-square" style={{ backgroundImage: "url('/avatar.png')" }}></div>
          <div className="user-info">
            <h2>Agent Lomé</h2>
            <p>Bienvenue,</p>
          </div>
        </div>
        <div className="notif-badge">
          <Icons.Bell />
          <div className="notif-dot"></div>
        </div>
      </header>

      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon"><Icons.Search /></span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Rechercher un colis..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {notification && (
        <div style={{ 
          background: '#eef2ff', 
          color: '#0052cc', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem', 
          border: '1px solid #0052cc',
          animation: 'fadeIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          <Icons.Bell />
          {notification}
        </div>
      )}

      <div className="stats-grid">
        <div 
          className={`stat-card ${activeFilter === 'EN_TRANSIT' ? 'active' : ''}`}
          onClick={() => setActiveFilter('EN_TRANSIT')}
          style={{ 
            cursor: 'pointer', 
            border: activeFilter === 'EN_TRANSIT' ? '2px solid #0052cc' : 'none', 
            background: 'var(--surface)' 
          }}
        >
          <div className="stat-number">{loading ? '--' : inTransitCount}</div>
          <div className="stat-label">En Transit</div>
          <div className="stat-arrow" style={{ color: '#0052cc' }}><Icons.ArrowUpRight /></div>
        </div>
        <div 
          className={`stat-card ${activeFilter === 'ARRIVE_LOME' ? 'active' : ''}`} 
          onClick={() => setActiveFilter('ARRIVE_LOME')}
          style={{ 
            cursor: 'pointer', 
            border: activeFilter === 'ARRIVE_LOME' ? '2px solid #0052cc' : 'none',
            background: activeFilter === 'ARRIVE_LOME' ? '#eef2ff' : 'var(--surface)'
          }}
        >
          <div className="stat-number" style={{ color: '#0052cc' }}>{loading ? '--' : arrivedCount}</div>
          <div className="stat-label">Arrivé Lomé</div>
          <div className="stat-arrow" style={{ color: '#0052cc' }}><Icons.ArrowUpRight /></div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
        {activeFilter === 'EN_TRANSIT' ? 'Colis attendus' : 
         activeFilter === 'ARRIVE_LOME' ? 'Colis à livrer' : 
         'Historique des livraisons'}
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>
      ) : filteredPackages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Aucun colis trouvé
        </div>
      ) : (
        <div className="package-list">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="package-card">
              <div className="package-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className="package-main">
                  <span className="tracking-number">{pkg.tracking_number}</span>
                  <div className="package-customer">
                    <span className="customer-name">{pkg.customer_name || 'Client inconnu'}</span>
                    <span className="customer-phone">{pkg.customer_phone}</span>
                  </div>
                </div>
                <div className="package-actions">
                  {pkg.status === 'EN_TRANSIT' && (
                    <button 
                      className="btn-transit"
                      onClick={() => handleUpdateStatus(pkg.id, 'ARRIVE_LOME')}
                      style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Icons.CheckCircle />
                      Réceptionner
                    </button>
                  )}
                  {pkg.status === 'ARRIVE_LOME' && (
                    <button 
                      className="btn-transit"
                      onClick={() => handleUpdateStatus(pkg.id, 'LIVRE')}
                      style={{ background: '#0052cc', color: 'white', border: 'none', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Icons.Truck />
                      Livrer
                    </button>
                  )}
                  {pkg.status === 'LIVRE' && (
                    <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Icons.CheckCircle /> Livré
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="bottom-nav">
        <Link href="/lome" className="nav-item active" style={{ color: '#0052cc' }}><Icons.Home /></Link>
        <Link href="/lome" className="nav-item" style={{ color: '#0052cc' }}><Icons.Truck /></Link>
        <Link href="/lome/history" className="nav-item" style={{ color: '#0052cc' }}><Icons.CheckCircle /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>
    </div>
  );
}
