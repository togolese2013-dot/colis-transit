"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  body { padding-bottom: 0 !important; }
  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
    50%       { box-shadow: 0 0 0 6px rgba(249,115,22,0); }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(1.08); }
  }
  .step-pulse  { animation: pulse-dot 2s ease-in-out infinite; }
  .glow-anim   { animation: glow-pulse 5s ease-in-out infinite; }
  .status-dot  { animation: pulse-dot 2s ease-in-out infinite; }
`;

const FONT = "'Plus Jakarta Sans', var(--font-jakarta), system-ui, sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────────

type DbStatus = "RECU_CHINE" | "EN_TRANSIT" | "ARRIVE_LOME" | "LIVRE";
type StepStatus = "done" | "active" | "pending";

interface ParcelEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  status: StepStatus;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRICE_MAP: Record<string, number> = {
  ORDINAIRE: 10000,
  EXPRESS: 13000,
  COLIS_BATTERIE: 11000,
};

const PROGRESS_MAP: Record<DbStatus, number> = {
  RECU_CHINE: 15,
  EN_TRANSIT: 62,
  ARRIVE_LOME: 85,
  LIVRE: 100,
};

const STATUS_BADGE: Record<DbStatus, string> = {
  RECU_CHINE: "REÇU EN CHINE 🇨🇳",
  EN_TRANSIT: "EN TRANSIT · CHINE → TOGO",
  ARRIVE_LOME: "ARRIVÉ À LOMÉ 🇹🇬",
  LIVRE: "LIVRÉ ✅",
};

const STATUS_TITLE: Record<DbStatus, string> = {
  RECU_CHINE: "Votre colis est en Chine",
  EN_TRANSIT: "Votre colis est en route",
  ARRIVE_LOME: "Votre colis est à Lomé",
  LIVRE: "Votre colis a été livré",
};

const STATUS_EMOJI: Record<DbStatus, string> = {
  RECU_CHINE: "📦",
  EN_TRANSIT: "🚢",
  ARRIVE_LOME: "🇹🇬",
  LIVRE: "✅",
};

const PROGRESS_TEXT: Record<DbStatus, string> = {
  RECU_CHINE: "En attente d'expédition",
  EN_TRANSIT: "En cours d'acheminement",
  ARRIVE_LOME: "Prêt à être retiré",
  LIVRE: "Livraison effectuée",
};

const FORMULA_MAP: Record<string, string> = {
  ORDINAIRE: "Ordinaire",
  EXPRESS: "Express",
  COLIS_BATTERIE: "Batterie",
};

const DB_ORDER: DbStatus[] = ["RECU_CHINE", "EN_TRANSIT", "ARRIVE_LOME", "LIVRE"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSteps(status: DbStatus) {
  const currentIdx = DB_ORDER.indexOf(status);
  const display = [
    { id: "RECU_CHINE", label: "Reçu en\nChine" },
    { id: "EN_TRANSIT", label: "Expédié" },
    { id: "ARRIVE_LOME", label: "Reçu à\nLomé" },
    { id: "LIVRE", label: "Livré au\nclient" },
  ];
  return display.map(({ id, label }) => {
    const stepIdx = DB_ORDER.indexOf(id as DbStatus);
    let stepStatus: StepStatus = "pending";
    if (status === "LIVRE") {
      stepStatus = "done";
    } else if (stepIdx < currentIdx) {
      stepStatus = "done";
    } else if (stepIdx === currentIdx) {
      stepStatus = "active";
    }
    return { id, label, status: stepStatus };
  });
}

function buildEvents(pkg: any): ParcelEvent[] {
  const currentIdx = DB_ORDER.indexOf(pkg.status);
  const defs = [
    {
      id: "LIVRE",
      title: "Livré au client",
      desc: "Colis remis au destinataire.",
    },
    {
      id: "ARRIVE_LOME",
      title: "Arrivé à Lomé",
      desc: "Colis réceptionné à l'entrepôt de Lomé.",
    },
    {
      id: "EN_TRANSIT",
      title: "En route vers Lomé",
      desc: "Colis en cours d'acheminement depuis Guangzhou.",
    },
    {
      id: "RECU_CHINE",
      title: "Reçu en Chine — Guangzhou",
      desc: `Colis pesé et enregistré sous la référence ${pkg.tracking_number} à l'entrepôt de Guangzhou.`,
    },
  ];
  return defs.map((def) => {
    const defIdx = DB_ORDER.indexOf(def.id as DbStatus);
    const evStatus: StepStatus =
      pkg.status === "LIVRE"
        ? "done"
        : defIdx < currentIdx
        ? "done"
        : defIdx === currentIdx
        ? "active"
        : "pending";
    const date =
      evStatus !== "pending"
        ? def.id === "RECU_CHINE"
          ? formatTrackDate(pkg.created_at)
          : evStatus === "active"
          ? "Aujourd'hui"
          : "Récemment"
        : "";
    return { id: def.id, title: def.title, description: def.desc, date, status: evStatus };
  });
}

function formatTrackDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) +
    " · " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDateLong(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function computeETA(shippingType: string, createdAt: string, status: DbStatus): string {
  if (status === "LIVRE") return "Livré";
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  const days = shippingType === "EXPRESS" ? 14 : 25;
  d.setDate(d.getDate() + days);
  return "~" + d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatAmount(n: number): string {
  return n.toLocaleString("fr-FR");
}

function calcAmount(shippingType: string, weightKg: number | null): number {
  if (!weightKg) return 0;
  return Math.round(weightKg * (PRICE_MAP[shippingType] ?? 10000));
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const CheckIcon = ({ color = "white", size = 13 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TruckIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Step Bar ──────────────────────────────────────────────────────────────────

function StepBar({ steps }: { steps: ReturnType<typeof getSteps> }) {
  return (
    <div style={{ background: "white", borderBottom: "1px solid #e8ecf2", display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
      {steps.map((step, i) => {
        const isDone = step.status === "done";
        const isActive = step.status === "active";
        const isPending = step.status === "pending";
        return (
          <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 8px", gap: 6, position: "relative" }}>
            {i > 0 && (
              <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "50%", height: 2, background: isDone || isActive ? "#f97316" : "#e2e8f0", zIndex: 0 }} />
            )}
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: "50%", height: 2, background: isDone ? "#f97316" : "#e2e8f0", zIndex: 0 }} />
            )}
            <div
              className={isActive ? "step-pulse" : ""}
              style={{ width: 32, height: 32, borderRadius: "50%", background: isPending ? "#f1f5f9" : "#f97316", border: isPending ? "2px solid #e2e8f0" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, ...(isActive ? { boxShadow: "0 0 0 4px rgba(249,115,22,0.2)" } : {}) }}
            >
              {isActive ? <TruckIcon size={13} /> : <CheckIcon color={isPending ? "#94a3b8" : "white"} size={13} />}
            </div>
            <span style={{ fontSize: 9, fontWeight: isPending ? 600 : 700, color: isPending ? "#94a3b8" : "#f97316", textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Timeline Event ────────────────────────────────────────────────────────────

function TimelineEvent({ event, isLast }: { event: ParcelEvent; isLast: boolean }) {
  const isPending = event.status === "pending";
  const isActive = event.status === "active";

  return (
    <div style={{ display: "flex", gap: 14, position: "relative", paddingBottom: isLast ? 0 : 20, opacity: isPending ? 0.4 : 1 }}>
      {!isLast && (
        <div style={{ position: "absolute", left: 19, top: 40, width: 2, height: "calc(100% - 40px)", background: "#e2e8f0" }} />
      )}
      <div
        className={isActive ? "step-pulse" : ""}
        style={{ width: 40, height: 40, borderRadius: "50%", background: isPending ? "#f1f5f9" : isActive ? "#f97316" : "#0f172a", border: isPending ? "2px dashed #cbd5e1" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, ...(isActive ? { boxShadow: "0 0 0 4px rgba(249,115,22,0.15)" } : {}) }}
      >
        {isPending ? <CheckIcon color="#94a3b8" size={14} /> : isActive ? <TruckIcon size={15} /> : <CheckIcon color="rgba(255,255,255,0.85)" size={14} />}
      </div>

      <div style={{ flex: 1, background: isPending ? "#f8fafc" : "white", border: isPending ? "1.5px dashed #e2e8f0" : isActive ? "1.5px solid #fed7aa" : "1.5px solid #e2e8f0", borderRadius: 14, padding: "13px 15px", marginTop: 2 }}>
        {isActive && (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(249,115,22,0.08)", borderRadius: 100, padding: "3px 9px" }}>
              <span className="status-dot" style={{ width: 5, height: 5, background: "#f97316", borderRadius: "50%", display: "block" }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.06em" }}>En cours</span>
            </div>
            {event.date && (
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>{event.date}</span>
            )}
          </div>
        )}

        {!isActive && !isPending && event.date && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{event.title}</p>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>{event.date}</span>
          </div>
        )}

        {isPending ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{event.title}</p>
            <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>En attente</p>
          </>
        ) : (
          <>
            {isActive && <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{event.title}</p>}
            {!isActive && !event.date && <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{event.title}</p>}
            <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{event.description}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Route Map ─────────────────────────────────────────────────────────────────


// ── Main Component ────────────────────────────────────────────────────────────

function TrackContent() {
  const searchParams = useSearchParams();
  const [trackingInput, setTrackingInput] = useState(searchParams.get("id") || "");
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [clientSession, setClientSession] = useState<{ name: string } | null | undefined>(undefined);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) handleSearch(id);
    fetch("/api/client/packages")
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((data) => setClientSession(data ? { name: data.name } : null))
      .catch(() => setClientSession(null));
  }, []);

  async function handleSearch(overrideId?: string) {
    const num = (overrideId || trackingInput).trim().toUpperCase();
    if (!num) return;
    setLoading(true);
    setError(null);
    setPackageData(null);
    setClaimSuccess(false);

    try {
      const { data, error: err } = await supabase
        .from("packages")
        .select("id, tracking_number, status, customer_name, customer_phone, weight_kg, shipping_type, created_at, photo_url, photo_urls")
        .eq("tracking_number", num)
        .maybeSingle();

      let resolved: any = null;
      if (err || !data) {
        const { data: fallback, error: e2 } = await supabase
          .from("packages")
          .select("id, tracking_number, status, customer_name, customer_phone, weight_kg, shipping_type, created_at, photo_url")
          .eq("tracking_number", num)
          .maybeSingle();
        if (e2 || !fallback) throw new Error("Colis non trouvé. Vérifiez le numéro de suivi.");
        resolved = fallback;
      } else {
        resolved = data;
      }

      setPackageData(resolved);
      const raw: string[] =
        Array.isArray(resolved.photo_urls) && resolved.photo_urls.length > 0
          ? resolved.photo_urls
          : resolved.photo_url
          ? [resolved.photo_url]
          : [];
      setPhotoUrls(raw);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimName.trim() || !packageData?.id) return;
    setClaimLoading(true);
    setClaimError(null);
    try {
      const { error: err } = await supabase
        .from("packages")
        .update({ customer_name: claimName.trim(), customer_phone: claimPhone.trim() || null })
        .eq("id", packageData.id);
      if (err) throw err;
      await supabase
        .from("customers")
        .upsert({ name: claimName.trim(), phone: claimPhone.trim() || null }, { onConflict: "name" });
      setPackageData((p: any) => ({ ...p, customer_name: claimName.trim(), customer_phone: claimPhone.trim() || null }));
      setClaimSuccess(true);
    } catch (e: any) {
      setClaimError(e.message);
    } finally {
      setClaimLoading(false);
    }
  }

  const lightboxPrev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + photoUrls.length) % photoUrls.length : null));
  const lightboxNext = () => setLightboxIndex((i) => (i !== null ? (i + 1) % photoUrls.length : null));

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) { touchStartX.current = null; return; }
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    if (e.changedTouches.length > 1) { touchStartX.current = null; return; }
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) diff > 0 ? lightboxNext() : lightboxPrev();
    touchStartX.current = null;
  };

  // ── Search screen ─────────────────────────────────────────────────────────

  if (!packageData) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ minHeight: "100vh", background: "#05101f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", fontFamily: FONT, WebkitFontSmoothing: "antialiased", position: "relative", overflow: "hidden" }}>
          <div className="glow-anim" style={{ position: "absolute", right: -40, top: -40, width: 300, height: 300, background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 40, textDecoration: "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeftIcon />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Retour</span>
            </Link>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 100, padding: "5px 13px", marginBottom: 16 }}>
              <span className="status-dot" style={{ width: 6, height: 6, background: "#f97316", borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fb923c", letterSpacing: "0.1em", textTransform: "uppercase" }}>Suivi de colis · Hamid Cargo</span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 8 }}>
              Suivez votre<br />colis en temps réel
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, marginBottom: 28 }}>
              Entrez votre numéro de tracking pour localiser votre colis.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.11)", borderRadius: 12, padding: "0 15px", height: 52 }}>
                <SearchIcon />
                <input
                  type="text"
                  placeholder="N° de tracking…"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "white", fontSize: 16, fontWeight: 500, minWidth: 0, fontFamily: FONT }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !trackingInput.trim()}
                style={{ height: 52, borderRadius: 12, border: "none", background: loading || !trackingInput.trim() ? "rgba(249,115,22,0.5)" : "#f97316", color: "white", fontWeight: 700, fontSize: 15, cursor: loading || !trackingInput.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONT }}
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.7s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <> Suivre mon colis <ArrowRightIcon /> </>
                )}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: 16, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>
                {error}
              </div>
            )}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────

  const dbStatus = packageData.status as DbStatus;
  const steps = getSteps(dbStatus);
  const events = buildEvents(packageData);
  const amount = calcAmount(packageData.shipping_type, packageData.weight_kg);
  const formula = FORMULA_MAP[packageData.shipping_type] || "Ordinaire";
  const progress = PROGRESS_MAP[dbStatus] ?? 0;
  const eta = computeETA(packageData.shipping_type, packageData.created_at, dbStatus);
  const showAuthBanner = !!(packageData.customer_name && clientSession === null);

  return (
    <>
      <style>{STYLES}</style>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <button onClick={() => setLightboxIndex(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          {photoUrls.length > 1 && (
            <>
              <span style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, fontFamily: FONT }}>
                {lightboxIndex + 1} / {photoUrls.length}
              </span>
              <button onClick={(e) => { e.stopPropagation(); lightboxPrev(); }} style={{ position: "absolute", left: "0.75rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", fontSize: 20 }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); lightboxNext(); }} style={{ position: "absolute", right: "0.75rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", fontSize: 20 }}>›</button>
            </>
          )}
          <img src={photoUrls[lightboxIndex]} alt={`Photo ${lightboxIndex + 1}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "94vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 8, userSelect: "none" }} />
        </div>
      )}

      <div style={{ height: "100vh", overflowY: "auto", overflowX: "hidden", fontFamily: FONT, WebkitFontSmoothing: "antialiased", background: "#f8fafc" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, height: 54, background: "rgba(5,16,31,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
          <button onClick={() => { setPackageData(null); setError(null); }} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeftIcon />
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.04em" }}>{packageData.tracking_number}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>N° de suivi</span>
          </div>
          <div style={{ width: 32 }} />
        </nav>

        {/* AUTH BANNER */}
        {showAuthBanner && (
          <div style={{ background: "white", borderBottom: "1.5px solid #fed7aa", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Ce colis vous appartient ?</p>
              <p style={{ fontSize: 11, color: "#64748b" }}>Connectez-vous pour suivre tous vos colis.</p>
            </div>
            <Link
              href={`/client/login?redirect=${encodeURIComponent(`/track?id=${packageData.tracking_number}`)}`}
              style={{ flexShrink: 0, height: 36, padding: "0 14px", borderRadius: 9, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Se connecter
            </Link>
          </div>
        )}

        {/* HERO */}
        <div style={{ background: "#05101f", padding: "24px 20px 28px", position: "relative", overflow: "hidden" }}>
          <div className="glow-anim" style={{ position: "absolute", right: -40, top: -40, width: 220, height: 220, background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 100, padding: "5px 13px", marginBottom: 16 }}>
              <span className="status-dot" style={{ width: 6, height: 6, background: "#f97316", borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fb923c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {STATUS_BADGE[dbStatus]}
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 6 }}>
              {STATUS_TITLE[dbStatus]}<br /><span style={{ color: "#f97316" }}>{STATUS_EMOJI[dbStatus]}</span>
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, marginBottom: 22 }}>
              Dernière mise à jour · {formatTrackDate(packageData.created_at)}
            </p>

            {/* Route card */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Expédié de</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>GZ</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Guangzhou</span>
                </div>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ position: "relative", width: "100%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f97316, #fb923c)", borderRadius: 100 }} />
                    <div style={{ position: "absolute", left: `${progress}%`, top: "50%", transform: "translate(-50%, -50%)", width: 10, height: 10, background: "#f97316", borderRadius: "50%", border: "2px solid #05101f", boxShadow: "0 0 8px rgba(249,115,22,0.6)" }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(249,115,22,0.8)", letterSpacing: "0.04em" }}>
                    {progress}% · {PROGRESS_TEXT[dbStatus]}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Livraison à</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>LOMÉ</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)" }}>Lomé, Togo</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", background: "rgba(255,255,255,0.06)", borderRadius: 11, overflow: "hidden" }}>
                <div style={{ padding: "11px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)" }}>Livraison estimée</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{eta}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.07)" }} />
                <div style={{ padding: "11px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)" }}>Formule</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#f97316" }}>{formula}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP BAR */}
        <StepBar steps={steps} />

        {/* PHOTOS */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ width: "100%", height: 240, background: "#0f172a", borderRadius: 16, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", cursor: photoUrls.length > 0 ? "pointer" : "default" }} onClick={() => photoUrls.length > 0 && setLightboxIndex(0)}>
            {photoUrls.length > 0 ? (
              <>
                <img src={photoUrls[0]} alt="Photo du colis" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {photoUrls.length > 1 && (
                  <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "white" }}>
                    1 / {photoUrls.length}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                <div style={{ position: "absolute", left: -30, bottom: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                  <div style={{ width: 56, height: 56, background: "rgba(249,115,22,0.12)", border: "1.5px solid rgba(249,115,22,0.25)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>Photo du colis</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DETAILS */}
        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>Détails du colis</h2>
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { label: "Expéditeur", value: packageData.customer_name || "Client inconnu" },
                { label: "Reçu en Chine", value: formatDateLong(packageData.created_at) },
                { label: "Livraison prévue", value: eta, orange: true },
                ...(packageData.weight_kg ? [{ label: "Poids", value: `${packageData.weight_kg} kg` }] : []),
              ].map((row: any, i, arr) => (
                <React.Fragment key={row.label}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.orange ? "#f97316" : "#0f172a" }}>{row.value}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 1, background: "#f1f5f9" }} />}
                </React.Fragment>
              ))}
            </div>
            {amount > 0 && (
              <div style={{ borderTop: "1.5px solid #e2e8f0", padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>MONTANT À PAYER</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {formatAmount(amount)}{" "}
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>FCFA</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        <div style={{ padding: "20px 16px 0" }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 14 }}>Historique de traitement</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {events.map((event, i) => (
              <TimelineEvent key={event.id} event={event} isLast={i === events.length - 1} />
            ))}
          </div>
        </div>

        {/* CLAIM FORM */}
        {!packageData.customer_name && !claimSuccess && (
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "18px 16px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Ce colis vous appartient ?</h2>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Renseignez vos informations pour réclamer ce colis.</p>
              <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Votre nom complet *"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "12px 14px", fontSize: 16, border: "1.5px solid #e2e8f0", borderRadius: 11, outline: "none", fontFamily: FONT, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                />
                <input
                  type="tel"
                  placeholder="Votre téléphone"
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", fontSize: 16, border: "1.5px solid #e2e8f0", borderRadius: 11, outline: "none", fontFamily: FONT, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                />
                {claimError && <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>{claimError}</p>}
                <button
                  type="submit"
                  disabled={claimLoading || !claimName.trim()}
                  style={{ height: 48, borderRadius: 11, border: "none", background: claimLoading || !claimName.trim() ? "rgba(249,115,22,0.5)" : "#f97316", color: "white", fontWeight: 700, fontSize: 14, cursor: claimLoading || !claimName.trim() ? "default" : "pointer", fontFamily: FONT }}
                >
                  {claimLoading ? "Envoi en cours…" : "Réclamer ce colis"}
                </button>
              </form>
            </div>
          </div>
        )}

        {claimSuccess && (
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 16, padding: "16px", textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>✅ Colis réclamé avec succès !</p>
              <p style={{ fontSize: 12, color: "#15803d", opacity: 0.8, marginTop: 4 }}>Vos informations ont été enregistrées.</p>
            </div>
          </div>
        )}

        {/* WHATSAPP CONTACT */}
        <div style={{ padding: "20px 16px 40px" }}>
          <div style={{ background: "#05101f", borderRadius: 16, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: "white", marginBottom: 3 }}>Une question sur votre colis ?</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>Notre équipe de Lomé répond rapidement sur WhatsApp.</p>
            </div>
            <a href="https://wa.me/22890196529" target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WhatsAppIcon />
            </a>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Page Export ───────────────────────────────────────────────────────────────

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#05101f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
