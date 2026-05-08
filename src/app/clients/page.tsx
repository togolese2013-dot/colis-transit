"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Search, Users, Home, Plus, BarChart2, User, Package, ChevronDown, ChevronUp, Phone } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  packageCount?: number;
  packages?: any[];
  expanded?: boolean;
}

export default function ClientsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pkgCache, setPkgCache] = useState<Record<string, any[]>>({});
  const [loadingPkgs, setLoadingPkgs] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: custData }, { data: pkgData }] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('packages').select('customer_name').not('customer_name', 'is', null),
      ]);

      if (custData) {
        const countMap: Record<string, number> = {};
        (pkgData || []).forEach((p: any) => {
          if (p.customer_name) countMap[p.customer_name] = (countMap[p.customer_name] || 0) + 1;
        });
        setCustomers(custData.map(c => ({ ...c, packageCount: countMap[c.name] || 0 })));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleExpand = async (customer: Customer) => {
    if (expandedId === customer.id) { setExpandedId(null); return; }
    setExpandedId(customer.id);
    if (pkgCache[customer.id]) return;
    setLoadingPkgs(customer.id);
    const { data } = await supabase
      .from('packages')
      .select('id, tracking_number, status, created_at, weight_kg')
      .eq('customer_name', customer.name)
      .order('created_at', { ascending: false });
    setPkgCache(prev => ({ ...prev, [customer.id]: data || [] }));
    setLoadingPkgs(null);
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

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'RECU_CHINE':  return 'badge-received';
      case 'EN_TRANSIT':  return 'badge-transit';
      case 'ARRIVE_LOME': return 'badge-arrived';
      case 'LIVRE':       return 'badge-delivered';
      default:            return 'badge-delivered';
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Clients</span>
        </div>
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.2rem 0.625rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-3)' }}>
          {loading ? '—' : customers.length}
        </div>
      </div>

      {/* Stats card */}
      <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', borderRadius: 'var(--r-2xl)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(249,115,22,0.2)' }}>
        <div>
          <p style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)', marginBottom: '0.25rem' }}>Base clients</p>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {loading ? '—' : customers.length}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-xl)', padding: '0.75rem', color: 'white' }}>
          <Users size={24} strokeWidth={1.75} />
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <span className="search-ico"><Search size={16} /></span>
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Aucun client</div>
          <div className="empty-text">{searchQuery ? 'Aucun résultat.' : 'Les clients sont créés automatiquement à l\'ajout de colis.'}</div>
        </div>
      ) : (
        filtered.map(customer => (
          <div key={customer.id} style={{ marginBottom: '0.5rem' }}>
            <div
              className="pkg-item"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleExpand(customer)}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '1.5px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)', fontWeight: '800', fontSize: '0.875rem' }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pkg-number" style={{ fontSize: '0.9375rem' }}>{customer.name}</div>
                <div className="pkg-meta">
                  {customer.phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={10} />{customer.phone}</span>
                  ) : 'Aucun téléphone'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                {(customer.packageCount || 0) > 0 && (
                  <span style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Package size={10} /> {customer.packageCount}
                  </span>
                )}
                {expandedId === customer.id ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
              </div>
            </div>

            {/* Expanded packages */}
            {expandedId === customer.id && (
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0 0 var(--r-xl) var(--r-xl)', padding: '0.625rem', marginTop: '-4px' }}>
                {loadingPkgs === customer.id ? (
                  <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-3)', fontSize: '0.8125rem' }}>Chargement...</div>
                ) : (pkgCache[customer.id] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-3)', fontSize: '0.8125rem' }}>Aucun colis trouvé.</div>
                ) : (
                  (pkgCache[customer.id] || []).map(pkg => (
                    <Link key={pkg.id} href={`/edit/${pkg.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.625rem', borderRadius: 'var(--r-lg)', marginBottom: '0.25rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-1)' }}>{pkg.tracking_number}</span>
                        <span className={`badge ${getBadgeClass(pkg.status)}`} style={{ fontSize: '0.6875rem' }}>{getStatusLabel(pkg.status)}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn active" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
