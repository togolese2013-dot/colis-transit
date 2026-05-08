"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Search, Package, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EntryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ packages: any[]; customers: any[] }>({ packages: [], customers: [] });
  const [searching, setSearching] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role === 'superadmin') setIsSuperAdmin(true) })
      .catch(() => {})
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults({ packages: [], customers: [] }); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const [{ data: pkgs }, { data: custs }] = await Promise.all([
        supabase.from('packages').select('id, tracking_number, customer_name, status').or(`tracking_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`).limit(6),
        supabase.from('customers').select('id, name, phone').ilike('name', `%${query}%`).limit(4),
      ]);
      setResults({ packages: pkgs || [], customers: custs || [] });
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results.packages.length > 0 || results.customers.length > 0;
  const showResults = query.length >= 2;

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '3rem 1.5rem 2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', color: 'white',
            boxShadow: '0 8px 24px rgba(249,115,22,0.28)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 0 }}>
            Hamid Cargo
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', fontWeight: '500' }}>
            Envoi de colis · Chine &amp; Togo
          </p>
        </div>

        {/* Global search */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: 'white', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-full)', padding: '0.625rem 1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'border-color 0.15s',
          }}
            onFocus={() => {}}
          >
            {searching
              ? <span className="spinner-dark" style={{ width: '16px', height: '16px', borderWidth: '2px', flexShrink: 0 }} />
              : <Search size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
            }
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher un colis ou un client..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'none',
                fontSize: '0.875rem', color: 'var(--text-1)',
                fontFamily: 'var(--font)',
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 0, flexShrink: 0 }}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {showResults && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'white', border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-2xl)', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 50, animation: 'fadeIn 0.15s ease-out',
            }}>
              {!hasResults && !searching ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                  Aucun résultat pour « {query} »
                </div>
              ) : (
                <>
                  {results.packages.length > 0 && (
                    <div>
                      <div style={{ padding: '0.625rem 1rem 0.25rem', fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
                        Colis
                      </div>
                      {results.packages.map(pkg => (
                        <Link key={pkg.id} href={`/edit/${pkg.id}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setQuery("")}>
                          <div className="search-result-item">
                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-lg)', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={15} color="var(--accent)" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-1)' }}>{pkg.tracking_number}</div>
                              {pkg.customer_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{pkg.customer_name}</div>}
                            </div>
                            <span className={`badge ${getBadgeClass(pkg.status)}`} style={{ fontSize: '0.6875rem', flexShrink: 0 }}>{getStatusLabel(pkg.status)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.customers.length > 0 && (
                    <div style={{ borderTop: results.packages.length > 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ padding: '0.625rem 1rem 0.25rem', fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
                        Clients
                      </div>
                      {results.customers.map(c => (
                        <Link key={c.id} href={`/clients`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setQuery("")}>
                          <div className="search-result-item">
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '800', fontSize: '0.8125rem', color: 'var(--accent)' }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-1)' }}>{c.name}</div>
                              {c.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{c.phone}</div>}
                            </div>
                            <User size={14} color="var(--text-3)" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Espace Chine */}
          <Link href="/chine" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
              padding: '1.5rem', borderRadius: '20px', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              boxShadow: '0 8px 32px rgba(249,115,22,0.22)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 14px 40px rgba(249,115,22,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(249,115,22,0.22)'; }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75, marginBottom: '0.375rem' }}>Warehouse · Guangzhou</div>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>Espace Chine</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', margin: 0 }}>Réceptions &amp; expéditions</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.9 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5l-8.2-1.8c-.9-.2-1.8.1-2.4.7l-.5.5c-.4.4-.5 1-.2 1.4l7.2 3.6-3.6 7.2c-.4.4-.3 1 .1 1.4l.5.5c.6.6 1.5.9 2.4.7l8.2-1.8 3.5 3.5c1.5 1.5 3.5 1 4-.5s-.5-2.5-2-4l-3.5-3.5z" />
                </svg>
                <ArrowRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </Link>

          {/* Espace Togo */}
          <Link href="/lome" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              padding: '1.5rem', borderRadius: '20px', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              boxShadow: '0 8px 32px rgba(59,130,246,0.22)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 14px 40px rgba(59,130,246,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(59,130,246,0.22)'; }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75, marginBottom: '0.375rem' }}>Livraison · Lomé</div>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>Espace Togo</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', margin: 0 }}>Arrivées &amp; livraisons</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.9 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <ArrowRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        </div>

        {isSuperAdmin && <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            href="/admin"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-3)',
              textDecoration: 'none',
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--r-full)',
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              display: 'inline-block',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
          >
            admin
          </Link>
        </div>}

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
          © 2026 Hamid Cargo Logistics
        </p>
      </div>
    </div>
  );
}
