"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { BrowserQRCodeReader, DecodeHintType } from "@zxing/library";

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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <rect x="7" y="7" width="3" height="3"></rect>
      <rect x="14" y="7" width="3" height="3"></rect>
      <rect x="7" y="14" width="3" height="3"></rect>
      <rect x="14" y="14" width="1" height="1"></rect>
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

const AddPackage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_phone: "",
    status: "RECU_CHINE",
  });

  // HTTPS Force Redirect
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:" && window.location.hostname !== "localhost") {
      window.location.href = window.location.href.replace("http:", "https:");
    }
  }, []);

  useEffect(() => {
    let codeReader: BrowserQRCodeReader | null = null;

    if (isScanning && typeof window !== "undefined") {
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);

      codeReader = new BrowserQRCodeReader(hints);
      
      const startScanning = async () => {
        try {
          const videoInputDevices = await codeReader?.listVideoInputDevices();
          const backCamera = videoInputDevices?.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('arrière') ||
            device.label.toLowerCase().includes('environment')
          );
          
          const deviceId = backCamera ? backCamera.deviceId : videoInputDevices?.[0]?.deviceId;

          codeReader?.decodeFromVideoDevice(deviceId, videoRef.current!, (result) => {
            if (result) {
              // Bip sonore
              try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.type = "sine";
                oscillator.frequency.value = 880;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 100);
              } catch (e) {}

              // Vibration
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(200);
              }

              setFormData(prev => ({ ...prev, tracking_number: result.getText() }));
              setIsScanning(false);
            }
          });
        } catch (err) {
          console.error("ZXing Error:", err);
          setError("Erreur caméra : " + (err as Error).message);
          setIsScanning(false);
        }
      };

      startScanning();
    }

    return () => {
      if (codeReader) {
        codeReader.reset();
      }
    };
  }, [isScanning]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleExcelImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

        const getValue = (row: any, variants: string[]) => {
          const keys = Object.keys(row);
          for (const variant of variants) {
            if (row[variant] !== undefined) return row[variant];
            const normalizedVariant = variant.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
            const foundKey = keys.find(k => {
              const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
              return normalizedKey === normalizedVariant || normalizedKey.includes(normalizedVariant);
            });
            if (foundKey) return row[foundKey];
          }
          return "";
        };

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
          alert(`Erreur : Aucun numéro de suivi trouvé.`);
          setLoading(false);
          return;
        }

        const { error } = await supabase.from("packages").insert(packagesToInsert);
        if (error) throw error;

        alert(`${packagesToInsert.length} colis importés avec succès !`);
        router.push("/chine");
      } catch (error: any) {
        alert("Erreur lors de l'importation : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [router]);

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
      router.push("/chine");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <Icons.Back />
          </button>
          <h1>Nouveau Colis</h1>
        </div>
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="btn-icon"
          title="Importer Excel"
        >
          <Icons.FileText />
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleExcelImport} />
      </header>

      {isScanning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <video 
              ref={videoRef} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              muted
            />
            {/* Guide de scan visuel CARRE pour QR */}
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              width: '260px', 
              height: '260px', 
              border: '2px solid rgba(255,102,0,0.8)',
              borderRadius: '12px',
              boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)'
            }}>
              <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                PLACER LE QR CODE ICI
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsScanning(false)}
            style={{ padding: '1.5rem', background: '#ff6600', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}
          >
            ANNULER LE SCAN
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
              border: '2px solid var(--primary)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)',
              height: '140px',
              boxShadow: '0 4px 12px rgba(255,102,0,0.1)'
            }}
          >
            <Icons.Scan />
            <span style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: '700' }}>SCAN QR CODE</span>
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de suivi</label>
          <input 
            type="text" 
            name="tracking_number" 
            className="form-input" 
            placeholder="Attente du QR..." 
            value={formData.tracking_number} 
            onChange={handleChange} 
            required 
            style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Client</label>
          <input type="text" name="customer_name" className="form-input" placeholder="Nom du client" value={formData.customer_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input type="tel" name="customer_phone" className="form-input" placeholder="Ex: +228 90 00 00 00" value={formData.customer_phone} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '56px', fontSize: '1.1rem' }}>
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
};

export default memo(AddPackage);
