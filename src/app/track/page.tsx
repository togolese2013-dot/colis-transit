"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ArrowRight, Package, CheckCircle, Phone, User } from "lucide-react";

const STATUS_STEPS = ['RECU_CHINE', 'EN_TRANSIT', 'ARRIVE_LOME', 'LIVRE'];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "RECU_CHINE":   return { label: "Reçu en Chine",   flag: "🇨🇳", badgeClass: "badge-received" };
    case "EN_TRANSIT":   return { label: "En Transit",       flag: "🚢", badgeClass: "badge-transit"  };
    case "ARRIVE_LOME":  return { label: "Arrivé à Lomé",   flag: "🇹🇬", badgeClass: "badge-arrived"  };
    case "LIVRE":        return { label: "Livré",            flag: "✅", badgeClass: "badge-delivered" };
    default:             return { label: status || "Inconnu", flag: "",   badgeClass: "badge-delivered" };
  }
};

const TrackContent = () => {
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get("id") || "");
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError(null);
    setPackageData(null);
    setClaimSuccess(false);

    try {
      const { data, error: fetchError } = await supabase
        .from("packages")
        .select("id, tracking_number, status, customer_name, customer_phone, weight_kg, shipping_type, created_at, photo_url, photo_urls")
        .eq("tracking_number", trackingNumber.trim().toUpperCase())
        .maybeSingle();

      if (fetchError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("packages")
          .select("id, tracking_number, status, customer_name, customer_phone, weight_kg, shipping_type, created_at, photo_url")
          .eq("tracking_number", trackingNumber.trim().toUpperCase())
          .maybeSingle();

        if (fallbackError || !fallbackData) throw new Error("Colis non trouvé. Vérifiez le numéro.");
        setPackageData(fallbackData);
      } else {
        if (!data) throw new Error("Colis non trouvé.");
        setPackageData(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimName.trim() || !packageData?.id) return;
    setClaimLoading(true);
    setClaimError(null);

    try {
      const { error } = await supabase
        .from("packages")
        .update({ customer_name: claimName.trim(), customer_phone: claimPhone.trim() || null })
        .eq("id", packageData.id);

      if (error) throw error;

      await supabase.from("customers").upsert(
        { name: claimName.trim(), phone: claimPhone.trim() || null },
        { onConflict: "name" }
      );

      setPackageData((prev: any) => ({ ...prev, customer_name: claimName.trim(), customer_phone: claimPhone.trim() || null }));
      setClaimSuccess(true);
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("id")) handleTrack();
  }, []);

  const calculatePrice = (pkg: any) => {
    if (!pkg?.weight_kg) return null;
    const rate = pkg.shipping_type === "EXPRESS" ? 13000 : 10000;
    return pkg.weight_kg * rate;
  };

  const getAllPhotos = () => {
    if (!packageData) return [];
    const photos: string[] = [];
    if (packageData.photo_urls && Array.isArray(packageData.photo_urls)) {
      photos.push(...packageData.photo_urls);
    } else if (packageData.photo_url) {
      photos.push(packageData.photo_url);
    }
    return photos.filter(url => url && typeof url === 'string');
  };

  const allPhotos = getAllPhotos();
  const statusCfg = packageData ? getStatusConfig(packageData.status) : null;
  const currentStep = packageData ? STATUS_STEPS.indexOf(packageData.status) : -1;
  const fillPct = currentStep > 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.75rem 1.25rem 0' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: '800', fontSize: '1.0625rem', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Hamid Cargo</span>
          </Link>

          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Suivi de colis
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>
            Chine → Togo · Entrez votre numéro de suivi
          </p>

          <form onSubmit={handleTrack}>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={17} color="var(--text-3)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Ex: JT0123456789..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  style={{
                    width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                    fontSize: '16px', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--r-xl)', outline: 'none', fontFamily: 'var(--font)',
                    background: 'white', color: 'var(--text-1)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--accent)', color: 'white', border: 'none',
                  borderRadius: 'var(--r-xl)', padding: '0 1.375rem',
                  fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'background 0.15s', whiteSpace: 'nowrap',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <span className="spinner" /> : <><span>Suivre</span><ArrowRight size={15} strokeWidth={2.5} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>

        {error && (
          <div style={{
            background: 'var(--error-subtle)', color: 'var(--error)',
            padding: '1rem 1.25rem', borderRadius: 'var(--r-xl)',
            border: '1.5px solid var(--error-border)', fontSize: '0.875rem',
            fontWeight: '500', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {packageData && statusCfg && (
          <div className="animate-in">

            {/* Status badge */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span className={`badge ${statusCfg.badgeClass}`} style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }}>
                {statusCfg.flag} {statusCfg.label}
              </span>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: '700',
                color: 'var(--text-1)', letterSpacing: '0.03em', marginTop: '0.75rem',
              }}>
                {packageData.tracking_number}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '1.5rem', marginBottom: '1rem' }}>
              <p style={{ marginBottom: '1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', fontWeight: '600' }}>
                Progression
              </p>
              <div className="timeline-wrap">
                <div className="timeline-track" />
                <div className="timeline-fill" style={{ width: `calc(${fillPct}% * (100% - 22px) / 100% + ${fillPct > 0 ? 11 : 0}px)` }} />
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className={`t-dot ${i < currentStep ? 'done' : i === currentStep ? 'current' : ''}`}>
                    {i < currentStep && <CheckCircle size={11} color="white" strokeWidth={3} />}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.625rem' }}>
                {['Chine', 'Transit', 'Lomé', 'Livré'].map((l, i) => (
                  <span key={i} style={{
                    fontSize: '0.6875rem', fontWeight: i <= currentStep ? '600' : '400',
                    color: i <= currentStep ? 'var(--accent)' : 'var(--text-3)',
                    textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
                    flex: 1,
                  }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Photos */}
            {allPhotos.length > 0 && (
              <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '1.5rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: '0.875rem' }}>
                  Photos du colis
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: allPhotos.length > 1 ? '1fr 1fr' : '1fr', gap: '0.625rem' }}>
                  {allPhotos.map((url, index) => (
                    <div key={index} style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-subtle)', aspectRatio: '4/3' }}>
                      <img
                        src={url}
                        alt="Colis"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '1.5rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: '0.875rem' }}>
                Informations
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Client', value: packageData.customer_name || '—' },
                  { label: 'Téléphone', value: packageData.customer_phone || '—' },
                  { label: 'Poids', value: packageData.weight_kg ? `${packageData.weight_kg} kg` : '—' },
                  { label: 'Service', value: packageData.shipping_type === 'EXPRESS' ? 'Express 🚀' : 'Ordinaire', accent: packageData.shipping_type === 'EXPRESS' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: row.accent ? 'var(--error)' : 'var(--text-1)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            {packageData.weight_kg && (
              <div style={{
                background: 'var(--accent-subtle)', border: '2px solid var(--accent-border)',
                borderRadius: 'var(--r-2xl)', padding: '1.5rem', textAlign: 'center',
                marginBottom: '1rem',
              }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                  Total à payer
                </p>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>
                  {calculatePrice(packageData)?.toLocaleString()} FCFA
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--accent)', opacity: 0.7 }}>
                  {packageData.shipping_type === 'EXPRESS' ? '13 000' : '10 000'} FCFA/kg · Chine → Togo
                </p>
              </div>
            )}

            {/* Claim — shown only when no customer name */}
            {!packageData.customer_name && !claimSuccess && (
              <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '1.5rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: '0.25rem' }}>
                  Ce colis vous appartient ?
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                  Renseignez vos informations pour réclamer ce colis.
                </p>
                <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="var(--text-3)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Votre nom complet *"
                      value={claimName}
                      onChange={e => setClaimName(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '0.8125rem 1rem 0.8125rem 2.5rem',
                        fontSize: '16px', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--r-lg)', outline: 'none',
                        fontFamily: 'var(--font)', background: 'var(--bg-subtle)',
                        color: 'var(--text-1)', transition: 'border-color 0.15s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="var(--text-3)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="tel"
                      placeholder="Votre téléphone"
                      value={claimPhone}
                      onChange={e => setClaimPhone(e.target.value)}
                      style={{
                        width: '100%', padding: '0.8125rem 1rem 0.8125rem 2.5rem',
                        fontSize: '16px', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--r-lg)', outline: 'none',
                        fontFamily: 'var(--font)', background: 'var(--bg-subtle)',
                        color: 'var(--text-1)', transition: 'border-color 0.15s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  {claimError && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--error)', fontWeight: '500' }}>{claimError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={claimLoading || !claimName.trim()}
                    style={{
                      background: 'var(--accent)', color: 'white', border: 'none',
                      borderRadius: 'var(--r-lg)', padding: '0.875rem',
                      fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer',
                      opacity: (claimLoading || !claimName.trim()) ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}
                  >
                    {claimLoading ? <><span className="spinner" />Envoi...</> : 'Réclamer ce colis'}
                  </button>
                </form>
              </div>
            )}

            {claimSuccess && (
              <div style={{
                background: 'var(--success-subtle)', border: '1.5px solid var(--success-border)',
                borderRadius: 'var(--r-2xl)', padding: '1.25rem', textAlign: 'center',
                marginBottom: '1rem',
              }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--success)' }}>
                  ✅ Colis réclamé avec succès !
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--success)', opacity: 0.8, marginTop: '0.25rem' }}>
                  Vos informations ont été enregistrées.
                </p>
              </div>
            )}

          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
          © 2026 Hamid Cargo Logistics
        </p>
      </div>
    </div>
  );
};

const TrackPage = () => (
  <Suspense fallback={
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner-dark spinner" />
    </div>
  }>
    <TrackContent />
  </Suspense>
);

export default TrackPage;
