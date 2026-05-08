"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, CheckCircle, Home, Truck, Clock, User } from "lucide-react";

export default function LomeHistory() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('status', 'LIVRE')
        .order('created_at', { ascending: false });
      if (!error) setPackages(data || []);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  const filteredPackages = packages.filter(pkg =>
    pkg.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pkg.customer_name && pkg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <span className="page-title">Historique</span>
      </div>

      {/* Total delivered card */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        borderRadius: 'var(--r-2xl)', padding: '1.5rem',
        marginBottom: '1.25rem',
        boxShadow: '0 8px 24px rgba(16,185,129,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '0.71875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)', marginBottom: '0.375rem' }}>
            Total livré
          </p>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {loading ? '—' : packages.length}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
            colis livrés avec succès
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-xl)', padding: '0.875rem', color: 'white' }}>
          <CheckCircle size={28} strokeWidth={1.75} />
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <span className="search-ico"><Search size={16} /></span>
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher dans l'historique..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Section header */}
      <div className="section-label" style={{ marginBottom: '0.875rem' }}>
        <span className="section-title">Livraisons</span>
        {filteredPackages.length > 0 && (
          <span style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-3)' }}>
            {filteredPackages.length}
          </span>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-state">Chargement de l'historique...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Aucune livraison</div>
          <div className="empty-text">{searchQuery ? 'Aucun résultat.' : 'Aucune livraison enregistrée.'}</div>
        </div>
      ) : (
        filteredPackages.map((pkg) => (
          <div key={pkg.id} className="pkg-item" style={{ borderLeft: '3px solid var(--success)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pkg-number">{pkg.tracking_number}</div>
              <div className="pkg-meta">
                {pkg.customer_name || 'Client inconnu'}
                {pkg.customer_phone && ` · ${pkg.customer_phone}`}
              </div>
            </div>
            <span className="badge badge-delivered" style={{ flexShrink: 0 }}>
              <CheckCircle size={9} />
              Livré
            </span>
          </div>
        ))
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/lome"         className="nav-btn" title="Lomé"><Home size={19} /></Link>
        <Link href="/lome"         className="nav-btn" title="Colis"><Truck size={19} /></Link>
        <Link href="/lome/history" className="nav-btn active-blue active" title="Historique"><Clock size={19} /></Link>
        <Link href="/profile"      className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
