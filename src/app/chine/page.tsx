"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const Icons = {
  Back: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Filter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="1"></circle>
      <line x1="4" y1="8" x2="9" y2="8"></line>
      <line x1="11" y1="8" x2="20" y2="8"></line>
      <circle cx="14" cy="16" r="1"></circle>
      <line x1="4" y1="16" x2="13" y2="16"></line>
      <line x1="15" y1="16" x2="20" y2="16"></line>
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  ),
  Drone: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  Check: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  Box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
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
  Map: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
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
  Plane: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5l-8.2-1.8c-.9-.2-1.8.1-2.4.7l-.5.5c-.4.4-.5 1-.2 1.4l7.2 3.6-3.6 7.2c-.4.4-.3 1 .1 1.4l.5.5c.6.6 1.5.9 2.4.7l8.2-1.8 3.5 3.5c1.5 1.5 3.5 1 4-.5s-.5-2.5-2-4l-3.5-3.5z"></path>
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  )
};

export default function PackageHistory() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setPackages(data || []);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (pkg.item_name && pkg.item_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (pkg.customer_name && pkg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter) {
      return matchesSearch && pkg.status === activeFilter;
    }
    return matchesSearch;
  });

  const receivedCount = packages.filter(p => p.status === 'RECU_CHINE').length;
  const inTransitCount = packages.filter(p => p.status === 'EN_TRANSIT').length;
  const arrivedCount = packages.filter(p => p.status === 'ARRIVE_LOME').length;
  const deliveredCount = packages.filter(p => p.status === 'LIVRE').length;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    setIsUpdating(true);
    const { error } = await supabase.from('packages').update({ status: bulkStatus }).in('id', selectedIds);
    if (!error) {
      setPackages(packages.map(p => selectedIds.includes(p.id) ? { ...p, status: bulkStatus } : p));
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
    setIsUpdating(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} colis ?`)) return;
    
    setIsUpdating(true);
    const { error } = await supabase.from('packages').delete().in('id', selectedIds);
    
    if (!error) {
      setPackages(packages.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setIsSelectionMode(false);
      alert("Colis supprimés avec succès.");
    } else {
      alert("Erreur lors de la suppression : " + error.message);
    }
    setIsUpdating(false);
  };

  const handleSendInTransit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from('packages').update({ status: 'EN_TRANSIT' }).eq('id', id);
    if (!error) {
      setPackages(packages.map(p => p.id === id ? { ...p, status: 'EN_TRANSIT' } : p));
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      <header className="header">
        <div className="header-user">
          <div className="avatar-square"></div>
          <div className="user-info">
            <h2>James Carter</h2>
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
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn"><Icons.Filter /></button>
      </div>

      <div className="stats-grid">
        <div 
          className={`stat-card primary ${activeFilter === 'RECU_CHINE' ? 'active' : ''}`} 
          onClick={() => setActiveFilter(activeFilter === 'RECU_CHINE' ? null : 'RECU_CHINE')}
          style={{ cursor: 'pointer', border: activeFilter === 'RECU_CHINE' ? '2px solid var(--primary)' : 'none' }}
        >
          <div className="stat-number">{loading ? '--' : receivedCount}</div>
          <div className="stat-label">Colis reçu</div>
          <div className="stat-arrow"><Icons.ArrowUpRight /></div>
        </div>
        <div 
          className={`stat-card ${activeFilter === 'EN_TRANSIT' ? 'active' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'EN_TRANSIT' ? null : 'EN_TRANSIT')}
          style={{ cursor: 'pointer', border: activeFilter === 'EN_TRANSIT' ? '2px solid var(--primary)' : 'none' }}
        >
          <div className="stat-number">{loading ? '--' : inTransitCount}</div>
          <div className="stat-label">En Transit</div>
          <div className="stat-arrow"><Icons.ArrowUpRight /></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Colis enregistrés</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isSelectionMode && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              style={{ 
                background: '#fee2e2', 
                color: '#ef4444',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Icons.Trash />
              Supprimer ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
            style={{ 
              background: isSelectionMode ? 'var(--primary)' : 'transparent', 
              color: isSelectionMode ? 'white' : 'var(--primary)',
              border: isSelectionMode ? 'none' : '1px solid var(--primary)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {isSelectionMode ? 'Annuler' : 'Sélectionner'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>
      ) : filteredPackages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          {searchQuery ? "Aucun résultat." : "Aucun colis."}
        </div>
      ) : (
        filteredPackages.map((pkg) => (
          <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {isSelectionMode && (
              <input 
                type="checkbox" 
                checked={selectedIds.includes(pkg.id)} 
                onChange={() => toggleSelection(pkg.id)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <Link href={isSelectionMode ? '#' : `/edit/${pkg.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="package-card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1.25rem',
                  border: selectedIds.includes(pkg.id) ? '2px solid var(--primary)' : 'none',
                  margin: 0
                }}>
                  <div className="package-info">
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>{pkg.tracking_number}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                      <span>{pkg.customer_name || 'Sans nom'}</span>
                      {pkg.customer_phone && <span style={{ opacity: 0.7 }}>• {pkg.customer_phone}</span>}
                    </div>
                  </div>
                  
                  {pkg.status === 'RECU_CHINE' ? (
                    <button 
                      onClick={(e) => handleSendInTransit(e, pkg.id)}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      Envoyer en Transit
                    </button>
                  ) : (
                    <div className="package-badge">{pkg.status.replace('_', ' ')}</div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        ))
      )}

      {isSelectionMode && selectedIds.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          bottom: '100px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: 'calc(100% - 3rem)', 
          maxWidth: '400px',
          background: 'var(--surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedIds.length} colis sélectionnés</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              className="form-input" 
              style={{ flex: 1, padding: '0.5rem' }} 
              value={bulkStatus} 
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Changer statut...</option>
              <option value="RECU_CHINE">Reçu en Chine</option>
              <option value="EN_TRANSIT">En Transit</option>
              <option value="ARRIVE_LOME">Arrivé à Lomé</option>
              <option value="LIVRE">Livré</option>
            </select>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1rem', width: 'auto' }}
              disabled={!bulkStatus || isUpdating}
              onClick={handleBulkUpdate}
            >
              {isUpdating ? '...' : 'OK'}
            </button>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <Link href="/chine" className="nav-item active"><Icons.Home /></Link>
        <Link href="/add" className="nav-item" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', boxShadow: 'var(--shadow-lg)' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item"><Icons.BarChart /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>
    </div>
  );
}
