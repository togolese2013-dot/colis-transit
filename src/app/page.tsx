"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Package, Search, User, Clock, Phone, CheckCircle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const chinaAddress = `广东省广州市越秀区环市西路202号\n桐舍酒店 7楼 729室\nGuangzhou, Chine\nTél: +86 138 0924 9171 (Hamid)`;

  function handleCopyAddress() {
    navigator.clipboard.writeText(chinaAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    fetch('/api/client/packages')
      .then(r => { if (r.ok) setIsLoggedIn(true) })
      .catch(() => {})
  }, []);

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const val = trackingInput.trim();
    if (val) router.push(`/track?id=${encodeURIComponent(val.toUpperCase())}`);
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
        <img src="/logo.svg" width={190} height={36} alt="Hamid Cargo" style={{ display: 'block' }} />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddressModal(true)}
            style={{ height: '36px', padding: '0 0.875rem', borderRadius: 'var(--r-full)', border: '1.5px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', flexShrink: 0, fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-2)', fontFamily: 'var(--font)' }}
          >
            Adresse
          </button>
          {isLoggedIn ? (
            <Link href="/client/dashboard" style={{ textDecoration: 'none' }}>
              <button style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', fontSize: '0.8125rem', fontWeight: '700', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <User size={15} color="white" /> Mes colis
              </button>
            </Link>
          ) : (
            <Link href="/client/register" style={{ textDecoration: 'none' }}>
              <button title="Créer un compte" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <User size={17} color="white" strokeWidth={2.5} />
              </button>
            </Link>
          )}
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
            <div style={{ width: '44px', height: '44px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>🚢</div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-1)', marginBottom: '0.25rem' }}>Ordinaire</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>Transport standard Guangzhou–Lomé</div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.02em' }}>10 000 <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>FCFA/kg</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem' }}>
                <Clock size={12} color="var(--text-3)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>10 – 25 jours</span>
              </div>
            </div>
          </div>

          {/* Express */}
          <div style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.25)', borderRadius: 'var(--r-full)', padding: '0.15rem 0.5rem', fontSize: '0.625rem', fontWeight: '800', color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rapide</div>
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>✈️</div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'white', marginBottom: '0.25rem' }}>Express</div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Livraison prioritaire rapide</div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>13 000 <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>FCFA/kg</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem' }}>
                <Clock size={12} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3 – 14 jours</span>
              </div>
            </div>
          </div>

          {/* Colis Batterie */}
          <div style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', flexShrink: 0 }}>🔋</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-1)', marginBottom: '0.125rem' }}>Colis Batterie</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>Transport spécialisé pour articles contenant des batteries (téléphones, laptops, trottinettes…)</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f59e0b', letterSpacing: '-0.02em' }}>11 000</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-3)' }}>FCFA/kg</div>
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
              { n: '2', title: 'Transit & suivi en temps réel', desc: 'Suivez votre colis à chaque étape : Chine → En transit → Arrivé à Lomé.', icon: '✈️' },
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
            {isLoggedIn ? (
              <Link href="/client/dashboard" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', height: '48px', borderRadius: 'var(--r-full)', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Package size={16} /> Voir mes colis
                </button>
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{ padding: '0 1.5rem 3rem', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Lomé */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🇹🇬</span>
              <h3 style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-1)', margin: 0 }}>Contact Lomé</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { name: 'Mouhamed', phones: ['+228 90 19 65 29', '+228 96 82 99 05'] },
                { name: 'Seyni', phones: ['+228 70 15 13 30'] },
              ].map(({ name, phones }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-1)' }}>{name}</div>
                    {phones.map(p => (
                      <a key={p} href={`tel:${p.replace(/\s/g, '')}`} style={{ display: 'block', fontSize: '0.875rem', color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>{p}</a>
                    ))}
                  </div>
                  <a href={`https://wa.me/${phones[0].replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1.125rem' }}>
                    💬
                  </a>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                  Dekon, dans le von d&apos;arrêt des Taxi d&apos;Agoe Zongo<br />Rue Sédomé, Lomé
                </span>
              </div>
            </div>
          </div>

          {/* Chine */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🇨🇳</span>
              <h3 style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-1)', margin: 0 }}>Contact Chine</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { name: 'Hamid', phone: '+86 138 0924 9171' },
                { name: 'Ibrahim', phone: '+86 159 1883 5701' },
                { name: 'Kader', phone: '+86 195 7571 7440' },
              ].map(({ name, phone }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-1)' }}>{name}</div>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>{phone}</a>
                  </div>
                  <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1.125rem' }}>
                    💬
                  </a>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                  广东省广州市越秀区环市西路202号<br />桐舍酒店 7楼 729室, Guangzhou
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── MODAL ADRESSE CHINE ── */}
      {showAddressModal && (
        <div
          onClick={() => setShowAddressModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '520px', padding: '1.5rem 1.5rem 2.5rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Handle */}
            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 1.25rem' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '0.25rem' }}>Entrepôt Guangzhou</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-1)', margin: 0 }}>📦 Adresse à envoyer au fournisseur</h2>
              </div>
              <button onClick={() => setShowAddressModal(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
            </div>

            {/* Address block */}
            <div style={{ background: '#fafafa', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '1.125rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '0.625rem' }}>Adresse complète</div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-1)', lineHeight: 1.7, fontFamily: 'var(--font-mono, monospace)' }}>
                广东省广州市越秀区<br />
                环市西路202号<br />
                桐舍酒店 7楼 729室<br />
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-2)' }}>Guangzhou, Chine</span>
              </p>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                📞 <strong>+86 138 0924 9171</strong> (Hamid)
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyAddress}
              style={{ width: '100%', height: '48px', borderRadius: 'var(--r-full)', border: 'none', background: copied ? '#22c55e' : 'var(--accent)', color: 'white', fontWeight: '700', fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font)', marginBottom: '1.5rem', transition: 'background 0.2s' }}
            >
              {copied ? '✅ Adresse copiée !' : '📋 Copier l\'adresse'}
            </button>

            {/* Instructions */}
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '1.125rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b45309', marginBottom: '0.875rem' }}>⚠️ Instructions importantes pour le fournisseur</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { n: '1', text: 'Demandez à votre fournisseur d\'écrire sur l\'étiquette du colis : votre nom complet, votre numéro de téléphone togolais, et le mot EXPRESS si vous souhaitez un envoi rapide (laisser vide pour un envoi ordinaire). Ces informations doivent être en caractères lisibles — c\'est indispensable pour identifier votre marchandise dès la réception à l\'entrepôt.' },
                  { n: '2', text: 'Tout colis arrivant sans nom sera automatiquement expédié par bateau (envoi ordinaire) et considéré comme abandonné s\'il n\'est pas réclamé dans les délais. Hamid Cargo ne pourra pas être tenu responsable de la perte d\'un colis non identifié.' },
                  { n: '3', text: 'Sans indication du type d\'envoi, votre colis sera traité comme envoi ORDINAIRE (10 000 FCFA/kg · 10–25 jours). Si vous souhaitez l\'envoi EXPRESS (13 000 FCFA/kg · 3–14 jours), assurez-vous que le mot EXPRESS est bien inscrit sur le colis avant l\'expédition.' },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '800', fontSize: '0.75rem', color: 'white' }}>{n}</div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.5, paddingTop: '0.2rem' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <img src="/logo.svg" width={170} height={33} alt="Hamid Cargo" style={{ display: 'block' }} />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>Envoi de colis · Chine &amp; Togo</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/track" style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none' }}>Suivre un colis</Link>
          <Link href="/client/login" style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none' }}>Espace client</Link>
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.75rem' }}>
          © 2026 Hamid Cargo Logistics
          {/* Admin access: hamidcargo.com/login */}
        </p>
      </footer>

    </div>
  );
}
