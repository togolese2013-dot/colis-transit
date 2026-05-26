'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Eye, EyeOff, Phone, User, Lock } from 'lucide-react'

export default function ClientRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/client/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      router.push('/client/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Back */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-3)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}>
            <ChevronLeft size={16} /> Retour
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--accent)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 6px 20px rgba(249,115,22,0.25)' }}>
            <User size={22} color="white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: '0.25rem' }}>Créer un compte</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Suivez tous vos colis en un seul endroit</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>Nom complet</label>
            <div style={inputWrap}>
              <User size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Votre nom"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                autoComplete="name"
                style={inputInner}
              />
            </div>
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>Numéro de téléphone</label>
            <div style={inputWrap}>
              <Phone size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
              <input
                type="tel"
                placeholder="+228 XX XX XX XX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
                autoComplete="tel"
                style={inputInner}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Ce numéro doit correspondre à celui enregistré pour vos colis</span>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ ...inputWrap, paddingRight: '2.75rem' }}>
                <Lock size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 6 caractères"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                  style={inputInner}
                />
              </div>
              <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--error-subtle)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ height: '52px', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font)', marginTop: '0.25rem' }}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-3)' }}>
          Déjà un compte ?{' '}
          <Link href="/client/login" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-1)' }

const inputWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.625rem',
  border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
  padding: '0 1rem', background: 'var(--bg)', height: '52px',
}

const inputInner: React.CSSProperties = {
  flex: 1, border: 'none', outline: 'none', background: 'none',
  fontSize: '16px', color: 'var(--text-1)', fontFamily: 'var(--font)',
}
