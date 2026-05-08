'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Lock, Eye, EyeOff, Check, AtSign } from 'lucide-react'

type Status = { type: 'success' | 'error'; message: string } | null

export default function SettingsPage() {
  const router = useRouter()

  const [currentUsername, setCurrentUsername] = useState('')
  const [currentDisplayName, setCurrentDisplayName] = useState('')

  const [displayForm, setDisplayForm] = useState({ displayName: '' })
  const [usernameForm, setUsernameForm] = useState({ newUsername: '', currentPassword: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [showPwd, setShowPwd] = useState({ u: false, p1: false, p2: false, p3: false })
  const [displayStatus, setDisplayStatus] = useState<Status>(null)
  const [usernameStatus, setUsernameStatus] = useState<Status>(null)
  const [passwordStatus, setPasswordStatus] = useState<Status>(null)
  const [loadingD, setLoadingD] = useState(false)
  const [loadingU, setLoadingU] = useState(false)
  const [loadingP, setLoadingP] = useState(false)

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCurrentUsername(data.username)
          setCurrentDisplayName(data.displayName)
          setDisplayForm({ displayName: data.displayName })
        }
      })
      .catch(() => {})
  }, [])

  async function handleDisplaySubmit(e: React.FormEvent) {
    e.preventDefault()
    setDisplayStatus(null)
    setLoadingD(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'displayname', displayName: displayForm.displayName }),
      })
      const data = await res.json()
      if (!res.ok) { setDisplayStatus({ type: 'error', message: data.error }); return }
      localStorage.setItem('hc_display_name', data.displayName)
      setCurrentDisplayName(data.displayName)
      setDisplayStatus({ type: 'success', message: 'Nom affiché mis à jour' })
    } catch {
      setDisplayStatus({ type: 'error', message: 'Erreur réseau' })
    } finally {
      setLoadingD(false)
    }
  }

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUsernameStatus(null)
    setLoadingU(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'username', newUsername: usernameForm.newUsername, currentPassword: usernameForm.currentPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setUsernameStatus({ type: 'error', message: data.error }); return }
      setCurrentUsername(usernameForm.newUsername.trim().toLowerCase())
      setUsernameForm({ newUsername: '', currentPassword: '' })
      setUsernameStatus({ type: 'success', message: 'Identifiant de connexion mis à jour' })
    } catch {
      setUsernameStatus({ type: 'error', message: 'Erreur réseau' })
    } finally {
      setLoadingU(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordStatus(null)
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas' })
      return
    }
    setLoadingP(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setPasswordStatus({ type: 'error', message: data.error }); return }
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordStatus({ type: 'success', message: 'Mot de passe mis à jour' })
    } catch {
      setPasswordStatus({ type: 'error', message: 'Erreur réseau' })
    } finally {
      setLoadingP(false)
    }
  }

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push('/profile')} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Paramètres du compte</span>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-xl)', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.125rem' }}>Nom affiché</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-1)' }}>{currentDisplayName || '—'}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.125rem' }}>Identifiant connexion</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{currentUsername || '—'}</div>
        </div>
      </div>

      {/* 1. Display name */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <SectionTitle icon={<User size={15} color="var(--accent)" />} bg="var(--accent-subtle)" border="var(--accent-border)">
          Nom affiché dans l&apos;application
        </SectionTitle>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
          Ce nom apparaît dans le header. Il est indépendant de votre identifiant de connexion.
        </p>
        <form onSubmit={handleDisplaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Field
            label="Nouveau nom affiché"
            value={displayForm.displayName}
            onChange={v => setDisplayForm({ displayName: v })}
            placeholder="Ex : Hamid, Agent Chine…"
          />
          {displayStatus && <StatusBox status={displayStatus} />}
          <button type="submit" disabled={loadingD} className="btn btn-primary btn-full" style={{ opacity: loadingD ? 0.7 : 1 }}>
            {loadingD ? 'Mise à jour…' : 'Modifier le nom affiché'}
          </button>
        </form>
      </div>

      {/* 2. Login username */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <SectionTitle icon={<AtSign size={15} color="var(--blue)" />} bg="var(--blue-subtle)" border="var(--blue-border)">
          Identifiant de connexion
        </SectionTitle>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
          Utilisé uniquement pour vous connecter. Nécessite votre mot de passe actuel.
        </p>
        <form onSubmit={handleUsernameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Field
            label="Nouvel identifiant"
            value={usernameForm.newUsername}
            onChange={v => setUsernameForm(f => ({ ...f, newUsername: v }))}
            placeholder="Min. 3 caractères"
            autoComplete="username"
          />
          <PwdField label="Mot de passe actuel" value={usernameForm.currentPassword} show={showPwd.u} onToggle={() => setShowPwd(s => ({ ...s, u: !s.u }))} onChange={v => setUsernameForm(f => ({ ...f, currentPassword: v }))} />
          {usernameStatus && <StatusBox status={usernameStatus} />}
          <button type="submit" disabled={loadingU} className="btn btn-full" style={{ opacity: loadingU ? 0.7 : 1, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', height: '48px', fontWeight: '600', fontSize: '0.9375rem' }}>
            {loadingU ? 'Mise à jour…' : 'Modifier l\'identifiant'}
          </button>
        </form>
      </div>

      {/* 3. Password */}
      <div className="card">
        <SectionTitle icon={<Lock size={15} color="var(--success)" />} bg="var(--success-subtle)" border="var(--success-border)">
          Mot de passe
        </SectionTitle>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <PwdField label="Mot de passe actuel" value={passwordForm.currentPassword} show={showPwd.p1} onToggle={() => setShowPwd(s => ({ ...s, p1: !s.p1 }))} onChange={v => setPasswordForm(f => ({ ...f, currentPassword: v }))} />
          <PwdField label="Nouveau mot de passe" hint="Minimum 6 caractères" value={passwordForm.newPassword} show={showPwd.p2} onToggle={() => setShowPwd(s => ({ ...s, p2: !s.p2 }))} onChange={v => setPasswordForm(f => ({ ...f, newPassword: v }))} />
          <PwdField label="Confirmer le nouveau mot de passe" value={passwordForm.confirmPassword} show={showPwd.p3} onToggle={() => setShowPwd(s => ({ ...s, p3: !s.p3 }))} onChange={v => setPasswordForm(f => ({ ...f, confirmPassword: v }))} />
          {passwordStatus && <StatusBox status={passwordStatus} />}
          <button type="submit" disabled={loadingP} className="btn btn-full" style={{ opacity: loadingP ? 0.7 : 1, background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', height: '48px', fontWeight: '600', fontSize: '0.9375rem' }}>
            {loadingP ? 'Mise à jour…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SectionTitle({ icon, bg, border, children }: { icon: React.ReactNode; bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
      <div style={{ width: '32px', height: '32px', background: bg, border: `1px solid ${border}`, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-1)' }}>{children}</h2>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-1)' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required style={inputStyle} />
    </div>
  )
}

function PwdField({ label, value, show, onToggle, onChange, hint }: {
  label: string; value: string; show: boolean; onToggle: () => void; onChange: (v: string) => void; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-1)' }}>{label}</label>
      {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{hint}</span>}
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} required style={{ ...inputStyle, paddingRight: '2.75rem' }} autoComplete="current-password" />
        <button type="button" onClick={onToggle} tabIndex={-1} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}>
          {show ? <EyeOff size={16} color="var(--text-3)" /> : <Eye size={16} color="var(--text-3)" />}
        </button>
      </div>
    </div>
  )
}

function StatusBox({ status }: { status: { type: 'success' | 'error'; message: string } }) {
  const ok = status.type === 'success'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: ok ? 'var(--success-subtle)' : 'var(--error-subtle)', border: `1px solid ${ok ? 'var(--success-border)' : 'var(--error-border)'}`, borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: ok ? 'var(--success)' : 'var(--error)' }}>
      {ok && <Check size={15} />}
      {status.message}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '48px', padding: '0 1rem',
  border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
  fontSize: '0.9375rem', color: 'var(--text-1)',
  background: 'var(--bg)', outline: 'none', fontFamily: 'var(--font)',
}
