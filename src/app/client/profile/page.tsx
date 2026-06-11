'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Phone, Lock, Eye, EyeOff, LogOut, CheckCircle } from 'lucide-react'

interface Profile {
  id: string
  name: string
  phone: string
  created_at: string
}

export default function ClientProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [nameVal, setNameVal] = useState('')
  const [phoneVal, setPhoneVal] = useState('')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/client/profile')
      .then(r => {
        if (r.status === 401) { router.push('/client/login'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setProfile(data)
        setNameVal(data.name)
        setPhoneVal(data.phone)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    const res = await fetch('/api/client/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal, phone: phoneVal }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setProfile(p => p ? { ...p, name: data.name, phone: data.phone } : p)
    setSuccess('Informations mises à jour')
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleSavePwd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    const res = await fetch('/api/client/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPwd, currentPassword: currentPwd }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setCurrentPwd('')
    setNewPwd('')
    setSuccess('Mot de passe modifié')
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleLogout() {
    await fetch('/api/client/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner-dark spinner" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/client/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', textDecoration: 'none' }}>
          <ChevronLeft size={20} />
        </Link>
        <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--text-1)' }}>Mon profil</div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem', maxWidth: '480px', margin: '0 auto' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '72px', height: '72px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <User size={32} color="white" />
          </div>
          <div style={{ fontWeight: '800', fontSize: '1.125rem', color: 'var(--text-1)' }}>{profile?.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            Membre depuis {profile ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : ''}
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div style={{ background: 'var(--success-subtle)', border: '1px solid var(--success-border)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--success)', fontWeight: '600' }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {error && (
          <div style={{ background: 'var(--error-subtle)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {/* Info card */}
        <form onSubmit={handleSaveInfo} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-1)', marginBottom: '1rem' }}>Informations personnelles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Nom complet</label>
              <div style={inputWrap}>
                <User size={15} color="var(--text-3)" />
                <input type="text" value={nameVal} onChange={e => setNameVal(e.target.value)} required style={inputInner} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <div style={inputWrap}>
                <Phone size={15} color="var(--text-3)" />
                <input type="tel" value={phoneVal} onChange={e => setPhoneVal(e.target.value)} required style={inputInner} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.25rem', display: 'block' }}>
                Doit correspondre au numéro enregistré pour vos colis
              </span>
            </div>
          </div>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>

        {/* Password card */}
        <form onSubmit={handleSavePwd} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-1)', marginBottom: '1rem' }}>Changer le mot de passe</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Mot de passe actuel</label>
              <div style={{ position: 'relative' }}>
                <div style={{ ...inputWrap, paddingRight: '2.75rem' }}>
                  <Lock size={15} color="var(--text-3)" />
                  <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required style={inputInner} placeholder="••••••" />
                </div>
                <button type="button" onClick={() => setShowCurrent(v => !v)} tabIndex={-1} style={eyeBtn}>
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <div style={{ ...inputWrap, paddingRight: '2.75rem' }}>
                  <Lock size={15} color="var(--text-3)" />
                  <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} style={inputInner} placeholder="Min. 6 caractères" />
                </div>
                <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1} style={eyeBtn}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving || !currentPwd || !newPwd} style={btnPrimary}>
            {saving ? 'Enregistrement…' : 'Modifier le mot de passe'}
          </button>
        </form>

        {/* Logout */}
        <button onClick={handleLogout} style={{ width: '100%', height: '52px', borderRadius: 'var(--r-full)', border: '1.5px solid var(--error-border)', background: 'var(--error-subtle)', color: 'var(--error)', fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'var(--font)' }}>
          <LogOut size={16} /> Se déconnecter
        </button>

      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-1)', display: 'block', marginBottom: '0.375rem' }
const inputWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.625rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 1rem', background: 'var(--bg)', height: '48px' }
const inputInner: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: '16px', color: 'var(--text-1)', fontFamily: 'var(--font)' }
const btnPrimary: React.CSSProperties = { width: '100%', height: '48px', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer', marginTop: '1.25rem', fontFamily: 'var(--font)' }
const eyeBtn: React.CSSProperties = { position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }
