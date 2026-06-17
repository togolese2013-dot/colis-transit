"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Bell, Plus, BarChart2, User, Trash2, Send, Home, Upload, SlidersHorizontal, Users, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import GlobalSearch from "@/components/GlobalSearch";

const getBadgeClass = (status: string) => {
  switch (status) {
    case 'RECU_CHINE':  return 'badge-received';
    case 'EN_TRANSIT':  return 'badge-transit';
    case 'ARRIVE_LOME': return 'badge-arrived';
    case 'LIVRE':       return 'badge-delivered';
    default:            return 'badge-delivered';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'RECU_CHINE':  return 'Reçu Chine';
    case 'EN_TRANSIT':  return 'En Transit';
    case 'ARRIVE_LOME': return 'Arrivé Lomé';
    case 'LIVRE':       return 'Livré';
    default:            return status;
  }
};

interface ClaimNotif { id: string; tracking: string; name: string; phone: string | null; time: Date; }

export default function PackageHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, initials } = useCurrentUser();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [filterShipping, setFilterShipping] = useState<string>('');
  const [filterWeightMin, setFilterWeightMin] = useState<string>('');
  const [filterWeightMax, setFilterWeightMax] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const PAGE_SIZE = 20;

  const goToPage = (p: number) => {
    setPage(p);
    router.replace(`/chine?page=${p}`, { scroll: false });
  };
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [notifications, setNotifications] = useState<ClaimNotif[]>(() => {
    try {
      const saved = localStorage.getItem('chine_notifications');
      if (!saved) return [];
      return JSON.parse(saved).map((n: any) => ({ ...n, time: new Date(n.time) }));
    } catch { return []; }
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const packagesRef = useRef<any[]>([]);

  const saveNotifications = (notifs: ClaimNotif[]) => {
    setNotifications(notifs);
    try { localStorage.setItem('chine_notifications', JSON.stringify(notifs)); } catch {}
  };

  // Cmd+K global search shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowGlobalSearch(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) { setPackages(data || []); packagesRef.current = data || []; }
      setLoading(false);
    }
    fetchPackages();

    const channel = supabase
      .channel('pkg-claims-chine')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'packages' }, (payload) => {
        const updated = payload.new as any;
        const existing = packagesRef.current.find(p => p.id === updated.id);
        const wasUnknown = !existing || !existing.customer_name;
        if (wasUnknown && updated.customer_name) {
          setNotifications(prev => {
            const next = [{ id: updated.id, tracking: updated.tracking_number, name: updated.customer_name, phone: updated.customer_phone || null, time: new Date() }, ...prev];
            try { localStorage.setItem('chine_notifications', JSON.stringify(next)); } catch {}
            return next;
          });
        }
        packagesRef.current = packagesRef.current.map(p => p.id === updated.id ? { ...p, ...updated } : p);
        setPackages([...packagesRef.current]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'packages' }, (payload) => {
        const deletedId = (payload.old as any).id;
        packagesRef.current = packagesRef.current.filter(p => p.id !== deletedId);
        setPackages([...packagesRef.current]);
      })
      .subscribe((status) => { console.log('[Chine Realtime]', status); });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const isArchived = (pkg: any) => !!pkg.archived_at || pkg.status === 'ARRIVE_LOME' || pkg.status === 'LIVRE';

  const filteredPackages = packages.filter(pkg => {
    if (!showArchived && isArchived(pkg)) return false;
    if (showArchived && !isArchived(pkg)) return false;
    const matchesSearch =
      pkg.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.item_name && pkg.item_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.customer_name && pkg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeFilter && pkg.status !== activeFilter) return false;
    if (filterShipping && pkg.shipping_type !== filterShipping) return false;
    if (filterWeightMin && !(pkg.weight_kg >= parseFloat(filterWeightMin))) return false;
    if (filterWeightMax && !(pkg.weight_kg <= parseFloat(filterWeightMax))) return false;
    if (filterDateRange !== 'all') {
      const created = new Date(pkg.created_at);
      const now = new Date();
      if (filterDateRange === 'today' && created.toDateString() !== now.toDateString()) return false;
      if (filterDateRange === '7d' && (now.getTime() - created.getTime()) > 7 * 86400000) return false;
      if (filterDateRange === '30d' && (now.getTime() - created.getTime()) > 30 * 86400000) return false;
    }
    return true;
  });

  const hasAdvancedFilters = filterDateRange !== 'all' || filterShipping !== '' || filterWeightMin !== '' || filterWeightMax !== '';
  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE));
  const pagedPackages = filteredPackages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => { setFilterDateRange('all'); setFilterShipping(''); setFilterWeightMin(''); setFilterWeightMax(''); setShowArchived(false); goToPage(1); };

  const receivedCount  = packages.filter(p => p.status === 'RECU_CHINE').length;
  const inTransitCount = packages.filter(p => p.status === 'EN_TRANSIT').length;
  const archivedCount  = packages.filter(p => isArchived(p)).length;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    setIsUpdating(true);
    const { error } = await supabase.from('packages').update({ status: bulkStatus }).in('id', selectedIds);
    if (!error) {
      packagesRef.current = packagesRef.current.map(p => selectedIds.includes(p.id) ? { ...p, status: bulkStatus } : p);
      setPackages([...packagesRef.current]);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
    setIsUpdating(false);
  };

  const deletePhotosFromStorage = async (pkgList: any[]) => {
    const paths: string[] = [];
    const marker = '/object/public/packages/';
    for (const pkg of pkgList) {
      const urls: string[] = Array.isArray(pkg.photo_urls) && pkg.photo_urls.length > 0
        ? pkg.photo_urls : pkg.photo_url ? [pkg.photo_url] : [];
      for (const url of urls) {
        const idx = url.indexOf(marker);
        if (idx !== -1) paths.push(url.slice(idx + marker.length));
      }
    }
    if (paths.length > 0) await supabase.storage.from('packages').remove(paths);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} colis ?`)) return;
    setIsUpdating(true);
    const toDelete = packages.filter(p => selectedIds.includes(p.id));
    const { error } = await supabase.from('packages').delete().in('id', selectedIds);
    if (!error) {
      await deletePhotosFromStorage(toDelete);
      const remaining = packages.filter(p => !selectedIds.includes(p.id));
      packagesRef.current = remaining;
      setPackages(remaining);
      setSelectedIds([]);
      setIsSelectionMode(false);
    } else {
      alert("Erreur : " + error.message);
    }
    setIsUpdating(false);
  };

  const handleSendInTransit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch('/api/packages/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'EN_TRANSIT' }),
    });
    if (res.ok) setPackages(packages.map(p => p.id === id ? { ...p, status: 'EN_TRANSIT' } : p));
  };

  const toggleFilter = (filter: string) => {
    setActiveFilter(prev => prev === filter ? null : filter);
    goToPage(1);
  };

  return (
    <div className="container" style={{ paddingTop: '0.25rem', paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div className="header-user">
          <div className="avatar">
            <span style={{ fontSize: '0.9375rem' }}>{initials}</span>
          </div>
          <div className="user-info">
            <h2>{username || 'Admin'}</h2>
            <p>Guangzhou Warehouse</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="notif-btn"
            aria-label="Recherche globale"
            title="Rechercher (⌘K)"
          >
            <Search size={18} />
          </button>
          <div style={{ position: 'relative' }}>
          <button className="notif-btn" aria-label="Notifications" onClick={() => setNotifOpen(o => !o)}>
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', background: '#ef4444', color: 'white', border: '2px solid white', fontSize: '0.625rem', fontWeight: '800', lineHeight: 1 }}>
                {notifications.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '300px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--text-1)' }}>Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={() => saveNotifications([])} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-3)', cursor: 'pointer', fontWeight: '600' }}>Tout effacer</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8125rem' }}>Aucune notification</div>
              ) : (
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      onClick={() => { setNotifOpen(false); router.push(`/edit/${n.id}`); }}
                      style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', background: i === 0 ? 'var(--accent-subtle)' : 'var(--bg)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'var(--accent-subtle)' : 'var(--bg)')}
                    >
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: 'var(--text-3)', fontWeight: '500' }}>{n.time.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} {n.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {' · '}📦 <strong style={{ color: 'var(--text-1)' }}>{n.name}</strong> a réclamé son colis <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: '700' }}>{n.tracking}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Global Search */}
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}

      {/* Stats */}
      <div className="stats-row">
        <div
          className="stat-tile accent-fill"
          onClick={() => toggleFilter('RECU_CHINE')}
          style={activeFilter === 'RECU_CHINE' ? { outline: '3px solid rgba(249,115,22,0.4)', outlineOffset: '2px' } : {}}
        >
          <div className="stat-num" style={{ color: 'white' }}>{loading ? '—' : receivedCount}</div>
          <div className="stat-lbl" style={{ color: 'rgba(255,255,255,0.75)' }}>Reçu en Chine</div>
        </div>
        <div
          className={`stat-tile ${activeFilter === 'EN_TRANSIT' ? 'is-active-blue' : ''}`}
          onClick={() => toggleFilter('EN_TRANSIT')}
        >
          <div className="stat-num">{loading ? '—' : inTransitCount}</div>
          <div className="stat-lbl">En Transit</div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
          <span className="search-ico"><Search size={16} /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); goToPage(1); }}
          />
        </div>
        <button
          className={`filter-chip ${hasAdvancedFilters ? 'active' : ''}`}
          onClick={() => setFilterDrawerOpen(true)}
          style={{ flexShrink: 0, position: 'relative' }}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {hasAdvancedFilters && <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid white' }} />}
        </button>
      </div>

      {/* Shipping type chips */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
        {([
          ['', 'Tous'],
          ['ORDINAIRE', '🚢 Ordinaire'],
          ['EXPRESS', '✈️ Express'],
          ['COLIS_BATTERIE', '🔋 Batterie'],
        ] as [string, string][]).map(([val, lbl]) => (
          <button
            key={val}
            className={`filter-chip${filterShipping === val ? ' active' : ''}`}
            onClick={() => { setFilterShipping(val); goToPage(1); }}
            style={{ whiteSpace: 'nowrap' }}
          >
            {lbl}
            {val !== '' && (
              <span style={{ marginLeft: '0.25rem', fontSize: '0.6875rem', opacity: 0.75 }}>
                ({packages.filter(p => p.shipping_type === val).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Archive toggle */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem' }}>
        <button
          className={`filter-chip${!showArchived ? ' active' : ''}`}
          onClick={() => { setShowArchived(false); goToPage(1); setActiveFilter(null); }}
        >
          Actifs
          <span style={{ marginLeft: '0.25rem', fontSize: '0.6875rem', opacity: 0.75 }}>
            ({packages.filter(p => !p.archived_at).length})
          </span>
        </button>
        <button
          className={`filter-chip${showArchived ? ' active' : ''}`}
          onClick={() => { setShowArchived(true); goToPage(1); setActiveFilter(null); }}
        >
          🗄️ Archivés (Lomé)
          <span style={{ marginLeft: '0.25rem', fontSize: '0.6875rem', opacity: 0.75 }}>
            ({archivedCount})
          </span>
        </button>
      </div>

      {/* Section header */}
      <div className="section-label">
        <span className="section-title">
          Colis enregistrés
          {filteredPackages.length > 0 && (
            <span style={{ marginLeft: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-3)' }}>
              {filteredPackages.length}
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isSelectionMode && selectedIds.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBulkDelete}
              disabled={isUpdating}
            >
              <Trash2 size={13} />
              {selectedIds.length}
            </button>
          )}
          {!isSelectionMode && (
            <Link href="/import" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary btn-sm" type="button">
                <Upload size={13} /> Import
              </button>
            </Link>
          )}
          <button
            className={`btn btn-sm ${isSelectionMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
          >
            {isSelectionMode ? 'Annuler' : 'Sélectionner'}
          </button>
        </div>
      </div>

      {/* Package list */}
      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Aucun colis</div>
          <div className="empty-text">{searchQuery ? 'Aucun résultat pour cette recherche.' : 'Commencez par ajouter un colis.'}</div>
        </div>
      ) : (
        pagedPackages.map((pkg) => (
          <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isSelectionMode && (
              <input
                type="checkbox"
                checked={selectedIds.includes(pkg.id)}
                onChange={() => toggleSelection(pkg.id)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', flexShrink: 0 }}
              />
            )}
            <Link
              href={isSelectionMode ? '#' : `/edit/${pkg.id}`}
              style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
              onClick={isSelectionMode ? (e) => { e.preventDefault(); toggleSelection(pkg.id); } : undefined}
            >
              <div className={`pkg-item ${selectedIds.includes(pkg.id) ? 'is-selected' : ''}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pkg-number">{pkg.tracking_number}</div>
                  <div className="pkg-meta">
                    {pkg.customer_name || 'Sans nom'}
                    {pkg.customer_phone && ` · ${pkg.customer_phone}`}
                  </div>
                  {pkg.created_at && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>
                      {new Date(pkg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(pkg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {!isSelectionMode && (
                  pkg.status === 'RECU_CHINE' ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => handleSendInTransit(e, pkg.id)}
                      style={{ flexShrink: 0 }}
                    >
                      <Send size={12} />
                      Transit
                    </button>
                  ) : (
                    <span className={`badge ${getBadgeClass(pkg.status)}`} style={{ flexShrink: 0 }}>
                      {getStatusLabel(pkg.status)}
                    </span>
                  )
                )}
              </div>
            </Link>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.25rem 0 0.5rem' }}>
          <button
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', background: 'white', fontSize: '0.8125rem', fontWeight: '600', color: page === 1 ? 'var(--text-3)' : 'var(--text-1)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)' }}
          >
            ← Préc.
          </button>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-2)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', background: 'white', fontSize: '0.8125rem', fontWeight: '600', color: page === totalPages ? 'var(--text-3)' : 'var(--text-1)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)' }}
          >
            Suiv. →
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="bulk-bar">
          <div className="bulk-bar-title">{selectedIds.length} colis sélectionné{selectedIds.length > 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-input form-select"
              style={{ flex: 1, padding: '0.625rem 2.5rem 0.625rem 0.875rem', fontSize: '0.875rem' }}
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Changer le statut...</option>
              <option value="RECU_CHINE">Reçu en Chine</option>
              <option value="EN_TRANSIT">En Transit</option>
              <option value="ARRIVE_LOME">Arrivé à Lomé</option>
              <option value="LIVRE">Livré</option>
            </select>
            <button
              className="btn btn-primary"
              style={{ padding: '0.625rem 1rem', flexShrink: 0 }}
              disabled={!bulkStatus || isUpdating}
              onClick={handleBulkUpdate}
            >
              {isUpdating ? <span className="spinner" /> : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Filter drawer */}
      <div className={`drawer-overlay ${filterDrawerOpen ? 'open' : ''}`} onClick={() => setFilterDrawerOpen(false)} />
      <div className={`drawer ${filterDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-1)' }}>Filtres avancés</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {hasAdvancedFilters && (
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                <X size={12} /> Réinitialiser
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setFilterDrawerOpen(false)}>
              Appliquer
            </button>
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ marginBottom: '0.625rem' }}>Période</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[['all', 'Tout'], ['today', "Aujourd'hui"], ['7d', '7 jours'], ['30d', '30 jours']].map(([val, lbl]) => (
              <button key={val} className={`filter-chip ${filterDateRange === val ? 'active' : ''}`} onClick={() => setFilterDateRange(val)}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Shipping type */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ marginBottom: '0.625rem' }}>Type d'envoi</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[['', 'Tous'], ['ORDINAIRE', 'Ordinaire'], ['EXPRESS', 'Express'], ['COLIS_BATTERIE', 'Colis Batterie 🔋']].map(([val, lbl]) => (
              <button key={val} className={`filter-chip ${filterShipping === val ? 'active' : ''}`} onClick={() => setFilterShipping(val)}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Weight range */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.625rem' }}>Poids (kg)</label>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="number" className="form-input" placeholder="Min" value={filterWeightMin} onChange={e => setFilterWeightMin(e.target.value)} style={{ flex: 1, fontSize: '16px' }} step="0.1" min="0" />
            <span style={{ color: 'var(--text-3)', fontWeight: '600', flexShrink: 0 }}>→</span>
            <input type="number" className="form-input" placeholder="Max" value={filterWeightMax} onChange={e => setFilterWeightMax(e.target.value)} style={{ flex: 1, fontSize: '16px' }} step="0.1" min="0" />
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn active" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
