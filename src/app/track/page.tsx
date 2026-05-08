"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Composant interne pour gérer useSearchParams
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

      if (error) throw new Error("Colis non trouvé. Vérifiez le numéro.");
      setPackageData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("id")) {
      handleTrack();
    }
  }, []);

  // Calcul du prix
  const calculatePrice = (pkg: any) => {
    if (!pkg.weight_kg) return null;
    const rate = pkg.shipping_type === "EXPRESS" ? 13000 : 10000;
    return pkg.weight_kg * rate;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: '800' }}>Hamid Cargo</h1>
        <p style={{ color: '#64748b' }}>Suivi de colis en temps réel</p>
      </header>

      <form onSubmit={handleTrack} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Entrez votre numéro de tracking (ex: JT...)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              fontSize: '1.1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              bottom: '8px',
              padding: '0 24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {loading ? "..." : "SUIVRE"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ background: '#fff1f2', color: '#e11d48', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {packageData && (
        <div className="track-result" style={{ 
          background: 'white', 
          borderRadius: '24px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          padding: '24px',
          border: '1px solid #f1f5f9'
        }}>
          {/* Status Badge */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{
              background: getStatusLabel(packageData.status).bg,
              color: getStatusLabel(packageData.status).color,
              padding: '8px 20px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '0.9rem',
              display: 'inline-block'
            }}>
              {getStatusLabel(packageData.status).text}
            </span>
            <h2 style={{ marginTop: '1rem', fontSize: '1.4rem', fontWeight: '800' }}>{packageData.tracking_number}</h2>
          </div>

          {/* Photo du Colis */}
          {packageData.photo_url && (
            <div style={{ marginBottom: '2rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
              <img src={packageData.photo_url} alt="Photo du colis" style={{ width: '100%', display: 'block' }} />
            </div>
          )}

          {/* Informations détaillées */}
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Destinataire</span>
              <span style={{ fontWeight: '600' }}>{packageData.customer_name || 'Non renseigné'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Poids</span>
              <span style={{ fontWeight: '600' }}>{packageData.weight_kg ? `${packageData.weight_kg} kg` : 'En attente'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Type d'envoi</span>
              <span style={{ fontWeight: '600', color: packageData.shipping_type === 'EXPRESS' ? '#ef4444' : '#000' }}>
                {packageData.shipping_type === 'EXPRESS' ? 'EXPRESS 🚀' : 'ORDINAIRE'}
              </span>
            </div>
          </div>

          {/* Montant à payer */}
          {packageData.weight_kg && (
            <div style={{ 
              background: 'var(--primary-light)', 
              padding: '20px', 
              borderRadius: '16px', 
              textAlign: 'center',
              border: '1px solid var(--primary)'
            }}>
              <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>Total à payer</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)' }}>
                {calculatePrice(packageData)?.toLocaleString()} FCFA
              </h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '5px' }}>
                Tarif : {packageData.shipping_type === 'EXPRESS' ? '13 000' : '10 000'} FCFA / kg
              </p>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mis à jour le {new Date(packageData.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>© 2026 Hamid Cargo Logistics — Chine & Togo</p>
      </div>

      <style jsx global>{`
        :root {
          --primary: #FF6600;
          --primary-light: #FFF5F0;
        }
        body {
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
};

// Composant principal avec Suspense
const TrackPage = () => {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>}>
      <TrackContent />
    </Suspense>
  );
};

export default TrackPage;
