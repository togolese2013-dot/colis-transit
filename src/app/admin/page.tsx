'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Users, Settings, Plus, Trash2,
  Eye, EyeOff, Check, X, Pencil, Shield, ShieldOff, Key, Download, DatabaseBackup
} from 'lucide-react'

interface AdminUser {
  id: string
  username: string
  display_name: string | null
  role: string
  permissions: string[]
  created_at: string
}

interface AppSettings {
  cargo_name?: string
  cargo_subtitle?: string
}

type Tab = 'users' | 'settings' | 'backup'
type Status = { type: 'success' | 'error'; message: string } | null

export default function AdminPanel() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')

  // Backup state
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupInfo, setBackupInfo] = useState<{ date: string; packages: number; customers: number; accounts: number } | null>(() => {
    try { const s = localStorage.getItem('last_backup'); return s ? JSON.parse(s) : null } catch { return null }
  })

  async function handleBackup() {
    setBackupLoading(true)
    try {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) { alert('Erreur lors de la sauvegarde'); return }
      const blob = await res.blob()
      const text = await blob.text()
      const data = JSON.parse(text)
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `hamidcargo_backup_${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      const info = {
        date: new Date().toLocaleString('fr-FR'),
        packages: data.tables.packages.count,
        customers: data.tables.customers.count,
        accounts: data.tables.client_accounts.count,
      }
      setBackupInfo(info)
      localStorage.setItem('last_backup', JSON.stringify(info))
    } catch { alert('Erreur inattendue') }
    finally { setBackupLoading(false) }
  }

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [usersStatus, setUsersStatus] = useState<Status>(null)

  // Create form
  const [createForm, setCreateForm] = useState({ username: '', displayName: '', password: '', role: 'admin', permissions: ['chine', 'lome'] as string[] })
  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [creating, setCreating] = useState(false)

  // Edit form
  const [editForm, setEditForm] = useState({ displayName: '', role: 'admin', newPassword: '', permissions: ['chine', 'lome'] as string[] })
  const [showEditPwd, setShowEditPwd] = useState(false)
  const [editing, setEditing] = useState(false)

  // Settings state
  const [appSettings, setAppSettings] = useState<AppSettings>({})
  const [settingsForm, setSettingsForm] = useState({ cargo_name: '', cargo_subtitle: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState<Status>(null)

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => { if (tab === 'settings') fetchSettings() }, [tab])

  async function fetchUsers() {
    setLoadingUsers(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoadingUsers(false)
  }

  async function fetchSettings() {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const data = await res.json()
      setAppSettings(data)
      setSettingsForm({ cargo_name: data.cargo_name || '', cargo_subtitle: data.cargo_subtitle || '' })
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setUsersStatus(null)
    setCreating(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    if (!res.ok) {
      setUsersStatus({ type: 'error', message: data.error })
    } else {
      setUsers(u => [...u, data])
      setCreateForm({ username: '', displayName: '', password: '', role: 'admin', permissions: ['chine', 'lome'] })
      setShowCreate(false)
      setUsersStatus({ type: 'success', message: `Utilisateur "${data.username}" créé` })
    }
    setCreating(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setEditing(true)
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editUser.id, ...editForm }),
    })
    const data = await res.json()
    if (!res.ok) {
      setUsersStatus({ type: 'error', message: data.error })
    } else {
      setUsers(u => u.map(x => x.id === data.id ? data : x))
      setEditUser(null)
      setUsersStatus({ type: 'success', message: 'Utilisateur mis à jour' })
    }
    setEditing(false)
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Supprimer l'utilisateur "${user.username}" ?`)) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    })
    if (res.ok) {
      setUsers(u => u.filter(x => x.id !== user.id))
      setUsersStatus({ type: 'success', message: `"${user.username}" supprimé` })
    } else {
      const data = await res.json()
      setUsersStatus({ type: 'error', message: data.error })
    }
  }

  async function handleToggleRole(user: AdminUser) {
    const newRole = user.role === 'disabled' ? 'admin' : 'disabled'
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, role: newRole }),
    })
    if (res.ok) {
      const data = await res.json()
      setUsers(u => u.map(x => x.id === data.id ? data : x))
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsStatus(null)
    setSavingSettings(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    })
    if (res.ok) {
      setAppSettings(settingsForm)
      setSettingsStatus({ type: 'success', message: 'Paramètres sauvegardés' })
    } else {
      const data = await res.json()
      setSettingsStatus({ type: 'error', message: data.error })
    }
    setSavingSettings(false)
  }

  const roleLabel: Record<string, { label: string; color: string; bg: string; border: string }> = {
    superadmin: { label: 'Super Admin', color: 'var(--accent)', bg: 'var(--accent-subtle)', border: 'var(--accent-border)' },
    admin:      { label: 'Admin', color: 'var(--blue)', bg: 'var(--blue-subtle)', border: 'var(--blue-border)' },
    disabled:   { label: 'Désactivé', color: 'var(--text-3)', bg: 'var(--bg-subtle)', border: 'var(--border)' },
  }

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push('/dashboard')} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Administration</span>
        </div>
        <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-full)', padding: '0.2rem 0.625rem' }}>
          Super Admin
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bg-subtle)', borderRadius: 'var(--r-xl)', padding: '0.3rem' }}>
        {([['users', <Users key="u" size={15} />, 'Utilisateurs'], ['settings', <Settings key="s" size={15} />, 'Paramètres'], ['backup', <Download key="b" size={15} />, 'Backup']] as const).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', padding: '0.625rem', borderRadius: 'var(--r-lg)',
              border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600',
              transition: 'all 0.15s',
              background: tab === key ? 'var(--surface)' : 'transparent',
              color: tab === key ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {usersStatus && (
            <StatusBox status={usersStatus} onClose={() => setUsersStatus(null)} />
          )}

          {/* User list */}
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)' }}>Chargement…</div>
          ) : (
            users.map(user => {
              const r = roleLabel[user.role] ?? roleLabel.admin
              return (
                <div key={user.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', opacity: user.role === 'disabled' ? 0.6 : 1 }}>
                  {/* Avatar */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: r.bg, border: `1.5px solid ${r.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.875rem', fontWeight: '700', color: r.color }}>
                    {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.display_name || user.username}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{user.username}</span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: r.color, background: r.bg, border: `1px solid ${r.border}`, borderRadius: 'var(--r-full)', padding: '0.1rem 0.5rem' }}>{r.label}</span>
                    </div>
                    {user.role !== 'superadmin' && (
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem' }}>
                        {[['chine', '🇨🇳 Chine', '#f97316', '#fff7ed', '#fed7aa'], ['lome', '🇹🇬 Togo', '#3b82f6', '#eff6ff', '#bfdbfe']].map(([key, label, color, bg, border]) => {
                          const perms = user.permissions ?? ['chine', 'lome']
                          const active = perms.includes(key)
                          return (
                            <span key={key} style={{ fontSize: '0.625rem', fontWeight: '700', borderRadius: 'var(--r-full)', padding: '0.15rem 0.5rem', border: `1px solid ${active ? border : 'var(--border)'}`, background: active ? bg : 'var(--bg-subtle)', color: active ? color : 'var(--text-3)', letterSpacing: '0.03em' }}>
                              {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    <button
                      onClick={() => { setEditUser(user); setEditForm({ displayName: user.display_name || '', role: user.role, newPassword: '', permissions: user.permissions ?? ['chine', 'lome'] }); setUsersStatus(null) }}
                      style={iconBtn}
                      title="Modifier"
                    >
                      <Pencil size={14} color="var(--text-2)" />
                    </button>
                    <button
                      onClick={() => handleToggleRole(user)}
                      style={{ ...iconBtn, background: user.role === 'disabled' ? 'var(--success-subtle)' : 'var(--warning-subtle)' }}
                      title={user.role === 'disabled' ? 'Activer' : 'Désactiver'}
                    >
                      {user.role === 'disabled'
                        ? <Shield size={14} color="var(--success)" />
                        : <ShieldOff size={14} color="var(--warning)" />}
                    </button>
                    {user.role !== 'superadmin' && (
                      <button onClick={() => handleDelete(user)} style={{ ...iconBtn, background: 'var(--error-subtle)' }} title="Supprimer">
                        <Trash2 size={14} color="var(--error)" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Create button */}
          {!showCreate && (
            <button
              onClick={() => { setShowCreate(true); setUsersStatus(null) }}
              className="btn btn-primary btn-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Créer un utilisateur
            </button>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-1)' }}>Nouvel utilisateur</span>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <TwoCol>
                  <Field label="Identifiant de connexion" value={createForm.username} onChange={v => setCreateForm(f => ({ ...f, username: v }))} placeholder="ex: hamid" autoComplete="off" />
                  <Field label="Nom affiché" value={createForm.displayName} onChange={v => setCreateForm(f => ({ ...f, displayName: v }))} placeholder="ex: Hamid" />
                </TwoCol>
                <PwdField label="Mot de passe" value={createForm.password} show={showCreatePwd} onToggle={() => setShowCreatePwd(v => !v)} onChange={v => setCreateForm(f => ({ ...f, password: v }))} hint="Min. 6 caractères" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={labelStyle}>Rôle</label>
                  <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                {createForm.role !== 'superadmin' && (
                  <PermissionToggle
                    permissions={createForm.permissions}
                    onChange={p => setCreateForm(f => ({ ...f, permissions: p }))}
                  />
                )}
                <button type="submit" disabled={creating} className="btn btn-primary btn-full" style={{ opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Création…' : 'Créer'}
                </button>
              </form>
            </div>
          )}

          {/* Edit modal */}
          {editUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', padding: '0' }}>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-2xl) var(--r-2xl) 0 0', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-1)' }}>Modifier l&apos;utilisateur</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{editUser.username}</div>
                  </div>
                  <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-2)" /></button>
                </div>
                <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <Field label="Nom affiché" value={editForm.displayName} onChange={v => setEditForm(f => ({ ...f, displayName: v }))} placeholder="Nom visible dans l'app" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={labelStyle}>Rôle</label>
                    <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="disabled">Désactivé</option>
                    </select>
                  </div>
                  {editForm.role !== 'superadmin' && editForm.role !== 'disabled' && (
                    <PermissionToggle
                      permissions={editForm.permissions}
                      onChange={p => setEditForm(f => ({ ...f, permissions: p }))}
                    />
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
                    <PwdField label="Nouveau mot de passe (optionnel)" value={editForm.newPassword} show={showEditPwd} onToggle={() => setShowEditPwd(v => !v)} onChange={v => setEditForm(f => ({ ...f, newPassword: v }))} hint="Laisser vide pour ne pas changer" required={false} />
                  </div>
                  <button type="submit" disabled={editing} className="btn btn-primary btn-full" style={{ opacity: editing ? 0.7 : 1 }}>
                    {editing ? 'Mise à jour…' : 'Enregistrer'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div>
          {settingsStatus && <StatusBox status={settingsStatus} onClose={() => setSettingsStatus(null)} />}

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={15} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-1)' }}>Informations du cargo</h2>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <Field
                label="Nom du cargo"
                value={settingsForm.cargo_name}
                onChange={v => setSettingsForm(f => ({ ...f, cargo_name: v }))}
                placeholder="ex : Hamid Cargo"
              />
              <Field
                label="Sous-titre"
                value={settingsForm.cargo_subtitle}
                onChange={v => setSettingsForm(f => ({ ...f, cargo_subtitle: v }))}
                placeholder="ex : Envoi de colis · Chine & Togo"
              />

              {/* Preview */}
              <div style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Aperçu</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  {settingsForm.cargo_name || 'Hamid Cargo'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                  {settingsForm.cargo_subtitle || 'Envoi de colis · Chine & Togo'}
                </div>
              </div>

              <button type="submit" disabled={savingSettings} className="btn btn-primary btn-full" style={{ opacity: savingSettings ? 0.7 : 1 }}>
                {savingSettings ? 'Sauvegarde…' : 'Enregistrer les paramètres'}
              </button>
            </form>
          </div>

          {/* Keys info */}
          <div className="card" style={{ background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Key size={15} color="var(--text-3)" />
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-2)' }}>Variables d&apos;environnement</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { key: 'NEXT_PUBLIC_SUPABASE_URL', status: '✓' },
                { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: '✓' },
                { key: 'JWT_SECRET', status: '✓' },
              ].map(({ key, status }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{key}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '700' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BACKUP TAB ── */}
      {tab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Last backup info */}
          {backupInfo && (
            <div className="card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Dernière sauvegarde
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-1)', marginBottom: '0.625rem' }}>
                {backupInfo.date}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {[
                  ['📦 Colis', backupInfo.packages],
                  ['👤 Clients', backupInfo.customers],
                  ['🔑 Comptes client', backupInfo.accounts],
                ].map(([label, count]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-1)' }}>{count} lignes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={17} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-1)' }}>Sauvegarder la base de données</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Format JSON · colis + clients + comptes</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', padding: '0.875rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
              Télécharge un fichier <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--border)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>hamidcargo_backup_YYYY-MM-DD.json</code> contenant toutes les données. Les mots de passe ne sont pas inclus en clair (hachés uniquement).
            </div>

            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="btn btn-primary btn-full"
              style={{ opacity: backupLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {backupLoading ? <><span className="spinner" /> Préparation…</> : <><Download size={16} /> Télécharger la sauvegarde</>}
            </button>
          </div>

          {/* Warning */}
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.6 }}>
            ⚠️ Conservez ce fichier dans un endroit sécurisé. Faites une sauvegarde régulièrement (hebdomadaire recommandé).
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────

function StatusBox({ status, onClose }: { status: { type: 'success' | 'error'; message: string }; onClose: () => void }) {
  const ok = status.type === 'success'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: ok ? 'var(--success-subtle)' : 'var(--error-subtle)', border: `1px solid ${ok ? 'var(--success-border)' : 'var(--error-border)'}`, borderRadius: 'var(--r-md)', padding: '0.75rem 1rem' }}>
      {ok ? <Check size={15} color="var(--success)" /> : null}
      <span style={{ flex: 1, fontSize: '0.875rem', color: ok ? 'var(--success)' : 'var(--error)' }}>{status.message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={ok ? 'var(--success)' : 'var(--error)'} /></button>
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>{children}</div>
}

function Field({ label, value, onChange, placeholder, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={labelStyle}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required style={inputStyle} />
    </div>
  )
}

function PwdField({ label, value, show, onToggle, onChange, hint, required = true }: {
  label: string; value: string; show: boolean; onToggle: () => void; onChange: (v: string) => void; hint?: string; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={labelStyle}>{label}</label>
      {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{hint}</span>}
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} required={required} style={{ ...inputStyle, paddingRight: '2.75rem' }} autoComplete="new-password" />
        <button type="button" onClick={onToggle} tabIndex={-1} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}>
          {show ? <EyeOff size={15} color="var(--text-3)" /> : <Eye size={15} color="var(--text-3)" />}
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-1)' }

const inputStyle: React.CSSProperties = {
  width: '100%', height: '44px', padding: '0 1rem',
  border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
  fontSize: '16px', color: 'var(--text-1)',
  background: 'var(--bg)', outline: 'none', fontFamily: 'var(--font)',
}

const iconBtn: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', background: 'var(--bg-subtle)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

function PermissionToggle({ permissions, onChange }: { permissions: string[]; onChange: (p: string[]) => void }) {
  const sections = [
    { key: 'chine', label: 'Espace Chine', emoji: '🇨🇳', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    { key: 'lome',  label: 'Espace Togo',  emoji: '🇹🇬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  ]
  function toggle(key: string) {
    onChange(permissions.includes(key) ? permissions.filter(p => p !== key) : [...permissions, key])
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={labelStyle}>Accès aux sections</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {sections.map(({ key, label, emoji, color, bg, border }) => {
          const active = permissions.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                height: '44px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontWeight: '700',
                fontSize: '0.8125rem', transition: 'all 0.15s',
                border: `1.5px solid ${active ? border : 'var(--border)'}`,
                background: active ? bg : 'var(--bg-subtle)',
                color: active ? color : 'var(--text-3)',
              }}
            >
              <span>{emoji}</span> {label}
              {active && <Check size={13} color={color} strokeWidth={3} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
