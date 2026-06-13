"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  type: "package" | "client";
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  href: string;
}

const STATUS_LABEL: Record<string, string> = {
  RECU_CHINE:  "Reçu Chine 🇨🇳",
  EN_TRANSIT:  "En transit 🚢",
  ARRIVE_LOME: "Arrivé Lomé 🇹🇬",
  LIVRE:       "Livré ✅",
};

const STATUS_COLOR: Record<string, string> = {
  RECU_CHINE:  "#f59e0b",
  EN_TRANSIT:  "#3b82f6",
  ARRIVE_LOME: "#10b981",
  LIVRE:       "#8b5cf6",
};

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, results.length - 1));
      if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0));
      if (e.key === "Enter" && results[selected]) {
        router.push(results[selected].href);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, selected, onClose, router]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const term = q.trim();

    const [pkgRes, clientRes] = await Promise.all([
      supabase
        .from("packages")
        .select("id, tracking_number, status, customer_name, customer_phone, shipping_type")
        .or(`tracking_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`)
        .limit(5),
      supabase
        .from("customers")
        .select("id, name, phone")
        .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(4),
    ]);

    const pkgResults: SearchResult[] = (pkgRes.data || []).map(p => ({
      type: "package",
      id: p.id,
      title: p.tracking_number,
      subtitle: p.customer_name ? `${p.customer_name} · ${STATUS_LABEL[p.status] ?? p.status}` : STATUS_LABEL[p.status] ?? p.status,
      status: p.status,
      href: `/edit/${p.id}`,
    }));

    const clientResults: SearchResult[] = (clientRes.data || []).map(c => ({
      type: "client",
      id: c.id,
      title: c.name,
      subtitle: c.phone || "Aucun téléphone",
      href: `/clients`,
    }));

    setResults([...pkgResults, ...clientResults]);
    setSelected(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px 0" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", animation: "searchSlide 0.15s ease-out" }}
      >
        <style>{`@keyframes searchSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un colis, client ou téléphone…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 500, color: "#0f172a", background: "transparent", fontFamily: "var(--font)" }}
          />
          {loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
          <kbd style={{ padding: "2px 6px", fontSize: 11, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 5, color: "#94a3b8", fontFamily: "system-ui", cursor: "pointer" }} onClick={onClose}>esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {results.map((r, i) => (
              <div
                key={r.id + r.type}
                onClick={() => { router.push(r.href); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", cursor: "pointer", background: i === selected ? "#f8fafc" : "white", borderBottom: "1px solid #f8fafc", transition: "background 0.1s" }}
                onMouseEnter={() => setSelected(i)}
              >
                {r.type === "package" ? (
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: r.status ? `${STATUS_COLOR[r.status]}18` : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.status ? STATUS_COLOR[r.status] : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="7" height="9" rx="1"/><rect x="15" y="3" width="7" height="5" rx="1"/><rect x="15" y="12" width="7" height="9" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/>
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2, fontFamily: r.type === "package" ? "monospace" : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subtitle}</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            ))}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div style={{ padding: "28px 18px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            Aucun résultat pour «{query}»
          </div>
        ) : query.length < 2 ? (
          <div style={{ padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", marginBottom: 10 }}>Recherche rapide</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["JT", "HC-", "+228"].map(hint => (
                <button key={hint} onClick={() => setQuery(hint)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#475569", cursor: "pointer", fontFamily: "monospace" }}>{hint}…</button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div style={{ padding: "8px 18px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", gap: 14 }}>
          {[["↑↓", "Naviguer"], ["↵", "Ouvrir"], ["esc", "Fermer"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd style={{ padding: "1px 5px", fontSize: 10, background: "white", border: "1px solid #e2e8f0", borderRadius: 4, color: "#64748b", fontFamily: "system-ui" }}>{key}</kbd>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
