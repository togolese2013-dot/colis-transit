"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

const Icons = {
  Search: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Box: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    </svg>
  ),
  Plane: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5l-8.2-1.8c-.9-.2-1.8.1-2.4.7l-.5.5c-.4.4-.5 1-.2 1.4l7.2 3.6-3.6 7.2c-.4.4-.3 1 .1 1.4l.5.5c.6.6 1.5.9 2.4.7l8.2-1.8 3.5 3.5c1.5 1.5 3.5 1 4-.5s-.5-2.5-2-4l-3.5-3.5z"></path>
    </svg>
  ),
  Home: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    </svg>
  )
};

type Status = 'RECU_CHINE' | 'EN_TRANSIT' | 'ARRIVE_LOME' | 'LIVRE';

const STATUS_STEPS: { id: Status, label: string, icon: React.ReactNode }[] = [
  { id: 'RECU_CHINE', label: 'Reçu en Chine', icon: <Icons.Box /> },
  { id: 'EN_TRANSIT', label: 'En Transit', icon: <Icons.Plane /> },
  { id: 'ARRIVE_LOME', label: 'Arrivé à Lomé', icon: <Icons.Home /> },
  { id: 'LIVRE', label: 'Livré', icon: <Icons.Check /> },
];

export default function PublicTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError("");
    setPkg(null);

    const { data, error: supabaseError } = await supabase
      .from('packages')
      .select('*')
      .eq('tracking_number', trackingNumber.trim())
      .single();

    if (supabaseError || !data) {
      setError("Numéro de suivi introuvable. Veuillez vérifier votre saisie.");
    } else {
      setPkg(data);
    }
    setLoading(false);
  };

  const getStatusIndex = (status: Status) => {
    return STATUS_STEPS.findIndex(step => step.id === status);
  };

  return (
    <div className="container" style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Suivez votre colis</h1>
          <p style={{ color: '#64748b' }}>Entrez votre numéro de suivi pour voir l'état de votre livraison</p>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: '3rem' }}>
          <div style={{ position: 'relative', display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Icons.Search />
              </span>
              <input 
                type="text" 
                placeholder="Ex: YT123456789"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem 1.25rem 1.25rem 3.5rem', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '2px solid #e2e8f0',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                padding: '0 1.5rem', 
                borderRadius: 'var(--radius-lg)', 
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {loading ? "..." : "Suivre"}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #fecaca', textAlign: 'center', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {pkg && (
          <div style={{ 
            background: 'white', 
            borderRadius: 'var(--radius-xl)', 
            padding: '2rem', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            animation: 'slideUp 0.4s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Numéro de suivi</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>{pkg.tracking_number}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Destinataire</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>{pkg.customer_name}</div>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              {STATUS_STEPS.map((step, index) => {
                const isActive = index <= getStatusIndex(pkg.status as Status);
                const isCurrent = index === getStatusIndex(pkg.status as Status);

                return (
                  <div key={step.id} style={{ display: 'flex', gap: '1.5rem', marginBottom: index === STATUS_STEPS.length - 1 ? 0 : '2rem', position: 'relative' }}>
                    {/* Line between steps */}
                    {index < STATUS_STEPS.length - 1 && (
                      <div style={{ 
                        position: 'absolute', 
                        left: '1.25rem', 
                        top: '2.5rem', 
                        width: '2px', 
                        height: 'calc(100% - 0.5rem)', 
                        background: index < getStatusIndex(pkg.status as Status) ? 'var(--primary)' : '#e2e8f0',
                        zIndex: 1
                      }}></div>
                    )}

                    <div style={{ 
                      width: '2.5rem', 
                      height: '2.5rem', 
                      borderRadius: '50%', 
                      background: isActive ? 'var(--primary)' : 'white', 
                      border: `2px solid ${isActive ? 'var(--primary)' : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? 'white' : '#94a3b8',
                      zIndex: 2,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(255,102,0,0.15)' : 'none'
                    }}>
                      {isActive && index < getStatusIndex(pkg.status as Status) ? <Icons.Check /> : step.icon}
                    </div>

                    <div style={{ paddingTop: '0.4rem' }}>
                      <div style={{ 
                        fontWeight: '700', 
                        fontSize: '1.05rem', 
                        color: isActive ? '#1e293b' : '#94a3b8' 
                      }}>
                        {step.label}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginTop: '0.25rem' }}>
                          Statut actuel
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                <span style={{ fontWeight: '700' }}>Note :</span> Les délais peuvent varier en fonction des contrôles douaniers et des conditions de transport.
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>© 2026 Hamid Cargo Logistics — Chine & Togo</p>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
