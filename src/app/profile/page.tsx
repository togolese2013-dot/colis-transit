"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, Settings, LogOut, Home, Plus, BarChart2, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ProfilePage() {
  const router = useRouter();
  const { username, initials } = useCurrentUser();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('hc_user')
    router.push('/login')
  }

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push("/")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Profil</span>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{
          width: '72px', height: '72px',
          background: 'var(--accent-subtle)', border: '2px solid var(--accent-border)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.125rem', color: 'var(--accent)',
          fontSize: '1.5rem', fontWeight: '700',
        }}>
          {initials}
        </div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-1)', marginBottom: '0.25rem' }}>
          {username || 'Admin'}
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
          Administrateur
        </p>
        <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'var(--success-subtle)', border: '1px solid var(--success-border)', borderRadius: 'var(--r-full)', padding: '0.25rem 0.75rem' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--success)' }}>Actif</span>
        </div>
      </div>

      {/* Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <button
          onClick={() => router.push('/settings')}
          className="btn btn-secondary btn-full"
          style={{ justifyContent: 'flex-start', gap: '0.875rem', padding: '1rem 1.25rem', borderRadius: 'var(--r-xl)', height: 'auto' }}
        >
          <div style={{ width: '36px', height: '36px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Settings size={17} color="var(--text-2)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-1)' }}>Paramètres</div>
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-3)', fontWeight: '400' }}>Gérer votre compte</div>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="btn btn-full"
          style={{
            justifyContent: 'flex-start', gap: '0.875rem', padding: '1rem 1.25rem',
            borderRadius: 'var(--r-xl)', height: 'auto',
            background: 'var(--error-subtle)', border: '1.5px solid var(--error-border)',
          }}
        >
          <div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogOut size={17} color="var(--error)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--error)' }}>Déconnexion</div>
            <div style={{ fontSize: '0.78125rem', color: '#f87171', fontWeight: '400' }}>Quitter la session</div>
          </div>
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn active" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
