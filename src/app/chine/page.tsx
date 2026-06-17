"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Bell, Plus, BarChart2, User, Trash2, Send, Home, Upload, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import GlobalSearch from "@/components/GlobalSearch";

// Only fetch columns needed for the list view
const LIST_COLS = 'id,tracking_number,customer_name,customer_phone,status,shipping_type,created_at,archived_at,created_by,transit_by';

const CACHE_KEY = 'chine_cache_v1';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(data: { packages: any[]; stats: any; totalCount: number }) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

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

export default function PackageHistoryPage() {
  return (
    <Suspense fallback={<div className="loading-state">Chargement...</div>}>
      <PackageHistory />
    </Suspense>
  );
}

function PackageHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, initials } = useCurrentUser();
  const [packages, setPackages] = useState<any[]>(() => readCache()?.packages ?? []);
  const [totalCount, setTotalCount] = useState<number>(() => readCache()?.totalCount ?? 0);
  const [stats, setStats] = useState(() => readCache()?.stats ?? { recu: 0, transit: 0, archived: 0 });
  // loading=false if cache exists — background refresh, no spinner
  const [loading, setLoading] = useState(() => !readCache());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterShipping, setFilterShipping] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const PAGE_SIZE = 20;

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const goToPage = (p: number) => {
    router.replace(`/chine?page=${p}`, { scroll: false });
  };

  const refetch = () => setFetchKey(k => k + 1);

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

  // Debounce search — wait 400ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); goToPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Cmd+K global search shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowGlobalSearch(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Main data fetch — server-side paginated + filtered
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      // Don't show spinner if we have cached data
      if (packages.length === 0) setLoading(true);

      // Stats counts (independent of search/shipping/activeFilter)
      const [{ count: recuCount }, { count: transitCount }, { count: archCount }] = await Promise.all([
        supabase.from('packages').select('*', { count: 'exact', head: true })
          .eq('status', 'RECU_CHINE').is('archived_at', null).neq('status', 'ARRIVE_LOME').neq('status', 'LIVRE'),
        supabase.from('packages').select('*', { count: 'exact', head: true })
          .eq('status', 'EN_TRANSIT').is('archived_at', null),
        supabase.from('packages').select('*', { count: 'exact', head: true })
          .or('archived_at.not.is.null,status.in.(ARRIVE_LOME,LIVRE)'),
      ]);

      const newStats = { recu: recuCount || 0, transit: transitCount || 0, archived: archCount || 0 };
      if (!cancelled) setStats(newStats);

      // Paginated main query
      let q = supabase.from('packages').select(LIST_COLS, { count: 'exact' });

      // Archive filter
      if (!showArchived) {
        q = q.is('archived_at', null).neq('status', 'ARRIVE_LOME').neq('status', 'LIVRE');
      } else {
        q = q.or('archived_at.not.is.null,status.in.(ARRIVE_LOME,LIVRE)');
      }

      if (filterShipping)  q = q.eq('shipping_type', filterShipping);
      if (activeFilter)    q = q.eq('status', activeFilter);
      if (debouncedSearch) q = q.or(`tracking_number.ilike.%${debouncedSearch}%,customer_name.ilike.%${debouncedSearch}%`);

      q = q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count, error } = await q;

      if (!cancelled && !error) {
        const freshPackages = data || [];
        const freshCount = count || 0;
        setPackages(freshPackages);
        packagesRef.current = freshPackages;
        setTotalCount(freshCount);
        // Cache only default view (page 1, no filters)
        if (!showArchived && !filterShipping && !activeFilter && !debouncedSearch && page === 1) {
          writeCache({ packages: freshPackages, stats: newStats, totalCount: freshCount });
        }
      }
      if (!cancelled) setLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [showArchived, filterShipping, activeFilter, debouncedSearch, page, fetchKey]);

  // Realtime — notifications only, then refetch
  useEffect(() => {
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
        refetch();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'packages' }, () => refetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'packages' }, () => refetch())
      .subscribe((status) => { console.log('[Chine Realtime]', status); });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    setIsUpdating(true);
    const { error } = await supabase.from('packages').update({ status: bulkStatus }).in('id', selectedIds);
    if (!error) { setSelectedIds([]); setIsSelectionMode(false); refetch(); }
    setIsUpdating(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} colis ?`)) return;
    setIsUpdating(true);
    const res = await fetch('/api/packages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (res.ok) {
      setSelectedIds([]);
      setIsSelectionMode(false);
      refetch();
    } else {
      const data = await res.json();
      alert("Erreur : " + (data.error || 'inconnue'));
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
    if (res.ok) refetch();
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
          <button onClick={() => setShowGlobalSearch(true)} className="notif-btn" aria-label="Recherche globale" title="Rechercher (⌘K)">
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
                      <div key={i} onClick={() => { setNotifOpen(false); router.push(`/edit/${n.id}`); }}
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
        <div className="stat-tile accent-fill" onClick={() => toggleFilter('RECU_CHINE')}
          style={activeFilter === 'RECU_CHINE' ? { outline: '3px solid rgba(249,115,22,0.4)', outlineOffset: '2px' } : {}}>
          <div className="stat-num" style={{ color: 'white' }}>{loading ? '—' : stats.recu}</div>
          <div className="stat-lbl" style={{ color: 'rgba(255,255,255,0.75)' }}>Reçu en Chine</div>
        </div>
        <div className={`stat-tile ${activeFilter === 'EN_TRANSIT' ? 'is-active-blue' : ''}`} onClick={() => toggleFilter('EN_TRANSIT')}>
          <div className="stat-num">{loading ? '—' : stats.transit}</div>
          <div className="stat-lbl">En Transit</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap" style={{ marginBottom: '0.875rem' }}>
        <span className="search-ico"><Search size={16} /></span>
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Archive toggle */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem' }}>
        <button className={`filter-chip${!showArchived ? ' active' : ''}`}
          onClick={() => { setShowArchived(false); goToPage(1); setActiveFilter(null); }}>
          Actifs
          <span style={{ marginLeft: '0.25rem', fontSize: '0.6875rem', opacity: 0.75 }}>
            ({stats.recu + stats.transit})
          </span>
        </button>
        <button className={`filter-chip${showArchived ? ' active' : ''}`}
          onClick={() => { setShowArchived(true); goToPage(1); setActiveFilter(null); }}>
          🗄️ Archivés (Lomé)
          <span style={{ marginLeft: '0.25rem', fontSize: '0.6875rem', opacity: 0.75 }}>
            ({stats.archived})
          </span>
        </button>
      </div>

      {/* Section header */}
      <div className="section-label">
        <span className="section-title">
          Colis enregistrés
          {totalCount > 0 && (
            <span style={{ marginLeft: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-3)' }}>
              {totalCount}
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isSelectionMode && selectedIds.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={isUpdating}>
              <Trash2 size={13} />{selectedIds.length}
            </button>
          )}
          {!isSelectionMode && (
            <Link href="/import" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary btn-sm" type="button"><Upload size={13} /> Import</button>
            </Link>
          )}
          <button className={`btn btn-sm ${isSelectionMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}>
            {isSelectionMode ? 'Annuler' : 'Sélectionner'}
          </button>
        </div>
      </div>

      {/* Shipping type dropdown */}
      <div style={{ marginBottom: '0.875rem' }}>
        <select
          className="form-input form-select"
          value={filterShipping}
          onChange={(e) => { setFilterShipping(e.target.value); goToPage(1); }}
          style={{ width: '100%', height: '42px', padding: '0 2rem 0 0.75rem', fontSize: '0.8125rem', fontWeight: '600' }}
        >
          <option value="">Tous les types</option>
          <option value="ORDINAIRE">🚢 Ordinaire</option>
          <option value="EXPRESS">✈️ Express</option>
          <option value="COLIS_BATTERIE">🔋 Batterie</option>
        </select>
      </div>

      {/* Package list */}
      {loading && packages.length === 0 ? (
        // Skeleton — shown only on first load (no cache)
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pkg-item" style={{ marginBottom: '0.5rem', gap: '0.75rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton" style={{ height: '14px', width: '55%' }} />
                <div className="skeleton" style={{ height: '11px', width: '35%' }} />
                <div className="skeleton" style={{ height: '10px', width: '25%' }} />
              </div>
              <div className="skeleton" style={{ height: '28px', width: '72px', borderRadius: '20px' }} />
            </div>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Aucun colis</div>
          <div className="empty-text">{debouncedSearch ? 'Aucun résultat pour cette recherche.' : 'Commencez par ajouter un colis.'}</div>
        </div>
      ) : (
        packages.map((pkg) => (
          <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isSelectionMode && (
              <input type="checkbox" checked={selectedIds.includes(pkg.id)} onChange={() => toggleSelection(pkg.id)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', flexShrink: 0 }} />
            )}
            <Link href={isSelectionMode ? '#' : `/edit/${pkg.id}`}
              style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
              onClick={isSelectionMode ? (e) => { e.preventDefault(); toggleSelection(pkg.id); } : undefined}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  {!isSelectionMode && (
                    pkg.status === 'RECU_CHINE' ? (
                      <button className="btn btn-primary btn-sm" onClick={(e) => handleSendInTransit(e, pkg.id)}>
                        <Send size={12} />Transit
                      </button>
                    ) : (
                      <span className={`badge ${getBadgeClass(pkg.status)}`}>{getStatusLabel(pkg.status)}</span>
                    )
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.25rem 0 0.5rem' }}>
          <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1}
            style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', background: 'white', fontSize: '0.8125rem', fontWeight: '600', color: page === 1 ? 'var(--text-3)' : 'var(--text-1)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)' }}>
            ← Préc.
          </button>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-2)' }}>{page} / {totalPages}</span>
          <button onClick={() => goToPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', background: 'white', fontSize: '0.8125rem', fontWeight: '600', color: page === totalPages ? 'var(--text-3)' : 'var(--text-1)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)' }}>
            Suiv. →
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="bulk-bar">
          <div className="bulk-bar-title">{selectedIds.length} colis sélectionné{selectedIds.length > 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select className="form-input form-select" style={{ flex: 1, padding: '0.625rem 2.5rem 0.625rem 0.875rem', fontSize: '0.875rem' }}
              value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              <option value="">Changer le statut...</option>
              <option value="RECU_CHINE">Reçu en Chine</option>
              <option value="EN_TRANSIT">En Transit</option>
              <option value="ARRIVE_LOME">Arrivé à Lomé</option>
              <option value="LIVRE">Livré</option>
            </select>
            <button className="btn btn-primary" style={{ padding: '0.625rem 1rem', flexShrink: 0 }}
              disabled={!bulkStatus || isUpdating} onClick={handleBulkUpdate}>
              {isUpdating ? <span className="spinner" /> : 'OK'}
            </button>
          </div>
        </div>
      )}

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
