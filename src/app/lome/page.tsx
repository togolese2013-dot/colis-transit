"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, Bell, Home, Truck, CheckCircle, User, Clock } from "lucide-react";

export default function LomeDashboard() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("EN_TRANSIT");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();

    const channel = supabase
      .channel('lome-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'packages', filter: 'status=eq.EN_TRANSIT' },
        (payload) => {
          setNotification(`Nouveau colis expédié depuis la Chine · ${payload.new.tracking_number}`);
          fetchPackages();
          setTimeout(() => setNotification(null), 5000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .in('status', ['EN_TRANSIT', 'ARRIVE_LOME', 'LIVRE'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur Supabase:", error);
    } else {
      setPackages(data || []);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('packages').update({ status: newStatus }).eq('id', id);
    if (!error) setPackages(packages.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch =
      pkg.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.customer_name && pkg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch && pkg.status === activeFilter;
  });

  const inTransitCount = packages.filter(p => p.status === 'EN_TRANSIT').length;
  const arrivedCount   = packages.filter(p => p.status === 'ARRIVE_LOME').length;
  const deliveredCount = packages.filter(p => p.status === 'LIVRE').length;

  const sectionTitle = activeFilter === 'EN_TRANSIT' ? 'Colis attendus'
    : activeFilter === 'ARRIVE_LOME' ? 'Colis à livrer'
    : 'Livraisons récentes';

  return (
    <div className="container" style={{ paddingTop: '0.25rem', paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div className="header-user">
          <div className="avatar" style={{ background: 'var(--blue-subtle)', borderColor: 'var(--blue-border)', color: 'var(--blue)' }}>
            <span style={{ fontSize: '0.9375rem' }}>AL</span>
          </div>
          <div className="user-info">
            <h2>Agent Lomé</h2>
            <p>Espace Livraisons</p>
          </div>
        </div>
        <button className="notif-btn" aria-label="Notifications">
          <Bell size={18} />
          {notification && <span className="notif-dot" />}
        </button>
      </div>

      {/* Stats (3 tiles) */}
      <div className="stats-row three">
        <div
          className={`stat-tile ${activeFilter === 'EN_TRANSIT' ? 'is-active-blue' : ''}`}
          onClick={() => setActiveFilter('EN_TRANSIT')}
        >
          <div className="stat-num" style={{ fontSize: '1.5rem' }}>{loading ? '—' : inTransitCount}</div>
          <div className="stat-lbl">En Transit</div>
        </div>
        <div
          className={`stat-tile ${activeFilter === 'ARRIVE_LOME' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('ARRIVE_LOME')}
        >
          <div className="stat-num" style={{ fontSize: '1.5rem' }}>{loading ? '—' : arrivedCount}</div>
          <div className="stat-lbl">À Lomé</div>
        </div>
        <div
          className={`stat-tile ${activeFilter === 'LIVRE' ? '' : ''}`}
          onClick={() => setActiveFilter('LIVRE')}
          style={activeFilter === 'LIVRE' ? { borderColor: 'var(--success)', background: 'var(--success-subtle)' } : {}}
        >
          <div className="stat-num" style={{ fontSize: '1.5rem', ...(activeFilter === 'LIVRE' ? { color: 'var(--success)' } : {}) }}>
            {loading ? '—' : deliveredCount}
          </div>
          <div className="stat-lbl" style={activeFilter === 'LIVRE' ? { color: 'var(--success)', opacity: 0.8 } : {}}>Livré</div>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div className="notif-banner">
          <Bell size={16} style={{ flexShrink: 0 }} />
          <span>{notification}</span>
        </div>
      )}

      {/* Search */}
      <div className="search-wrap">
        <span className="search-ico"><Search size={16} /></span>
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un colis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Section title */}
      <div className="section-label">
        <span className="section-title">{sectionTitle}</span>
        {filteredPackages.length > 0 && (
          <span style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-3)' }}>
            {filteredPackages.length}
          </span>
        )}
      </div>

      {/* Package list */}
      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Aucun colis</div>
          <div className="empty-text">Aucun colis dans cette catégorie.</div>
        </div>
      ) : (
        filteredPackages.map((pkg) => (
          <div key={pkg.id} className="pkg-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pkg-number">{pkg.tracking_number}</div>
              <div className="pkg-meta">
                {pkg.customer_name || 'Client inconnu'}
                {pkg.customer_phone && ` · ${pkg.customer_phone}`}
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              {pkg.status === 'EN_TRANSIT' && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleUpdateStatus(pkg.id, 'ARRIVE_LOME')}
                >
                  <CheckCircle size={12} />
                  Réceptionner
                </button>
              )}
              {pkg.status === 'ARRIVE_LOME' && (
                <button
                  className="btn btn-blue btn-sm"
                  onClick={() => handleUpdateStatus(pkg.id, 'LIVRE')}
                >
                  <Truck size={12} />
                  Livrer
                </button>
              )}
              {pkg.status === 'LIVRE' && (
                <span className="badge badge-delivered">
                  <CheckCircle size={10} />
                  Livré
                </span>
              )}
            </div>
          </div>
        ))
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/lome"         className="nav-btn active-blue active" title="Lomé"><Home size={19} /></Link>
        <Link href="/lome"         className="nav-btn" title="Colis"><Truck size={19} /></Link>
        <Link href="/lome/history" className="nav-btn" title="Historique"><Clock size={19} /></Link>
        <Link href="/profile"      className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
