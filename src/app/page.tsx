"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

const WA_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export default function LandingPage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const chinaAddress = `广东省广州市越秀区环市西路202号\n桐舍酒店 7楼 729室\nGuangzhou, Chine\nTél: +86 138 0924 9171 (Hamid)`;

  useEffect(() => {
    fetch('/api/client/packages')
      .then(r => { if (r.ok) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const val = trackingInput.trim();
    if (val) router.push(`/track?id=${encodeURIComponent(val.toUpperCase())}`);
  }

  function handleCopyAddress() {
    navigator.clipboard.writeText(chinaAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleLogout() {
    await fetch('/api/client/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setShowAccountMenu(false);
    router.refresh();
  }

  return (
    <div style={{ fontFamily: FONT, background: '#fff', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @keyframes glow-pulse { 0%,100%{opacity:.45;transform:scale(1)} 50%{opacity:.7;transform:scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .hc-nav-links { display: flex; }
        .hc-cta-mock { display: block; }
        .hc-section { padding: 110px 0; }
        .hc-forbidden-intro { display: block; }
        .hc-footer-nav-cols { display: contents; }
        @media(max-width:768px){
          /* Nav */
          .hc-nav-links { display: none !important; }
          .hc-section-pad { padding-left: 20px !important; padding-right: 20px !important; }

          /* Hero */
          .hc-hero-inner { padding: 56px 20px 48px !important; }
          .hc-hero-title { font-size: 34px !important; line-height: 1.1 !important; letter-spacing: -0.03em !important; }
          .hc-hero-sub { font-size: 15px !important; margin-bottom: 32px !important; }
          .hc-hero-form { flex-direction: column !important; }
          .hc-hero-form button[type="submit"] { width: 100% !important; justify-content: center !important; height: 52px !important; }
          .hc-hero-input { height: 52px !important; }
          .hc-trust { gap: 12px !important; }
          .hc-trust span { font-size: 12px !important; }

          /* Stats */
          .hc-stats { grid-template-columns: repeat(2,1fr) !important; }
          .hc-stat-val { font-size: 32px !important; }
          .hc-stat-pad { padding: 24px 16px !important; }

          /* Sections padding */
          .hc-section { padding: 60px 0 !important; }
          .hc-section-title { font-size: 30px !important; }
          .hc-section-head { margin-bottom: 40px !important; }

          /* Services */
          .hc-services-grid { grid-template-columns: 1fr !important; }
          .hc-service-price { font-size: 40px !important; }

          /* Produits interdits */
          .hc-forbidden-intro { display: none !important; }
          .hc-forbidden-layout { grid-template-columns: 1fr !important; gap: 24px !important; }
          .hc-forbidden-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .hc-forbidden-item { padding: 14px !important; }

          /* Process */
          .hc-process-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .hc-process-arrow { display: none !important; }

          /* CTA */
          .hc-cta-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hc-cta-mock { display: none !important; }
          .hc-cta-title { font-size: 30px !important; }

          /* Contact */
          .hc-contact-grid { grid-template-columns: 1fr !important; }
          .hc-contact-card { padding: 24px !important; }

          /* Footer */
          .hc-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hc-footer-nav-cols { display: none !important; }
          .hc-footer-bottom { flex-direction: column !important; gap: 8px !important; text-align: center !important; }

          /* Modal */
          .hc-modal-inner { border-radius: 20px !important; margin: 12px !important; }
          .hc-modal-body { padding: 20px !important; }
          .hc-modal-head { padding: 20px 20px 16px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: '72px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #e8ecf2', display: 'flex', alignItems: 'center' }}>
        <div className="hc-section-pad" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
          <Link href="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="Hamid Cargo" style={{ height: '36px', width: 'auto', display: 'block' }} />
          </Link>

          <div className="hc-nav-links" style={{ alignItems: 'center', gap: '2px' }}>
            <a href="#services" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>Services &amp; Tarifs</a>
            <a href="#process" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>Comment ça marche</a>
            <a href="#contact" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>Contact</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => setShowAddressModal(true)} style={{ height: '40px', padding: '0 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontFamily: FONT }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Adresse Chine
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowAccountMenu(v => !v)} style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </button>
              {showAccountMenu && (
                <>
                  <div onClick={() => setShowAccountMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 99, background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', minWidth: '204px', overflow: 'hidden', animation: 'fadeUp 0.15s ease-out' }}>
                    {isLoggedIn ? (
                      <>
                        <Link href="/client/dashboard" onClick={() => setShowAccountMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="9" rx="1"/><rect x="15" y="3" width="7" height="5" rx="1"/><rect x="15" y="12" width="7" height="9" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/></svg>
                          Mes colis
                        </Link>
                        <Link href="/track" onClick={() => setShowAccountMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          Suivre un colis
                        </Link>
                        <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>
                          🚪 Se déconnecter
                        </div>
                      </>
                    ) : (
                      <>
                        <Link href="/track" onClick={() => setShowAccountMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          Suivre un colis
                        </Link>
                        <Link href="/client/login" onClick={() => setShowAccountMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                          Se connecter
                        </Link>
                        <Link href="/client/register" onClick={() => setShowAccountMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', fontSize: '14px', fontWeight: 700, color: '#f97316', textDecoration: 'none' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                          Créer un compte
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: 'calc(100vh - 72px)', background: '#05101f', backgroundImage: 'radial-gradient(ellipse at 72% 38%, rgba(249,115,22,0.11) 0%, transparent 55%), radial-gradient(ellipse at 20% 75%, rgba(99,102,241,0.06) 0%, transparent 45%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '96px 48px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '6%', top: '10%', width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 68%)', borderRadius: '50%', filter: 'blur(48px)', pointerEvents: 'none', animation: 'glow-pulse 5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', left: '-4%', bottom: '5%', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div className="hc-hero-inner" style={{ position: 'relative', zIndex: 1, maxWidth: '780px', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)', borderRadius: '100px', padding: '6px 18px', marginBottom: '36px' }}>
            <span style={{ width: '6px', height: '6px', background: '#f97316', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fb923c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Guangzhou → Lomé · Depuis 2021</span>
          </div>

          <h1 className="hc-hero-title" style={{ fontSize: '80px', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.02, color: 'white', marginBottom: '24px' }}>
            Vos colis de Chine<br />
            <span style={{ color: '#f97316' }}>au Togo,</span> en toute<br />
            confiance.
          </h1>

          <p className="hc-hero-sub" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '52px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            Envoi de vos colis depuis Guangzhou jusqu&apos;à Lomé. Suivi en temps réel, notifications WhatsApp, prix transparents.
          </p>

          <form className="hc-hero-form" onSubmit={handleTrack} style={{ display: 'flex', gap: '8px', maxWidth: '600px', margin: '0 auto 36px', alignItems: 'stretch' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.11)', borderRadius: '14px', padding: '0 20px', minWidth: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Entrez votre numéro de tracking…" value={trackingInput} onChange={e => setTrackingInput(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'white', fontSize: '15px', fontWeight: 500, height: '58px', minWidth: 0, fontFamily: FONT }} />
            </div>
            <button type="submit" style={{ height: '58px', padding: '0 32px', borderRadius: '14px', border: 'none', background: '#f97316', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, fontFamily: FONT }}>
              Suivre
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </form>

          <div className="hc-trust" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', flexWrap: 'wrap' }}>
            {['Suivi en temps réel', 'Photos à la réception', 'Notifications WhatsApp', 'Livraison à domicile'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(249,115,22,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="hc-trust" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="hc-stats hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { val: '500+', label: 'Colis livrés', accent: false },
            { val: '3+', label: "Ans d'expérience", accent: false },
            { val: '2', label: 'Bureaux · GZ & Lomé', accent: false },
            { val: '100%', label: 'Suivi garanti', accent: true },
          ].map(({ val, label, accent }, i) => (
            <div key={label} style={{ padding: '40px 24px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '44px', fontWeight: 900, color: accent ? '#f97316' : '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section id="services" className="hc-section" style={{ padding: '110px 0', background: 'white' }}>
        <div className="hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ maxWidth: '560px', marginBottom: '72px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f97316', marginBottom: '14px' }}>Nos formules</p>
            <h2 style={{ fontSize: '50px', fontWeight: 800, letterSpacing: '-0.035em', color: '#0f172a', lineHeight: 1.06, marginBottom: '16px' }}>Choisissez votre mode<br />d&apos;expédition.</h2>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.75 }}>Trois formules adaptées à vos besoins, toutes avec suivi en temps réel et notification WhatsApp automatique.</p>
          </div>

          <div className="hc-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', alignItems: 'start' }}>
            {/* Ordinaire */}
            <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '22px', padding: '36px' }}>
              <div style={{ width: '50px', height: '50px', background: '#eff6ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z"/></svg>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '8px' }}>AÉRIEN</p>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Ordinaire</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.5 }}>Envoi ordinaire par voie aérienne</p>
              <div style={{ paddingBottom: '28px', borderBottom: '1px solid #f1f5f9', marginBottom: '24px' }}>
                <span style={{ fontSize: '54px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>10 000</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>FCFA / kg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>10 – 25 jours</span>
              </div>
              {['Suivi en temps réel', 'Photos à la réception', 'Notification WhatsApp'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '11px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '14px', color: '#475569' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Express (featured) */}
            <div style={{ background: '#0f172a', border: '1.5px solid #0f172a', borderRadius: '22px', padding: '36px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#f97316', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Populaire</div>
              <div style={{ width: '50px', height: '50px', background: 'rgba(249,115,22,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z"/></svg>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: '8px' }}>AÉRIEN - PRIORITAIRE</p>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>Express</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', marginBottom: '28px', lineHeight: 1.5 }}>Livraison rapide par voie aérienne</p>
              <div style={{ paddingBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
                <span style={{ fontSize: '54px', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>13 000</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.38)', marginLeft: '6px' }}>FCFA / kg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>3 – 14 jours</span>
              </div>
              {['Suivi prioritaire', 'Photos à la réception', 'Notification WhatsApp', 'Délai garanti'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '11px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Colis Batterie */}
            <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '22px', padding: '36px' }}>
              <div style={{ width: '50px', height: '50px', background: '#fffbeb', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><line x1="7" y1="12" x2="11" y2="12" strokeWidth="2.2"/><line x1="9" y1="10" x2="9" y2="14" strokeWidth="2.2"/></svg>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '8px' }}>Spécialisé</p>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Colis Batterie</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.5 }}>Téléphones, laptops, trottinettes…</p>
              <div style={{ paddingBottom: '28px', borderBottom: '1px solid #f1f5f9', marginBottom: '24px' }}>
                <span style={{ fontSize: '54px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>11 000</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>FCFA / kg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>10 – 25 jours</span>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.55 }}>Transport conforme aux réglementations pour articles contenant des batteries lithium.</p>
              </div>
              {['Emballage sécurisé', 'Suivi en temps réel', 'Notification WhatsApp'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '11px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '14px', color: '#475569' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUITS INTERDITS ── */}
      <section className="hc-section" style={{ padding: '80px 0', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div className="hc-forbidden-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>
            <div className="hc-forbidden-intro" style={{ paddingTop: '4px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '100px', padding: '6px 16px', marginBottom: '18px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Refusé</span>
              </div>
              <h2 style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.1, marginBottom: '16px' }}>Produits<br />interdits.</h2>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.75 }}>Ces articles ne peuvent pas être expédiés via Hamid Cargo pour des raisons réglementaires et douanières. Tout colis contenant ces produits sera refusé ou saisi.</p>
            </div>

            <div className="hc-forbidden-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
              {[
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/></svg>, title: 'Chicha électronique', sub: 'Vapes, e-cigarettes, pods et accessoires' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M5 12h6" strokeWidth="2.5"/></svg>, title: 'Grosses batteries', sub: 'Batteries industrielles, powerbanks > 20 000 mAh' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, title: 'Drones', sub: 'Tout type de drone, pièces et télécommandes' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: 'Articles contrefaits', sub: 'Vêtements, montres, sacs de marque contrefaits' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: 'Substances dangereuses', sub: 'Produits inflammables, corrosifs, toxiques' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, title: 'Armes & munitions', sub: 'Toute arme, réplique, couteau de combat' },
              ].map(({ icon, title, sub }) => (
                <div key={title} style={{ background: 'white', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#fff1f1', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '18px 24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.65 }}><strong>Important :</strong> Tout colis contenant des produits interdits sera <strong>immédiatement saisi</strong> par les douanes. Hamid Cargo ne pourra en aucun cas être tenu responsable. En cas de doute, contactez-nous avant l&apos;envoi.</p>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process" className="hc-section" style={{ padding: '110px 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f97316', marginBottom: '14px' }}>Processus</p>
            <h2 style={{ fontSize: '50px', fontWeight: 800, letterSpacing: '-0.035em', color: '#0f172a', lineHeight: 1.06 }}>Comment ça marche ?</h2>
          </div>
          <div className="hc-process-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr 48px 1fr', alignItems: 'start' }}>
            {[
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, n: '1', title: 'Déposez en Chine', desc: 'Envoyez vos articles à notre entrepôt de Guangzhou. Nous les enregistrons et photographions à réception.' },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z"/></svg>, n: '2', title: 'Transit & suivi', desc: 'Suivez votre colis en temps réel de la Chine au Togo. Notification WhatsApp à chaque étape clé.' },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, n: '3', title: 'Réception à Lomé', desc: "Récupérez votre colis dans notre bureau à Dekon ou optez pour la livraison à domicile à Lomé." },
            ].map((step, i) => (
              <React.Fragment key={step.n}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                      {step.icon}
                      <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#f97316', borderRadius: '50%', border: '2.5px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'white' }}>{step.n}</div>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, maxWidth: '260px', margin: '0 auto' }}>{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hc-process-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '32px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dde3ec" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA CLIENT ── */}
      <section className="hc-section" style={{ padding: '110px 0', background: '#05101f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '-6%', top: '-25%', width: '540px', height: '540px', background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div className="hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>
          <div className="hc-cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f97316', marginBottom: '16px' }}>Espace client</p>
              <h2 className="hc-cta-title" style={{ fontSize: '46px', fontWeight: 800, letterSpacing: '-0.035em', color: 'white', lineHeight: 1.08, marginBottom: '20px' }}>Gérez vos colis<br />depuis votre compte.</h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '40px' }}>Créez un compte avec votre numéro de téléphone togolais. Consultez tous vos colis, leur statut et leur historique à tout moment.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/client/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '52px', padding: '0 28px', background: '#f97316', borderRadius: '12px', fontSize: '15px', fontWeight: 700, color: 'white', textDecoration: 'none' }}>
                  Créer un compte
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link href="/client/login" style={{ display: 'inline-flex', alignItems: 'center', height: '52px', padding: '0 28px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
                  Se connecter
                </Link>
              </div>
            </div>
            <div className="hc-cta-mock" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', padding: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '18px' }}>Aperçu · Mes colis</div>
              {[
                { code: 'JT2024081203', sub: 'Express · 2.4 kg', status: 'En transit', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
                { code: 'JT2024080891', sub: 'Ordinaire · 5.1 kg', status: 'Livré', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
                { code: 'JT2024079354', sub: 'Batterie · 1.8 kg', status: 'Reçu Chine', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
              ].map(({ code, sub, status, color, bg }) => (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 18px', marginBottom: '10px' }}>
                  <div style={{ width: '38px', height: '38px', background: bg, borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="9" rx="1"/><rect x="15" y="3" width="7" height="5" rx="1"/><rect x="15" y="12" width="7" height="9" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '3px', fontFamily: 'monospace' }}>{code}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)' }}>{sub}</div>
                  </div>
                  <div style={{ background: bg, borderRadius: '100px', padding: '4px 11px', fontSize: '11px', fontWeight: 700, color, whiteSpace: 'nowrap' }}>{status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="hc-section" style={{ padding: '110px 0', background: 'white' }}>
        <div className="hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f97316', marginBottom: '14px' }}>Contact</p>
            <h2 style={{ fontSize: '50px', fontWeight: 800, letterSpacing: '-0.035em', color: '#0f172a', lineHeight: 1.06, marginBottom: '16px' }}>Nos équipes à votre service.</h2>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.75 }}>Contactez directement nos équipes à Lomé ou à Guangzhou.</p>
          </div>

          <div className="hc-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Lomé */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
                <div style={{ width: '44px', height: '44px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🇹🇬</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '3px' }}>Bureau Togo</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Lomé</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {[
                  { name: 'Mouhamed', phones: ['+228 90 19 65 29', '+228 96 82 99 05'], wa: '22890196529' },
                  { name: 'Seyni', phones: ['+228 70 15 13 30'], wa: '22870151330' },
                ].map(({ name, phones, wa }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '5px' }}>{name}</div>
                      {phones.map(p => <a key={p} href={`tel:${p.replace(/\s/g, '')}`} style={{ display: 'block', fontSize: '14px', color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>{p}</a>)}
                    </div>
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{WA_ICON}</a>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65 }}>Dekon, von d&apos;arrêt des Taxi d&apos;Agoe Zongo<br />Rue Sédomé, Lomé, Togo</span>
              </div>
            </div>

            {/* Chine */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
                <div style={{ width: '44px', height: '44px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🇨🇳</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '3px' }}>Bureau Chine</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Guangzhou</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  { name: 'Hamid', phone: '+86 138 0924 9171', wa: '8613809249171' },
                  { name: 'Ibrahim', phone: '+86 159 1883 5701', wa: '8615918835701' },
                  { name: 'Kader', phone: '+86 195 7571 7440', wa: '8619575717440' },
                ].map(({ name, phone, wa }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{name}</div>
                      <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ fontSize: '14px', color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>{phone}</a>
                    </div>
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{WA_ICON}</a>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65, fontFamily: 'monospace' }}>广东省广州市越秀区环市西路202号<br />桐舍酒店 7楼 729室 · Guangzhou</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#05101f', padding: '72px 0 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div className="hc-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '72px', marginBottom: '56px' }}>
            <div>
              <img src="/logo.svg" alt="Hamid Cargo" style={{ height: '34px', width: 'auto', marginBottom: '20px', display: 'block', filter: 'brightness(0) invert(1)' }} />
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, maxWidth: '300px', marginBottom: '28px' }}>Transport de colis entre la Chine (Guangzhou) et le Togo (Lomé). Fiable, rapide et transparent depuis 2021.</p>
              <Link href="/track" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 22px', background: '#f97316', borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: 'white', textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Suivre un colis
              </Link>
            </div>
            <div className="hc-footer-nav-cols">
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '22px' }}>Navigation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[['#services', 'Services & Tarifs'], ['#process', 'Comment ça marche'], ['#contact', 'Contact'], ['/track', 'Suivi de colis']].map(([href, label]) => (
                  <a key={href} href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>
            <div className="hc-footer-nav-cols">
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '22px' }}>Espace client</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[['/client/login', 'Se connecter'], ['/client/register', 'Créer un compte'], ['/privacy', 'Confidentialité']].map(([href, label]) => (
                  <Link key={href} href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, textDecoration: 'none' }}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hc-footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)' }}>© 2026 Hamid Cargo Logistics. Tous droits réservés.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)' }}>Guangzhou · Lomé</p>
          </div>
        </div>
      </footer>

      {/* ── MODAL ADRESSE ── */}
      {showAddressModal && (
        <div onClick={() => setShowAddressModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} className="hc-modal-inner" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.45)', animation: 'fadeUp 0.18s ease-out' }}>
            <div className="hc-modal-head" style={{ padding: '28px 32px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: '8px' }}>Entrepôt Guangzhou</p>
                <h3 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>Adresse à transmettre<br />à votre fournisseur</h3>
              </div>
              <button onClick={() => setShowAddressModal(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="hc-modal-body" style={{ padding: '24px 32px 32px' }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '22px 24px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '14px' }}>Adresse complète</p>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', lineHeight: 1.85, fontFamily: 'monospace' }}>
                  广东省广州市越秀区<br />
                  环市西路202号<br />
                  桐舍酒店 7楼 729室
                </p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#64748b', marginTop: '6px' }}>Guangzhou, Chine</p>
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', fontSize: '14px', color: '#475569', fontWeight: 600 }}>
                  Tél : <span style={{ color: '#0f172a' }}>+86 138 0924 9171</span> (Hamid)
                </div>
              </div>

              <button onClick={handleCopyAddress} style={{ width: '100%', height: '52px', borderRadius: '14px', border: 'none', background: copied ? '#10b981' : '#0f172a', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', marginBottom: '20px', fontFamily: FONT, transition: 'background 0.2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                {copied ? '✓ Adresse copiée !' : "Copier l'adresse complète"}
              </button>

              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '20px 22px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400e', marginBottom: '16px' }}>Instructions importantes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    "Indiquez votre nom complet, votre numéro togolais, et écrivez EXPRESS si vous souhaitez l'envoi rapide.",
                    "Sans nom sur le colis, il sera expédié par bateau et considéré abandonné s'il n'est pas réclamé.",
                    "Sans mention EXPRESS, le colis est traité en Ordinaire (10 000 FCFA/kg · 10–25 jours).",
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 800, color: 'white', marginTop: '1px' }}>{i + 1}</div>
                      <p style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
