'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Eye, EyeOff, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  // Redirect to home if already authenticated
  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => { if (r.ok) router.replace('/') })
      .catch(() => {})
  }, [router])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
        setLoading(false)
        return
      }

      localStorage.setItem('hc_user', username.trim().toLowerCase())
      if (data.displayName) localStorage.setItem('hc_display_name', data.displayName)
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      router.push(redirect && redirect.startsWith('/') && !redirect.startsWith('/client') ? redirect : '/dashboard')
    } catch (err) {
      console.error(err)
      setError('Erreur réseau, veuillez réessayer')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <Package size={28} color="#fff" />
          </div>
          <div>
            <h1 style={styles.logoTitle}>Hamid Cargo</h1>
            <p style={styles.logoSub}>Espace administrateur</p>
          </div>
        </div>

        <div style={styles.divider} />

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nom d&apos;utilisateur</label>
            <div style={styles.inputWrap}>
              <User size={16} color="var(--text-3)" style={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Entrez votre identifiant"
                autoComplete="username"
                autoFocus
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrap}>
              <Lock size={16} color="var(--text-3)" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                required
                style={{ ...styles.input, paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff size={16} color="var(--text-3)" />
                  : <Eye size={16} color="var(--text-3)" />}
              </button>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-subtle)',
    padding: '1.25rem',
    paddingBottom: '1.25rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-2xl)',
    boxShadow: 'var(--shadow-xl)',
    padding: '2rem 1.75rem',
    width: '100%',
    maxWidth: '420px',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    marginBottom: '1.5rem',
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 'var(--r-lg)',
    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    boxShadow: '0 8px 20px rgba(249,115,22,0.30)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-1)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: '0.8125rem',
    color: 'var(--text-2)',
    marginTop: '0.125rem',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-1)',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.875rem',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '48px',
    padding: '0 1rem 0 2.5rem',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-md)',
    fontSize: '16px',
    color: 'var(--text-1)',
    background: 'var(--bg)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    fontFamily: 'var(--font)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.875rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    background: 'var(--error-subtle)',
    border: '1px solid var(--error-border)',
    borderRadius: 'var(--r-md)',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: 'var(--error)',
  },
}
