"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, Search, User, Clock, Phone, CheckCircle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const val = trackingInput.trim();
    if (val) router.push(`/track?q=${encodeURIComponent(val)}`);
  }

  return (
    <div style={{ fontFamily: 'var(--font)', background: '#fff', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span style={{ fontWeight: '800', fontSize: '1.0625rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Hamid Cargo</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/client/login" style={{ textDecoration: 'none' }}>
            <button style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              Connexion
            </button>
          </Link>
          <Link href="/client/register" style={{ textDecoration: 'none' }}>
            <button style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', fontSize: '0.8125rem', fontWeight: '700', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              Mon compte
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: '4rem 1.5rem 3rem',
        background: 'linear-gradient(160deg, #fff7ed 0%, #fff 60%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-full)', padding: '0.25rem 0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Guangzhou → Lomé</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 2.75rem)', fontWeight: '900', letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1, marginBottom: '1rem' }}>
            Vos colis de<br />
            <span style={{ color: 'var(--accent)' }}>Chine au Togo</span>
            <br />en toute sécurité
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '360px', margin: '0 auto 2rem' }}>
            Transport maritime et express de colis depuis Guangzhou jusqu&apos;à Lomé. Suivi en temps réel, prix transparents.
          </p>

          {/* Track form */}
          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--r-full)', padding: '0 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Search size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Numéro de tracking..."
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: '16px', color: 'var(--text-1)', fontFamily: 'var(--font)', height: '48px' }}
              />
            </div>
            <button type="submit" style={{ height: '52px', padding: '0 1.5rem', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
              Suivre <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[['✓', 'Suivi en temps réel'], ['✓', 'Photos à la réception'], ['✓', 'Livraison à domicile']].map(([icon, text]) => (
              <span key={text} style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: '500' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '700', marginRight: '0.25rem' }}>{icon}</span>{text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '0.5rem' }}>Nos Services</p>
          <h2 style={{ fontSize: '1.625rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Choisissez votre formule</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          {/* Ordinaire */}
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-1)', marginBottom: '0.25rem' }}>Ordinaire</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>Transport maritime standard</div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.02em' }}>10 000 <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>FCFA/kg</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem' }}>
                <Clock size={12} color="var(--text-3)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>25 – 35 jours</span>
              </div>
            </div>
          </div>

          {/* Express */}
          <div style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.25)', borderRadius: 'var(--r-full)', padding: '0.15rem 0.5rem', fontSize: '0.625rem', fontWeight: '800', color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rapide</div>
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5l-8.2-1.8c-.9-.2-1.8.1-2.4.7l-.5.5c-.4.4-.5 1-.2 1.4l7.2 3.6-3.6 7.2c-.4.4-.3 1 .1 1.4l.5.5c.6.6 1.5.9 2.4.7l8.2-1.8 3.5 3.5c1.5 1.5 3.5 1 4-.5s-.5-2.5-2-4l-3.5-3.5z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'white', marginBottom: '0.25rem' }}>Express</div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Livraison prioritaire rapide</div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>13 000 <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>FCFA/kg</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem' }}>
                <Clock size={12} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>15 – 20 jours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ padding: '2.5rem 1.5rem', background: 'var(--bg-subtle)', maxWidth: '100%' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '0.5rem' }}>Processus</p>
            <h2 style={{ fontSize: '1.625rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Comment ça marche ?</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { n: '1', title: 'Envoyez vos colis en Chine', desc: 'Déposez vos articles à notre entrepôt de Guangzhou. Nous les enregistrons avec photos.', icon: '📦' },
              { n: '2', title: 'Transit & suivi en temps réel', desc: 'Suivez votre colis à chaque étape : Chine → En transit → Arrivé à Lomé.', icon: '🚢' },
              { n: '3', title: 'Livraison à Lomé', desc: 'Récupérez votre colis à notre bureau ou optez pour la livraison à domicile.', icon: '✅' },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: '1rem', paddingBottom: i < 2 ? '1.5rem' : '0', position: 'relative' }}>
                {i < 2 && <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: 0, width: '2px', background: 'var(--border)' }} />}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '800', fontSize: '0.875rem', color: 'white', zIndex: 1 }}>{step.n}</div>
                <div style={{ background: 'white', borderRadius: '16px', padding: '1rem 1.125rem', flex: 1, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{step.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-1)', marginBottom: '0.25rem' }}>{step.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESPACE CLIENT ── */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '24px', padding: '2rem 1.5rem', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👤</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Espace Client</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Créez votre compte avec votre numéro de téléphone pour consulter tous vos colis, leur statut et leur historique.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Link href="/client/register" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', height: '48px', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <User size={16} /> Créer mon compte
              </button>
            </Link>
            <Link href="/client/login" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', height: '48px', borderRadius: 'var(--r-full)', border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', fontWeight: '600', fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Déjà un compte ? Se connecter
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{ padding: '0 1.5rem 3rem', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-subtle)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: '800', fontSize: '1.0625rem', color: 'var(--text-1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={18} color="var(--accent)" /> Contactez-nous
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'WhatsApp / Appel', value: '+228 XX XX XX XX', icon: '📱' },
              { label: 'Bureau Lomé', value: 'Lomé, Togo', icon: '📍' },
              { label: 'Entrepôt Chine', value: 'Guangzhou, Chine', icon: '🏭' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.125rem' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-1)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={14} color="white" />
          </div>
          <span style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--text-1)' }}>Hamid Cargo</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>Envoi de colis · Chine &amp; Togo</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/track" style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none' }}>Suivre un colis</Link>
          <Link href="/client/login" style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none' }}>Espace client</Link>
          <Link href="/login" style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none' }}>Admin</Link>
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.75rem' }}>© 2026 Hamid Cargo Logistics</p>
      </footer>

    </div>
  );
}
