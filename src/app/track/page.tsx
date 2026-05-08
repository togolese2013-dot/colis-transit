"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const TrackContent = () => {
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get("id") || "");
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RECU_CHINE": return { text: "Reçu en Chine 🇨🇳", color: "#f59e0b", bg: "#fef3c7" };
      case "EN_TRANSIT": return { text: "En Transit 🚢", color: "#3b82f6", bg: "#dbeafe" };
      case "ARRIVE_LOME": return { text: "Arrivé à Lomé 🇹🇬", color: "#10b981", bg: "#d1fae5" };
      case "LIVRE": return { text: "Livré ✅", color: "#6b7280", bg: "#f3f4f6" };
      default: return { text: status || "Inconnu", color: "#000", bg: "#eee" };
    }
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingNumber) return;

    setLoading(true);
    setError(null);
    setPackageData(null);

    try {
      // On sélectionne les colonnes une par une pour éviter les crashs si une colonne manque
      const { data, error: fetchError } = await supabase
        .from("packages")
        .select("tracking_number, status, customer_name, weight_kg, shipping_type, created_at, photo_url, photo_urls")
        .eq("tracking_number", trackingNumber.trim().toUpperCase())
        .maybeSingle(); // maybeSingle évite l'erreur si rien n'est trouvé

      if (fetchError) {
        // Si photo_urls manque, on réessaie sans elle
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("packages")
          .select("tracking_number, status, customer_name, weight_kg, shipping_type, created_at, photo_url")
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

  useEffect(() => {
    if (searchParams.get("id")) handleTrack();
  }, []);

  const calculatePrice = (pkg: any) => {
    if (!pkg?.weight_kg) return null;
    const rate = pkg.shipping_type === "EXPRESS" ? 13000 : 10000;
    return pkg.weight_kg * rate;
  };

  // Sécurité maximale pour les photos
  const getAllPhotos = () => {
    if (!packageData) return [];
    const photos = [];
    if (packageData.photo_urls && Array.isArray(packageData.photo_urls)) {
      photos.push(...packageData.photo_urls);
    } else if (packageData.photo_url) {
      photos.push(packageData.photo_url);
    }
    return photos.filter(url => url && typeof url === 'string');
  };

  const allPhotos = getAllPhotos();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2.2rem', fontWeight: '900' }}>Hamid Cargo</h1>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Suivi International Chine - Togo</p>
      </header>

      <form onSubmit={handleTrack} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="N° de Tracking (ex: JT...)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '2px solid #e2e8f0', fontSize: '1.2rem', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
          />
          <button type="submit" disabled={loading} style={{ position: 'absolute', right: '10px', top: '10px', bottom: '10px', padding: '0 25px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}>
            {loading ? "..." : "SUIVRE"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ background: '#fff1f2', color: '#e11d48', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', border: '1px solid #fee2e2' }}>
          {error}
        </div>
      )}

      {packageData && (
        <div style={{ background: 'white', borderRadius: '28px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '28px', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ background: getStatusLabel(packageData.status).bg, color: getStatusLabel(packageData.status).color, padding: '10px 24px', borderRadius: '24px', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              {getStatusLabel(packageData.status).text}
            </span>
            <h2 style={{ marginTop: '1.2rem', fontSize: '1.7rem', fontWeight: '900', letterSpacing: '-0.5px' }}>{packageData.tracking_number}</h2>
          </div>

          {/* Galerie Photos avec sécurité */}
          {allPhotos.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px', fontWeight: '700' }}>PHOTOS DU COLIS</p>
              <div style={{ display: 'grid', gridTemplateColumns: allPhotos.length > 1 ? '1fr 1fr' : '1fr', gap: '12px' }}>
                {allPhotos.map((url, index) => (
                  <div key={index} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', background: '#f8fafc' }}>
                    <img 
                      src={url} 
                      alt="Colis" 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Client</span>
                <span style={{ fontWeight: '700' }}>{packageData.customer_name || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Poids</span>
                <span style={{ fontWeight: '700' }}>{packageData.weight_kg ? `${packageData.weight_kg} kg` : 'Calcul en cours'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Service</span>
                <span style={{ fontWeight: '700', color: packageData.shipping_type === 'EXPRESS' ? '#ef4444' : '#000' }}>
                  {packageData.shipping_type || 'ORDINAIRE'}
                </span>
              </div>
            </div>
          </div>

          {packageData.weight_kg && (
            <div style={{ background: 'var(--primary-light)', padding: '24px', borderRadius: '20px', textAlign: 'center', border: '2px solid var(--primary)' }}>
              <p style={{ color: 'var(--primary)', fontWeight: '800', marginBottom: '8px' }}>TOTAL À PAYER</p>
              <h3 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--primary)' }}>{calculatePrice(packageData)?.toLocaleString()} FCFA</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '8px' }}>Chine ➜ Togo</p>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>© 2026 Hamid Cargo Logistics — Chine & Togo</p>
      </div>

      <style jsx global>{`
        :root { --primary: #FF6600; --primary-light: #FFF5F0; }
        body { background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
};

const TrackPage = () => (
  <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>}><TrackContent /></Suspense>
);

export default TrackPage;
