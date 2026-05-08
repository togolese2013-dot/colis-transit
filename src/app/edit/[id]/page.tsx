"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, MessageCircle, Home, Plus, BarChart2, User, Users, X } from "lucide-react";

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
    case 'RECU_CHINE':  return '🇨🇳 Reçu en Chine';
    case 'EN_TRANSIT':  return '🚢 En Transit';
    case 'ARRIVE_LOME': return '🇹🇬 Arrivé à Lomé';
    case 'LIVRE':       return '✅ Livré';
    default:            return status;
  }
};

export default function EditPackage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [pkg, setPkg]             = useState<any>(null);
  const [status, setStatus]       = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes]         = useState("");
  const [isClaiming, setIsClaiming]     = useState(false);
  const [photoUrls, setPhotoUrls]         = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function fetchPackage() {
      const { data, error } = await supabase.from('packages').select('*').eq('id', id).single();
      if (error) setError("Colis introuvable.");
      else {
        setPkg(data);
        setStatus(data.status);
        setCustomerName(data.customer_name || "");
        setNotes(data.notes || "");

        const rawUrls: string[] = Array.isArray(data.photo_urls) && data.photo_urls.length > 0
          ? data.photo_urls
          : data.photo_url ? [data.photo_url] : [];
        setPhotoUrls(rawUrls);
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
    const message = `Bonjour ${pkg.customer_name || 'Cher client'}, votre colis (Suivi: ${pkg.tracking_number}) est maintenant : ${pkg.status.replace('_', ' ')}. Suivez-le ici : ${window.location.origin}/track?id=${pkg.tracking_number}`;
    const phone = pkg.customer_phone ? pkg.customer_phone.replace(/\s+/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: updateError } = await supabase.from('packages').update({ status, notes: notes || null }).eq('id', id);
    if (!updateError) router.push("/chine");
    setSaving(false);
  };

  const lightboxPrev = () => setLightboxIndex(i => i !== null ? (i - 1 + photoUrls.length) % photoUrls.length : null);
  const lightboxNext = () => setLightboxIndex(i => i !== null ? (i + 1) % photoUrls.length : null);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? lightboxNext() : lightboxPrev();
    touchStartX.current = null;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner-dark spinner" />
    </div>
  );

  if (!pkg) return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <p style={{ color: 'var(--text-3)' }}>{error || 'Colis introuvable.'}</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Détails colis</span>
        </div>
        <span className={`badge ${getBadgeClass(pkg.status)}`}>
          {getStatusLabel(pkg.status)}
        </span>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>

          {/* Counter */}
          {photoUrls.length > 1 && (
            <span style={{
              position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: '600',
            }}>
              {lightboxIndex + 1} / {photoUrls.length}
            </span>
          )}

          {/* Prev */}
          {photoUrls.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxPrev(); }}
              style={{
                position: 'absolute', left: '0.75rem',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', fontSize: '1.25rem',
              }}
            >‹</button>
          )}

          {/* Image */}
          <img
            src={photoUrls[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '94vw', maxHeight: '88vh',
              objectFit: 'contain', borderRadius: '8px',
              userSelect: 'none',
            }}
          />

          {/* Next */}
          {photoUrls.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxNext(); }}
              style={{
                position: 'absolute', right: '0.75rem',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', fontSize: '1.25rem',
              }}
            >›</button>
          )}
        </div>
      )}

      {/* Photos */}
      {photoUrls.length > 0 ? (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.25rem' }}>
          {photoUrls.map((url, i) => (
            <div
              key={i}
              onClick={() => setLightboxIndex(i)}
              style={{
                flexShrink: 0, borderRadius: 'var(--r-xl)', overflow: 'hidden',
                border: '1.5px solid var(--border)', background: 'var(--bg-subtle)',
                width: photoUrls.length === 1 ? '100%' : '200px',
                height: '200px', cursor: 'pointer',
              }}
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          borderRadius: 'var(--r-2xl)', border: '1.5px solid var(--border)',
          marginBottom: '1rem', background: 'var(--bg-subtle)',
          height: '140px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-3)',
        }}>
          <Package size={36} strokeWidth={1.5} />
          <span style={{ fontSize: '0.8125rem' }}>Aucune photo</span>
        </div>
      )}

      {/* Info card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.0625rem', fontWeight: '700', color: 'var(--text-1)', marginBottom: '1rem', letterSpacing: '0.02em' }}>
          {pkg.tracking_number}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {pkg.customer_name && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Client</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-1)' }}>{pkg.customer_name}</span>
            </div>
          )}
          {pkg.customer_phone && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Téléphone</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-1)' }}>{pkg.customer_phone}</span>
            </div>
          )}
          {pkg.weight_kg && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Poids</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-1)' }}>{pkg.weight_kg} kg</span>
            </div>
          )}
        </div>

        {/* Claim button */}
        {!pkg.customer_name && !isClaiming && (
          <button
            onClick={() => setIsClaiming(true)}
            className="btn btn-secondary btn-full btn-sm"
            style={{ marginTop: '1rem', borderRadius: 'var(--r-lg)' }}
          >
            C'est mon colis ?
          </button>
        )}

        {/* Claim form */}
        {isClaiming && (
          <form onSubmit={handleClaim} style={{ marginTop: '1rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
            <label className="form-label">Votre nom</label>
            <input
              type="text"
              className="form-input"
              style={{ marginBottom: '0.625rem' }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Valider'}
              </button>
              <button type="button" onClick={() => setIsClaiming(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* WhatsApp */}
        {pkg.customer_phone && (
          <button
            onClick={handleWhatsAppNotify}
            style={{
              marginTop: '1rem', width: '100%',
              background: '#25D366', color: 'white', border: 'none',
              padding: '0.75rem', borderRadius: 'var(--r-lg)',
              fontWeight: '600', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            <MessageCircle size={16} />
            Notifier via WhatsApp
          </button>
        )}
      </div>

      {/* Notes internes */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.6875rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0.1rem 0.5rem', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</span>
          Notes internes
        </label>
        <textarea
          className="form-input"
          placeholder="Fragile, paiement en attente, instructions spéciales..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          style={{ resize: 'none', fontSize: '0.875rem', lineHeight: 1.5 }}
        />
      </div>

      {/* Status form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-field" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Modifier le statut</label>
          <select className="form-input form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="RECU_CHINE">🇨🇳 Reçu en Chine</option>
            <option value="EN_TRANSIT">🚢 En Transit</option>
            <option value="ARRIVE_LOME">🇹🇬 Arrivé à Lomé</option>
            <option value="LIVRE">✅ Livré</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? <><span className="spinner" />Mise à jour...</> : 'Enregistrer'}
        </button>
      </form>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
