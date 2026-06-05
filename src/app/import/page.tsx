"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Home, Plus, BarChart2, User, Users } from "lucide-react";
import * as XLSX from "xlsx";

type RowStatus = "ok" | "error" | "duplicate";

interface ParsedRow {
  tracking_number: string;
  customer_name: string;
  customer_phone: string;
  weight_kg: number | null;
  shipping_type: string;
  status: RowStatus;
  errorMsg?: string;
}

const normalize = (key: string) => key.toLowerCase().trim().replace(/\s+/g, "_");

const resolveCol = (row: any, candidates: string[]): string => {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find(k => normalize(k) === c || normalize(k).includes(c));
    if (found) return String(row[found] ?? "").trim();
  }
  return "";
};

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const parseFile = (file: File) => {
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const seen = new Set<string>();
      const parsed: ParsedRow[] = json.map((row) => {
        const tracking = resolveCol(row, ["tracking_number", "tracking", "numéro", "numero", "code"]).toUpperCase();
        const customerName = resolveCol(row, ["customer_name", "client", "nom", "name"]);
        const customerPhone = resolveCol(row, ["customer_phone", "téléphone", "telephone", "phone", "tel"]);
        const weightRaw = resolveCol(row, ["weight_kg", "poids", "weight"]);
        const shippingRaw = resolveCol(row, ["shipping_type", "type", "envoi"]).toUpperCase();
        const weight = weightRaw ? parseFloat(weightRaw.replace(",", ".")) : null;
        const shippingType = ["EXPRESS"].includes(shippingRaw) ? "EXPRESS" : ["COLIS_BATTERIE", "BATTERIE"].includes(shippingRaw) ? "COLIS_BATTERIE" : "ORDINAIRE";

        if (!tracking) {
          return { tracking_number: "", customer_name: customerName, customer_phone: customerPhone, weight_kg: weight, shipping_type: shippingType, status: "error" as RowStatus, errorMsg: "Tracking manquant" };
        }
        if (seen.has(tracking)) {
          return { tracking_number: tracking, customer_name: customerName, customer_phone: customerPhone, weight_kg: weight, shipping_type: shippingType, status: "duplicate" as RowStatus, errorMsg: "Doublon dans le fichier" };
        }
        seen.add(tracking);
        return { tracking_number: tracking, customer_name: customerName, customer_phone: customerPhone, weight_kg: weight, shipping_type: shippingType, status: "ok" as RowStatus };
      });

      setRows(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.status === "ok");
    if (validRows.length === 0) return;

    setImporting(true);
    let created = 0;
    let skipped = 0;

    for (const row of validRows) {
      const { error } = await supabase.from("packages").insert([{
        tracking_number: row.tracking_number,
        customer_name: row.customer_name || null,
        customer_phone: row.customer_phone || null,
        weight_kg: row.weight_kg,
        shipping_type: row.shipping_type,
        status: "RECU_CHINE",
        photo_url: null,
      }]);

      if (error) {
        skipped++;
        setRows(prev => prev.map(r =>
          r.tracking_number === row.tracking_number
            ? { ...r, status: "duplicate", errorMsg: error.code === "23505" ? "Déjà existant en base" : error.message }
            : r
        ));
      } else {
        created++;
        if (row.customer_name?.trim()) {
          await supabase.from("customers").upsert(
            { name: row.customer_name.trim(), phone: row.customer_phone?.trim() || null },
            { onConflict: "name" }
          );
        }
      }
    }

    setResult({ created, skipped: skipped + rows.filter(r => r.status !== "ok").length });
    setImporting(false);
  };

  const validCount = rows.filter(r => r.status === "ok").length;
  const errorCount = rows.filter(r => r.status !== "ok").length;

  return (
    <div className="container" style={{ paddingBottom: "120px" }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Import Excel</span>
        </div>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--r-2xl)",
            padding: "3rem 1.5rem",
            textAlign: "center",
            background: isDragging ? "var(--accent-subtle)" : "var(--bg-subtle)",
            cursor: "pointer",
            transition: "all 0.15s",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{
            width: "52px", height: "52px", borderRadius: "var(--r-xl)",
            background: "var(--bg)", border: "1.5px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", color: "var(--accent)",
          }}>
            <FileSpreadsheet size={24} strokeWidth={1.75} />
          </div>
          <p style={{ fontSize: "0.9375rem", fontWeight: "700", color: "var(--text-1)", marginBottom: "0.375rem" }}>
            Glisser un fichier ici
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>
            ou cliquer pour sélectionner · .xlsx / .xls / .csv
          </p>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFile} />

      {/* Format hint */}
      {rows.length === 0 && (
        <div className="card" style={{ padding: "1rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: "0.625rem" }}>
            Colonnes reconnues
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {["tracking_number *", "customer_name", "customer_phone", "weight_kg", "shipping_type"].map(col => (
              <span key={col} style={{
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
                borderRadius: "var(--r-full)", padding: "0.2rem 0.625rem",
                fontSize: "0.75rem", fontWeight: "600", color: "var(--text-2)",
                fontFamily: "var(--font-mono)",
              }}>
                {col}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.5rem" }}>
            * obligatoire · Les noms de colonnes sont flexibles (Tracking, Nom, Téléphone…)
          </p>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && !result && (
        <>
          {/* Summary bar */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              background: "var(--success-subtle)", border: "1px solid var(--success-border)",
              borderRadius: "var(--r-full)", padding: "0.3rem 0.75rem",
              fontSize: "0.8125rem", fontWeight: "700", color: "var(--success)",
            }}>
              <CheckCircle size={13} />
              {validCount} valides
            </div>
            {errorCount > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                background: "var(--error-subtle)", border: "1px solid var(--error-border)",
                borderRadius: "var(--r-full)", padding: "0.3rem 0.75rem",
                fontSize: "0.8125rem", fontWeight: "700", color: "var(--error)",
              }}>
                <XCircle size={13} />
                {errorCount} ignorés
              </div>
            )}
            <button
              type="button"
              onClick={() => { setRows([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
              style={{ marginLeft: "auto", background: "none", border: "none", fontSize: "0.8125rem", color: "var(--text-3)", cursor: "pointer", padding: "0.25rem" }}
            >
              Changer de fichier
            </button>
          </div>

          {/* File name */}
          <div style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <FileSpreadsheet size={13} />
            {fileName}
          </div>

          {/* Rows list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {rows.map((row, i) => (
              <div key={i} className="pkg-item" style={{
                borderLeft: `3px solid ${row.status === "ok" ? "var(--success)" : "var(--error)"}`,
                opacity: row.status !== "ok" ? 0.65 : 1,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pkg-number" style={{ fontSize: "0.875rem" }}>
                    {row.tracking_number || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>—</span>}
                  </div>
                  <div className="pkg-meta">
                    {row.customer_name || "Sans nom"}
                    {row.customer_phone && ` · ${row.customer_phone}`}
                    {row.weight_kg && ` · ${row.weight_kg} kg`}
                  </div>
                </div>
                {row.status !== "ok" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, fontSize: "0.75rem", color: "var(--error)", fontWeight: "600" }}>
                    <AlertCircle size={13} />
                    {row.errorMsg}
                  </div>
                ) : (
                  <span className="badge badge-received" style={{ flexShrink: 0 }}>Reçu Chine</span>
                )}
              </div>
            ))}
          </div>

          {/* Import button */}
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleImport}
            disabled={importing || validCount === 0}
          >
            {importing
              ? <><span className="spinner" />Importation en cours...</>
              : <><Upload size={16} />Importer {validCount} colis</>
            }
          </button>
        </>
      )}

      {/* Result */}
      {result && (
        <div style={{ textAlign: "center", paddingTop: "2rem" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "var(--success-subtle)", border: "2px solid var(--success-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem", color: "var(--success)",
          }}>
            <CheckCircle size={28} strokeWidth={1.75} />
          </div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "800", color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
            Import terminé
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-2)", marginBottom: "0.25rem" }}>
            <strong style={{ color: "var(--success)" }}>{result.created} colis</strong> créés avec succès
          </p>
          {result.skipped > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-3)", marginBottom: "1.75rem" }}>
              {result.skipped} ligne{result.skipped > 1 ? "s" : ""} ignorée{result.skipped > 1 ? "s" : ""}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => { setRows([]); setResult(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
            >
              Nouvel import
            </button>
            <button className="btn btn-primary btn-full" onClick={() => router.push("/chine")}>
              Voir les colis
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
}
