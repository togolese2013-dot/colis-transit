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
      default: return { text: status, color: "#000", bg: "#eee" };
    }
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingNumber) return;

    setLoading(true);
    setError(null);
    setPackageData(null);

    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("tracking_number", trackingNumber.trim().toUpperCase())
        .single();

      if (error) throw new Error("Colis non trouvé.");
      setPackageData(data);
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
    if (!pkg.weight_kg) return null;
    const rate = pkg.shipping_type === "EXPRESS" ? 13000 : 10000;
    return pkg.weight_kg * rate;
  };

  // Liste des photos (soit photo_urls, soit l'ancienne photo_url seule)
  const allPhotos = packageData?.photo_urls && packageData.photo_urls.length > 0 
    ? packageData.photo_urls 
    : (packageData?.photo_url ? [packageData.photo_url] : []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: '800' }}>Hamid Cargo</h1>
        <p style={{ color: '#64748b' }}>Suivi de colis international</p>
      </header>

      <form onSubmit={handleTrack} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Numéro de tracking..."
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '2px solid #e2e8f0', fontSize: '1.1rem', outline: 'none' }}
          />
          <button type="submit" disabled={loading} style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px', padding: '0 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
            {loading ? "..." : "SUIVRE"}
          </button>
        </div>
      </form>

      {error && <div style={{ background: '#fff1f2', color: '#e11d48', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>{error}</div>}

      {packageData && (
        <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ background: getStatusLabel(packageData.status).bg, color: getStatusLabel(packageData.status).color, padding: '8px 20px', borderRadius: '20px', fontWeight: '700' }}>
              {getStatusLabel(packageData.status).text}
            </span>
            <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: '900' }}>{packageData.tracking_number}</h2>
          </div>

          {/* GALERIE PHOTOS CLIENT */}
          {allPhotos.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px', fontWeight: '600' }}>Photos du colis ({allPhotos.length})</p>
              <div style={{ display: 'grid', gridTemplateColumns: allPhotos.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
                {allPhotos.map((url: string, index: number) => (
                  <div key={index} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                    <img src={url} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '2rem', padding: '15px', background: '#f8fafc', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Client</span>
              <span style={{ fontWeight: '600' }}>{packageData.customer_name || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Poids</span>
              <span style={{ fontWeight: '600' }}>{packageData.weight_kg ? `${packageData.weight_kg} kg` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Type</span>
              <span style={{ fontWeight: '600' }}>{packageData.shipping_type}</span>
            </div>
          </div>

          {packageData.weight_kg && (
            <div style={{ background: 'var(--primary-light)', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '2px solid var(--primary)' }}>
              <p style={{ color: 'var(--primary)', fontWeight: '700' }}>Total à payer</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>{calculatePrice(packageData)?.toLocaleString()} FCFA</h3>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        :root { --primary: #FF6600; --primary-light: #FFF5F0; }
        body { background-color: #f8fafc; font-family: sans-serif; }
      `}</style>
    </div>
  );
};

const TrackPage = () => (
  <Suspense fallback={<div>Chargement...</div>}><TrackContent /></Suspense>
);

export default TrackPage;
