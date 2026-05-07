"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const Icons = {
  Back: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  Box: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  Share: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
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

export default function EditPackage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    async function fetchPackage() {
      const { data, error } = await supabase.from('packages').select('*').eq('id', id).single();
      if (error) setError("Colis introuvable.");
      else {
        setPkg(data);
        setStatus(data.status);
        setCustomerName(data.customer_name || "");
      }
      setLoading(false);
    }
    fetchPackage();
  }, [id]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: updateError } = await supabase.from('packages').update({ customer_name: customerName }).eq('id', id);
    if (!updateError) {
      setPkg({ ...pkg, customer_name: customerName });
      setIsClaiming(false);
    }
    setSaving(false);
  };

  const handleWhatsAppNotify = () => {
    const message = `Bonjour ${pkg.customer_name || 'Cher client'}, votre colis (Suivi: ${pkg.tracking_number}) est maintenant : ${pkg.status.replace('_', ' ')}. Suivez-le ici : ${window.location.origin}/edit/${id}`;
    const phone = pkg.customer_phone ? pkg.customer_phone.replace(/\s+/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: updateError } = await supabase.from('packages').update({ status }).eq('id', id);
    if (!updateError) router.push("/");
    setSaving(false);
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Chargement...</div>;
  if (!pkg) return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>{error}</div>;

  return (
    <div className="container">
      <header className="header">
        <button className="back-btn" onClick={() => router.push("/")}><Icons.Back /></button>
        <h1>Détails</h1>
      </header>

      <div className="package-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {pkg.photo_url ? (
          <img src={pkg.photo_url} alt="Colis" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '160px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Icons.Box />
          </div>
        )}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>{pkg.tracking_number}</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{pkg.item_name || 'Sans nom'}</div>
          
          {pkg.customer_name && (
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <strong>Client :</strong> {pkg.customer_name}
            </div>
          )}

          {pkg.customer_phone && (
            <div style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
              <strong>Tél :</strong> {pkg.customer_phone}
            </div>
          )}

          {!pkg.customer_name && !isClaiming && (
              <button 
                onClick={() => setIsClaiming(true)}
                style={{ 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  border: 'none', 
                  padding: '0.5rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontWeight: '600', 
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                C'est mon colis ?
              </button>
          )}

          {isClaiming && (
            <form onSubmit={handleClaim} style={{ marginBottom: '1rem', background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <label className="form-label">Entrez votre nom</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ marginBottom: '0.5rem' }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }} disabled={saving}>
                  {saving ? '...' : 'Valider'}
                </button>
                <button type="button" onClick={() => setIsClaiming(false)} style={{ flex: 1, padding: '0.5rem', background: '#eee', border: 'none', borderRadius: 'var(--radius-md)' }}>
                  Annuler
                </button>
              </div>
            </form>
          )}

          <div className="package-badge">{pkg.status.replace('_', ' ')}</div>

          <button 
            onClick={handleWhatsAppNotify}
            style={{ 
              marginTop: '1rem',
              width: '100%',
              background: '#25D366', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: '600', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Icons.Share />
            Notifier via WhatsApp
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="package-card">
        <div className="form-group">
          <label className="form-label">Modifier le statut</label>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="RECU_CHINE">Reçu en Chine</option>
            <option value="EN_TRANSIT">En Transit (Départ Chine)</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Mise à jour..." : "Enregistrer les modifications"}
        </button>
      </form>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item"><Icons.Home /></Link>
        <Link href="/" className="nav-item active"><Icons.Box /></Link>
        <Link href="/add" className="nav-item" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', boxShadow: 'var(--shadow-lg)' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item"><Icons.BarChart /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>
    </div>
  );
}
