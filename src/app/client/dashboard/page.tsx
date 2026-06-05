'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, LogOut, ChevronRight, Clock, Home } from 'lucide-react'

interface ClientPackage {
  id: string
  tracking_number: string
  status: string
  weight_kg: number | null
  shipping_type: string
  photo_urls: string[] | null
  photo_url: string | null
  created_at: string
  notes: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; step: number }> = {
  RECU_CHINE:  { label: 'Reçu en Chine',   color: '#f59e0b', bg: '#fef3c7', border: '#fde68a', step: 1 },
  EN_TRANSIT:  { label: 'En transit',       color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', step: 2 },
  ARRIVE_LOME: { label: 'Arrivé à Lomé',   color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', step: 3 },
  LIVRE:       { label: 'Livré',            color: '#10b981', bg: '#d1fae5', border: '#a7f3d0', step: 4 },
}

const PRICE_MAP: Record<string, number> = { ORDINAIRE: 10000, EXPRESS: 13000, COLIS_BATTERIE: 11000 }

export default function ClientDashboard() {
  const router = useRouter()
  const [packages, setPackages] = useState<ClientPackage[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/client/packages')
      .then(r => {
        if (r.status === 401) { router.push('/client/login'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        if (data.error) { setError(data.error); return }
        setPackages(data.packages ?? [])
        setName(data.name ?? '')
        setLoading(false)
      })
      .catch(() => setError('Erreur de connexion'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    await fetch('/api/client/logout', { method: 'POST' })
    router.push('/')
  }

  function getPrice(pkg: ClientPackage) {
    if (!pkg.weight_kg) return null
    const rate = PRICE_MAP[pkg.shipping_type] ?? 10000
    return (pkg.weight_kg * rate).toLocaleString('fr-FR')
  }

  const steps = ['Reçu Chine', 'En transit', 'Arrivé Lomé', 'Livré']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Mes colis</div>
            {name && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{name}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Home size={16} color="var(--text-2)" />
            </button>
          </Link>
          <button onClick={handleLogout} style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--error-border)', background: 'var(--error-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <LogOut size={16} color="var(--error)" />
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.25rem' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Chargement…</div>
        )}

        {error && (
          <div style={{ background: 'var(--error-subtle)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', padding: '1rem', color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-1)', marginBottom: '0.5rem' }}>Aucun colis trouvé</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
              Vos colis apparaîtront ici une fois enregistrés avec votre numéro de téléphone.
            </p>
          </div>
        )}

        {!loading && packages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem', marginBottom: '0.25rem' }}>
              {[
                { label: 'Total colis', value: packages.length, color: 'var(--text-1)' },
                { label: 'En cours', value: packages.filter(p => p.status !== 'LIVRE').length, color: 'var(--accent)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.625rem', fontWeight: '900', color, letterSpacing: '-0.02em' }}>{value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Package list */}
            {packages.map(pkg => {
              const cfg = STATUS_CONFIG[pkg.status] ?? STATUS_CONFIG.RECU_CHINE
              const photo = pkg.photo_urls?.[0] ?? pkg.photo_url
              const price = getPrice(pkg)
              return (
                <Link key={pkg.id} href={`/track?id=${encodeURIComponent(pkg.tracking_number)}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', transition: 'box-shadow 0.15s' }}>

                    {/* Photo strip */}
                    {photo && (
                      <div style={{ height: '120px', background: '#f8fafc', overflow: 'hidden' }}>
                        <img src={photo} alt="colis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ padding: '1rem 1.125rem' }}>
                      {/* Tracking + status */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-1)', letterSpacing: '0.02em' }}>
                            {pkg.tracking_number}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <Clock size={11} color="var(--text-3)" />
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>
                              {new Date(pkg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--r-full)', padding: '0.2rem 0.625rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        {steps.map((_, i) => (
                          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < cfg.step ? cfg.color : 'var(--border)', transition: 'background 0.3s' }} />
                        ))}
                      </div>

                      {/* Details row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          {pkg.weight_kg && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600' }}>⚖️ {pkg.weight_kg} kg</span>
                          )}
                          {pkg.shipping_type && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600', textTransform: 'capitalize' }}>
                              {pkg.shipping_type === 'EXPRESS' ? '⚡ Express' : pkg.shipping_type === 'COLIS_BATTERIE' ? '🔋 Colis Batterie' : '🚢 Ordinaire'}
                            </span>
                          )}
                          {price && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700' }}>{price} FCFA</span>
                          )}
                        </div>
                        <ChevronRight size={16} color="var(--text-3)" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
