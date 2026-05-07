"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

const Icons = {
  Back: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  Camera: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  ),
  Scan: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
      <line x1="7" y1="12" x2="17" y2="12"></line>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    </svg>
  ),
  Box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  FileText: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )
};

export default function AddPackage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_phone: "",
    status: "RECU_CHINE",
  });

  useEffect(() => {
    let html5QrCode: any = null;

    const startScanner = async () => {
      if (isScanning && typeof window !== "undefined") {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode("reader");
        
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ];

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 20, 
              qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                return { width: viewfinderWidth * 0.8, height: viewfinderHeight * 0.3 };
              },
              aspectRatio: 1.777778,
              formatsToSupport: formatsToSupport
            },
            (decodedText: string) => {
              console.log("Scan réussi:", decodedText);
              // Vibration pour retour physique
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(200);
              }
              
              setFormData(prev => ({ ...prev, tracking_number: decodedText }));
              setIsScanning(false);
            },
            () => {} 
          );
        } catch (err) {
          console.error("Erreur de démarrage du scanner:", err);
          setError("Impossible d'accéder à la caméra.");
          setIsScanning(false);
        }
      }
    };

    const stopScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          await html5QrCode.stop();
          await html5QrCode.clear();
        } catch (err) {
          console.error("Erreur d'arrêt du scanner:", err);
        }
      }
    };

    if (isScanning) {
      startScanner();
    }

    return () => {
      if (html5QrCode) {
        stopScanner();
      }
    };
  }, [isScanning]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    alert(`Lecture du fichier : ${file.name}...`);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert("Le fichier semble vide ou illisible.");
          setLoading(false);
          return;
        }

        // Debug: Show columns of the first row
        const firstRow = data[0] as any;
        const columns = Object.keys(firstRow).join(", ");
        console.log("Colonnes détectées:", columns);

        // Helper to find value by flexible key matching
        const getValue = (row: any, variants: string[]) => {
          const keys = Object.keys(row);
          for (const variant of variants) {
            // exact match
            if (row[variant] !== undefined) return row[variant];
            
            // fuzzy match (case insensitive, no accents, no spaces)
            const normalizedVariant = variant.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
            const foundKey = keys.find(k => {
              const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
              return normalizedKey === normalizedVariant || normalizedKey.includes(normalizedVariant);
            });
            if (foundKey) return row[foundKey];
          }
          return "";
        };

        // Format data for Supabase with very flexible matching
        const packagesToInsert = data.map((row: any) => {
          const tracking = getValue(row, ["tracking_number", "N° Suivi", "N Suivi", "Tracking", "Code", "Suivi", "ID"]);
          const name = getValue(row, ["customer_name", "Nom", "Client", "Destinataire", "Name", "Customer"]);
          const phone = getValue(row, ["customer_phone", "Telephone", "Telefone", "Tel", "Phone", "Mobile"]);

          return {
            tracking_number: String(tracking).trim(),
            customer_name: String(name).trim(),
            customer_phone: String(phone).trim(),
            status: "RECU_CHINE",
            created_at: new Date().toISOString(),
          };
        }).filter(p => p.tracking_number && p.tracking_number !== "undefined" && p.tracking_number !== "");

        if (packagesToInsert.length === 0) {
          alert(`Erreur : Aucun numéro de suivi trouvé.\nColonnes détectées dans votre fichier : ${columns}\n\nAssurez-vous d'avoir une colonne nommée 'Tracking' ou 'N° Suivi'.`);
          setLoading(false);
          return;
        }

        const { error } = await supabase.from("packages").insert(packagesToInsert);

        if (error) throw error;

        alert(`${packagesToInsert.length} colis importés avec succès !`);
        router.push("/");
      } catch (error: any) {
        console.error("Erreur import Excel:", error);
        alert("Erreur lors de l'importation : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let photo_url = null;

    try {
      if (photo) {
        const fileName = `${Date.now()}.${photo.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('packages').upload(fileName, photo);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from('packages').getPublicUrl(fileName);
        photo_url = data.publicUrl;
      }

      const { error: insertError } = await supabase.from('packages').insert([{ ...formData, photo_url }]);
      if (insertError) throw new Error(insertError.message);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={() => router.push("/")} type="button">
            <Icons.Back />
          </button>
          <h1>Nouveau Colis</h1>
        </div>
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            background: 'var(--surface)', 
            border: 'none', 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--primary)',
            cursor: 'pointer'
          }}
          title="Importer Excel"
        >
          <Icons.FileText />
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleExcelImport} />
      </header>

      {isScanning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div id="reader" style={{ width: '100%', height: '100%', flex: 1 }}></div>
          <button 
            onClick={() => setIsScanning(false)}
            style={{ padding: '1.5rem', background: '#ff6600', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}
          >
            Fermer le scanner
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="package-card" style={{ flex: 1, padding: '0', overflow: 'hidden', margin: 0, height: '140px' }}>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload" />
            <label htmlFor="photo-upload" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--primary-light)' }}>
              {preview ? (
                <img src={preview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Icons.Camera />
                  <span style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary)' }}>Photo Colis</span>
                </>
              )}
            </label>
          </div>

          <button 
            type="button"
            onClick={() => setIsScanning(true)}
            style={{ 
              flex: 1,
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)',
              height: '140px'
            }}
          >
            <Icons.Scan />
            <span style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>Scanner Code</span>
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de suivi</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              name="tracking_number" 
              className="form-input" 
              placeholder="Ex: YT123456" 
              value={formData.tracking_number} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Client</label>
          <input type="text" name="customer_name" className="form-input" placeholder="Nom du client" value={formData.customer_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input type="tel" name="customer_phone" className="form-input" placeholder="Ex: +228 90 00 00 00" value={formData.customer_phone} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Chargement..." : "Enregistrer le colis"}
        </button>
      </form>

      <nav className="bottom-nav">
        <Link href="/chine" className="nav-item"><Icons.Home /></Link>
        <Link href="/add" className="nav-item active" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', boxShadow: 'var(--shadow-lg)' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item"><Icons.BarChart /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>
    </div>
  );
}
