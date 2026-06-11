'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, LogOut, ChevronRight, Clock, Home, User, Search, X, MessageCircle, Phone, DollarSign, Copy, Check } from 'lucide-react'

const WHATSAPP_LOME = '+22890196529'
const PHONE_LOME = '+22890196529'

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
  RECU_CHINE:  { label: 'Reçu en Chine', color: '#f59e0b', bg: '#fef3c7', border: '#fde68a', step: 1 },
  EN_TRANSIT:  { label: 'En transit',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', step: 2 },
  ARRIVE_LOME: { label: 'Arrivé à Lomé', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', step: 3 },
  LIVRE:       { label: 'Livré',         color: '#10b981', bg: '#d1fae5', border: '#a7f3d0', step: 4 },
}

const PRICE_MAP: Record<string, number> = { ORDINAIRE: 10000, EXPRESS: 13000, COLIS_BATTERIE: 11000 }

type Tab = 'all' | 'active' | 'delivered'
type Sort = 'desc' | 'asc'

export default function ClientDashboard() {
  const router = useRouter()
  const [packages, setPackages] = useState<ClientPackage[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('desc')
  const [copied, setCopied] = useState(false)

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

  async function copyPhone() {
    if (!name) return
    const phone = packages[0]?.notes ?? ''
    await navigator.clipboard.writeText(name)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getPrice(pkg: ClientPackage) {
    if (!pkg.weight_kg) return null
    const rate = PRICE_MAP[pkg.shipping_type] ?? 10000
    return (pkg.weight_kg * rate).toLocaleString('fr-FR')
  }

  const filtered = useMemo(() => {
    let list = [...packages]
    if (tab === 'active') list = list.filter(p => p.status !== 'LIVRE')
    if (tab === 'delivered') list = list.filter(p => p.status === 'LIVRE')
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p => p.tracking_number.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sort === 'desc' ? -diff : diff
    })
    return list
  }, [packages, tab, search, sort])

  const steps = ['Reçu Chine', 'En transit', 'Arrivé Lomé', 'Livré']
  const activeCount = packages.filter(p => p.status !== 'LIVRE').length

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
          <Link href="/client/profile" style={{ textDecoration: 'none' }}>
            <button title="Profil" style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <User size={16} color="var(--text-2)" />
            </button>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button title="Accueil" style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Home size={16} color="var(--text-2)" />
            </button>
          </Link>
          <button onClick={handleLogout} title="Déconnexion" style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--error-border)', background: 'var(--error-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <LogOut size={16} color="var(--error)" />
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.25rem' }}>

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Chargement…</div>}

        {error && (
          <div style={{ background: 'var(--error-subtle)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', padding: '1rem', color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>

            {/* Summary */}
            {packages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Total', value: packages.length, color: 'var(--text-1)' },
                  { label: 'En cours', value: activeCount, color: 'var(--accent)' },
                  { label: 'Livrés', value: packages.length - activeCount, color: '#10b981' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '0.875rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color, letterSpacing: '-0.02em' }}>{value}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: '600' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            {packages.length > 0 && (
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={15} color="var(--text-3)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Rechercher un numéro de tracking…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', height: '44px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-full)', paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem', fontSize: '0.875rem', fontFamily: 'var(--font)', background: 'white', color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}>
                    <X size={15} />
                  </button>
                )}
              </div>
            )}

            {/* Tabs + sort */}
            {packages.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {([['all', 'Tous'], ['active', 'En cours'], ['delivered', 'Livrés']] as [Tab, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setTab(val)}
                      style={{ padding: '0.375rem 0.875rem', borderRadius: 'var(--r-full)', border: '1.5px solid', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s', borderColor: tab === val ? 'var(--accent)' : 'var(--border)', background: tab === val ? 'var(--accent)' : 'white', color: tab === val ? 'white' : 'var(--text-2)' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', background: 'white', color: 'var(--text-2)', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}
                >
                  {sort === 'desc' ? '↓ Récent' : '↑ Ancien'}
                </button>
              </div>
            )}

            {packages.length === 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem 0 1.25rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-1)', marginBottom: '0.375rem' }}>Aucun colis pour l&apos;instant</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
                    Vos colis apparaissent ici dès que l&apos;équipe Hamid Cargo les enregistre avec votre numéro.
                  </p>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Contactez-nous</div>
                  {[
                    { name: 'Mouhamed (Lomé)', phone: '+228 90 19 65 29', wa: '22890196529' },
                    { name: 'Seyni (Lomé)', phone: '+228 70 15 13 30', wa: '22870151330' },
                  ].map(({ name, phone, wa }) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-1)' }}>{name}</div>
                        <a href={`tel:+${wa}`} style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>{phone}</a>
                      </div>
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1rem', flexShrink: 0 }}>
                        💬
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && packages.length > 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                Aucun résultat pour cette recherche.
              </div>
            )}

            {/* Package list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {filtered.map(pkg => {
                const cfg = STATUS_CONFIG[pkg.status] ?? STATUS_CONFIG.RECU_CHINE
                const photo = pkg.photo_urls?.[0] ?? pkg.photo_url
                const price = getPrice(pkg)
                return (
                  <Link key={pkg.id} href={`/track?id=${encodeURIComponent(pkg.tracking_number)}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
                      {photo && (
                        <div style={{ height: '120px', background: '#f8fafc', overflow: 'hidden' }}>
                          <img src={photo} alt="colis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ padding: '1rem 1.125rem' }}>
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
                        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                          {steps.map((_, i) => (
                            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < cfg.step ? cfg.color : 'var(--border)' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {pkg.weight_kg && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600' }}>⚖️ {pkg.weight_kg} kg</span>}
                            {pkg.shipping_type && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600' }}>
                                {pkg.shipping_type === 'EXPRESS' ? '⚡ Express' : pkg.shipping_type === 'COLIS_BATTERIE' ? '🔋 Colis Batterie' : '🚢 Ordinaire'}
                              </span>
                            )}
                            {price && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700' }}>{price} FCFA</span>}
                          </div>
                          <ChevronRight size={16} color="var(--text-3)" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
