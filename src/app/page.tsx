"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FONT = "'Plus Jakarta Sans', var(--font-jakarta), system-ui, sans-serif";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(1.08); }
  }
  .glow-anim { animation: glow-pulse 5s ease-in-out infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  @media(max-width: 767px) { .hc-stats-bar { display: none !important; } .hc-hero-badge { display: none !important; } }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────

const WhatsAppIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const CheckIcon = ({ color = "#10b981", size = 10 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Address Modal (bottom-sheet) ──────────────────────────────────────────────

function AddressModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const address = "广东省广州市越秀区环市西路202号\n桐舍酒店 7楼 729室\nGuangzhou, Chine\nTél: +86 138 0924 9171 (Hamid)";

  const handleCopy = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)", paddingBottom: 36, animation: "fadeUp 0.2s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "13px 0 6px" }}>
          <div style={{ width: 34, height: 4, background: "#e2e8f0", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "0 22px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f97316", marginBottom: 4 }}>Entrepôt Guangzhou</p>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginBottom: 18, lineHeight: 1.2 }}>
            Adresse à transmettre<br />à votre fournisseur
          </h3>
          <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 13, padding: "16px 18px", marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 9 }}>Adresse complète</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.8, fontFamily: "monospace" }}>
              广东省广州市越秀区<br />环市西路202号<br />桐舍酒店 7楼 729室
            </p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Guangzhou, Chine</p>
            <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#475569", fontWeight: 600 }}>
              Tél : +86 138 0924 9171 (Hamid)
            </div>
          </div>
          <button onClick={handleCopy} style={{ width: "100%", height: 48, borderRadius: 13, border: "none", background: copied ? "#10b981" : "#0f172a", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12, fontFamily: FONT }}>
            {copied ? "✓ Adresse copiée !" : "Copier l'adresse complète"}
          </button>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 13, padding: "14px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#92400e", marginBottom: 10 }}>Instructions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                "Indiquez votre nom complet, votre numéro togolais, et écrivez EXPRESS pour l'envoi rapide.",
                "Sans nom, le colis est expédié par bateau et considéré abandonné s'il n'est pas réclamé.",
                "Sans mention EXPRESS, le colis est traité en Ordinaire (10 000 FCFA/kg · 10–25 jours).",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 17, height: 17, background: "#f59e0b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, fontWeight: 800, color: "white", marginTop: 1 }}>{i + 1}</div>
                  <p style={{ fontSize: 11, color: "#78350f", lineHeight: 1.55 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({ type, typeColor, iconBg, iconColor, name, price, duration, features, dark, badge }: {
  type: string; typeColor: string; iconBg: string; iconColor: string;
  name: string; price: string; duration: string; features: string[];
  dark: boolean; badge?: string;
}) {
  return (
    <div style={{ background: dark ? "#0f172a" : "white", border: dark ? "none" : "1.5px solid #e2e8f0", borderRadius: 16, padding: 14, position: "relative", overflow: "hidden" }}>
      {badge && <div style={{ position: "absolute", top: 12, right: 12, background: "#f97316", borderRadius: 100, padding: "3px 9px", fontSize: 9, fontWeight: 700, color: "white", letterSpacing: "0.05em", textTransform: "uppercase" }}>{badge}</div>}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: typeColor, marginBottom: 2 }}>{type}</p>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: dark ? "white" : "#0f172a" }}>{name}</h3>
        </div>
        <div style={{ width: 28, height: 28, background: iconBg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z" />
          </svg>
        </div>
      </div>
      <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#f1f5f9"}` }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: dark ? "white" : "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{price}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: dark ? "rgba(255,255,255,0.38)" : "#94a3b8", marginTop: 2 }}>FCFA / kg</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={dark ? "rgba(255,255,255,0.38)" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        <span style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.7)" : "#475569", fontWeight: 600 }}>{duration}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CheckIcon color={dark ? "#f97316" : "#10b981"} size={10} />
            <span style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.62)" : "#475569" }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Office Card ───────────────────────────────────────────────────────────────

function OfficeCard({ flag, label, city, contacts, address, onAddressClick }: {
  flag: string; label: string; city: string;
  contacts: { name: string; phones: string[]; whatsapp: string }[];
  address?: string; onAddressClick?: () => void;
}) {
  return (
    <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, background: "white", border: "1.5px solid #e2e8f0", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{flag}</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{city}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: address || onAddressClick ? 12 : 0 }}>
        {contacts.map((c) => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px", background: "white", border: "1px solid #e2e8f0", borderRadius: 11 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{c.name}</div>
              {c.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, "")}`} style={{ display: "block", fontSize: 11, color: "#f97316", fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none" }}>{p}</a>
              ))}
            </div>
            <a href={c.whatsapp} target="_blank" rel="noopener noreferrer" style={{ width: 38, height: 38, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <WhatsAppIcon size={17} />
            </a>
          </div>
        ))}
      </div>
      {address && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "9px 11px", background: "white", border: "1px solid #e2e8f0", borderRadius: 9 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{address}</span>
        </div>
      )}
      {onAddressClick && (
        <button onClick={onAddressClick} style={{ width: "100%", height: 42, borderRadius: 10, border: "none", background: "#0f172a", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: FONT }}>
          Voir l'adresse de l'entrepôt
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/client/packages")
      .then((r) => { if (r.ok) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = trackingInput.trim();
    if (val) router.push(`/track?id=${encodeURIComponent(val.toUpperCase())}`);
  };

  const featureBadges = ["Suivi réel", "Notif. WhatsApp", "Livraison Lomé"];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100vh", overflowX: "hidden", fontFamily: FONT, WebkitFontSmoothing: "antialiased", background: "white" }}>

        {/* ── NAV ── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, height: 54, background: "rgba(5,16,31,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
          <Link href="/" style={{ flexShrink: 0 }}>
            <img src="/logo.svg" alt="Hamid Cargo" style={{ height: 22, display: "block", filter: "brightness(0) invert(1)" }} />
          </Link>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <button onClick={() => setShowAddressModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.06)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" }}>
              Adresse Chine
            </button>
            {isLoggedIn ? (
              <Link href="/client/dashboard" style={{ width: 28, height: 28, borderRadius: 7, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="7" height="9" rx="1" /><rect x="15" y="3" width="7" height="5" rx="1" /><rect x="15" y="12" width="7" height="9" rx="1" /><rect x="2" y="16" width="7" height="5" rx="1" />
                </svg>
              </Link>
            ) : (
              <Link href="/client/login" style={{ width: 28, height: 28, borderRadius: 7, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ background: "#05101f", padding: "32px 20px 36px", position: "relative", overflow: "hidden" }}>
          <div className="glow-anim" style={{ position: "absolute", right: -30, top: -40, width: 240, height: 240, background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
            <div className="hc-hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 100, padding: "4px 13px", marginBottom: 18 }}>
              <span style={{ width: 5, height: 5, background: "#f97316", borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fb923c", letterSpacing: "0.09em", textTransform: "uppercase" }}>Guangzhou → Lomé · Depuis 2021</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "white", marginBottom: 12 }}>
              Vos colis de Chine<br /><span style={{ color: "#f97316" }}>au Togo,</span> en toute<br />confiance.
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.7, marginBottom: 22 }}>
              Envoi depuis Guangzhou jusqu'à Lomé. Suivi en temps réel, notifications WhatsApp.
            </p>
            <form onSubmit={handleTrackSubmit} style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.11)", borderRadius: 12, padding: "0 15px", height: 48 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder="N° de tracking…"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "white", fontSize: 16, fontWeight: 500, minWidth: 0, fontFamily: FONT }}
                />
              </div>
              <button type="submit" style={{ height: 48, borderRadius: 12, border: "none", background: "#f97316", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: FONT }}>
                Suivre mon colis <ArrowRight />
              </button>
            </form>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {featureBadges.map((badge) => (
                <div key={badge} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", borderRadius: 100, padding: "4px 10px" }}>
                  <div style={{ width: 13, height: 13, borderRadius: "50%", background: "rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckIcon color="#f97316" size={6} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.48)" }}>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="hc-stats-bar" style={{ background: "#f8fafc", borderBottom: "1px solid #e8ecf2", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { val: "500+", label: "Colis livrés", accent: false },
            { val: "3+", label: "Ans d'expérience", accent: false },
            { val: "2", label: "Bureaux GZ & Lomé", accent: false },
            { val: "100%", label: "Suivi garanti", accent: true },
          ].map(({ val, label, accent }, i) => (
            <div key={label} style={{ textAlign: "center", padding: "20px 10px", borderRight: i < 3 ? "1px solid #e8ecf2" : "none" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: accent ? "#f97316" : "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── SERVICES ── */}
        <section id="services" style={{ padding: "28px 20px", background: "white" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f97316", marginBottom: 4 }}>Nos formules</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 4 }}>Services & Tarifs</h2>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>Trois formules avec suivi en temps réel et notification WhatsApp.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ServiceCard type="AÉRIEN" typeColor="#3b82f6" iconBg="#eff6ff" iconColor="#3b82f6" name="Ordinaire" price="10 000" duration="10–25 jours" features={["Suivi temps réel", "Photos réception", "Notif. WhatsApp"]} dark={false} />
              <ServiceCard type="PRIORITAIRE" typeColor="#f97316" iconBg="rgba(249,115,22,0.15)" iconColor="#f97316" name="Express" price="13 000" duration="3–14 jours" features={["Suivi prioritaire", "Photos réception", "Notif. WhatsApp", "Délai garanti"]} dark={true} badge="Populaire" />
            </div>
            {/* Colis Batterie — pleine largeur */}
            <div style={{ marginTop: 12, background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 3 }}>SPÉCIALISÉ</p>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Colis Batterie 🔋</h3>
                </div>
                <div style={{ width: 36, height: 36, background: "#fffbeb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2" /><line x1="7" y1="12" x2="11" y2="12" strokeWidth="2.2" /><line x1="9" y1="10" x2="9" y2="14" strokeWidth="2.2" /></svg>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>11 000</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>FCFA / kg</span>
              </div>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "9px 11px", marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>Téléphones, laptops, trottinettes — transport conforme aux réglementations.</p>
              </div>
              {["Emballage sécurisé", "Suivi en temps réel", "Notification WhatsApp"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <CheckIcon size={11} /><span style={{ fontSize: 12, color: "#475569" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUITS INTERDITS ── */}
        <section style={{ padding: "0 20px 28px", background: "white" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ background: "#fff1f1", border: "1.5px solid #fecaca", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>Produits interdits</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 10 }}>
                {["Chicha électronique", "Grosses batteries", "Drones", "Produits dangereux", "Armes & munitions"].map((item) => (
                  <div key={item} style={{ background: "white", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 9px", fontSize: 11, fontWeight: 600, color: "#7f1d1d" }}>{item}</div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#7f1d1d", lineHeight: 1.5 }}>En cas de doute sur un article, contactez-nous avant l'envoi.</p>
            </div>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section id="process" style={{ padding: "28px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f97316", marginBottom: 4 }}>Processus</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 22 }}>Comment ça marche ?</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { n: 1, title: "Déposez en Chine", desc: "Envoyez à notre entrepôt de Guangzhou. Nous enregistrons et photographions à réception." },
                { n: 2, title: "Transit & suivi", desc: "Suivez en temps réel de la Chine au Togo. Notification WhatsApp à chaque étape clé." },
                { n: 3, title: "Réception à Lomé", desc: "Récupérez à Dekon ou optez pour la livraison à domicile à Lomé.", last: true },
              ].map(({ n, title, desc, last }) => (
                <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: last ? 0 : 20, position: "relative" }}>
                  {!last && <div style={{ position: "absolute", left: 18, top: 38, width: 2, height: "calc(100% - 38px)", background: "#e2e8f0" }} />}
                  <div style={{ width: 38, height: 38, background: "white", border: "2px solid #e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ position: "absolute", top: -5, right: -5, width: 17, height: 17, background: "#f97316", borderRadius: "50%", border: "2px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "white", lineHeight: 1 }}>{n}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {n === 1 && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>}
                      {n === 2 && <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z" />}
                      {n === 3 && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
                    </svg>
                  </div>
                  <div style={{ paddingTop: 7 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{title}</h3>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ESPACE CLIENT ── */}
        <section style={{ background: "#05101f", padding: "28px 20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, bottom: -20, width: 180, height: 180, background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f97316", marginBottom: 6 }}>Espace client</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.2 }}>Gérez vos colis depuis votre compte.</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, marginBottom: 18 }}>Créez un compte avec votre numéro togolais. Consultez vos colis à tout moment.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/client/register" style={{ flex: 1, height: 44, borderRadius: 10, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", textDecoration: "none" }}>Créer un compte</Link>
              <Link href="/client/login" style={{ height: 44, padding: "0 16px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.13)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", textDecoration: "none", whiteSpace: "nowrap" }}>Connexion</Link>
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" style={{ padding: "28px 20px", background: "white" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f97316", marginBottom: 4 }}>Contact</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 4 }}>Nos équipes.</h2>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Contactez nos équipes à Lomé ou à Guangzhou.</p>
            <OfficeCard
              flag="🇹🇬" label="Bureau Togo" city="Lomé"
              contacts={[
                { name: "Mouhamed", phones: ["+228 90 19 65 29", "+228 96 82 99 05"], whatsapp: "https://wa.me/22890196529" },
                { name: "Seyni", phones: ["+228 70 15 13 30"], whatsapp: "https://wa.me/22870151330" },
              ]}
              address="Dekon, von d'arrêt des Taxi d'Agoe Zongo, Rue Sédomé, Lomé"
            />
            <div style={{ marginTop: 12 }}>
              <OfficeCard
                flag="🇨🇳" label="Bureau Chine" city="Guangzhou"
                contacts={[
                  { name: "Hamid", phones: ["+86 138 0924 9171"], whatsapp: "https://wa.me/8613809249171" },
                  { name: "Ibrahim", phones: ["+86 159 1883 5701"], whatsapp: "https://wa.me/8615918835701" },
                  { name: "Kader", phones: ["+86 195 7571 7440"], whatsapp: "https://wa.me/8619575717440" },
                ]}
                onAddressClick={() => setShowAddressModal(true)}
              />
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: "#05101f", padding: "24px 20px 32px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <img src="/logo.svg" alt="Hamid Cargo" style={{ height: 22, filter: "brightness(0) invert(1)", marginBottom: 14, display: "block" }} />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, marginBottom: 20 }}>
              Transport de colis entre la Chine (Guangzhou) et le Togo (Lomé). Fiable, rapide et transparent depuis 2021.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {([["#services", "Services & Tarifs"], ["#process", "Comment ça marche"], ["#contact", "Contact"], ["/client/register", "Créer un compte"], ["/privacy", "Confidentialité"]] as [string, string][]).map(([href, label]) => (
                <a key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500, textDecoration: "none" }}>{label}</a>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>© 2026 Hamid Cargo Logistics · Guangzhou · Lomé</p>
            </div>
          </div>
        </footer>
      </div>

      {showAddressModal && <AddressModal onClose={() => setShowAddressModal(false)} />}
    </>
  );
}
