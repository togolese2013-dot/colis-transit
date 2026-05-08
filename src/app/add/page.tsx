"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

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
      <path d="M7 7h10v10H7z"></path>
      <path d="M12 7v10"></path>
      <path d="M7 12h10"></path>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoScanRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_phone: "",
    status: "RECU_CHINE",
  });

  const playBeep = () => {
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
  };

  const vibrate = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  // HTTPS Force Redirect
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:" && window.location.hostname !== "localhost") {
      window.location.href = window.location.href.replace("http:", "https:");
    }
  }, []);

  // SCAN PHOTO LOGIC (MULTI-STAGE DEEP ANALYSIS)
  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_39]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);
    
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const tryDecode = async (source: string) => {
        try {
          const result = await reader.decodeFromImageUrl(source);
          if (result && result.getText().length > 5) return result.getText();
        } catch (e) { return null; }
      };

      // TENTATIVE 1 : Image Originale
      let text = await tryDecode(img.src);
      if (text) {
        finishScan(text);
        return;
      }

      // TENTATIVE 2 : Image Contrastée (Noir et Blanc)
      console.log("Tentative 2 : Contraste Boosté...");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = "contrast(250%) grayscale(100%)";
      ctx.drawImage(img, 0, 0);
      text = await tryDecode(canvas.toDataURL("image/jpeg", 0.9));
      if (text) {
        finishScan(text);
        return;
      }

      // TENTATIVE 3 : Zoom Central (Shipping labels focus)
      console.log("Tentative 3 : Zoom Central...");
      const zoomSize = Math.min(img.width, img.height) * 0.7;
      const sx = (img.width - zoomSize) / 2;
      const sy = (img.height - zoomSize) / 2;
      canvas.width = 1000; // Resize pour plus de clarté
      canvas.height = 1000;
      ctx.filter = "contrast(200%) brightness(110%) grayscale(100%)";
      ctx.drawImage(img, sx, sy, zoomSize, zoomSize, 0, 0, 1000, 1000);
      text = await tryDecode(canvas.toDataURL("image/jpeg", 0.9));
      if (text) {
        finishScan(text);
        return;
      }

      throw new Error("Impossible de lire ce code. Essayez de prendre la photo de plus près ou avec plus de lumière.");

    } catch (err) {
      console.error("Scan error:", err);
      setError("Le code n'est pas détecté. Conseil : Prenez la photo bien en face du code-barres JT315... et évitez les reflets.");
    } finally {
      setLoading(false);
      if (photoScanRef.current) photoScanRef.current.value = "";
    }
  };

  const finishScan = (text: string) => {
    playBeep();
    vibrate();
    setFormData(prev => ({ ...prev, tracking_number: text }));
    setLoading(false);
  };

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

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ 
            background: '#fff0f0', 
            color: '#d00', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            border: '1px solid #ffcccc',
            lineHeight: '1.4'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Photo du Colis */}
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

          {/* SCAN PAR PHOTO (DEEP ANALYSIS) */}
          <button 
            type="button"
            onClick={() => photoScanRef.current?.click()}
            disabled={loading}
            style={{ 
              flex: 1,
              background: 'var(--primary)', 
              border: 'none', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              height: '140px',
              boxShadow: '0 4px 15px rgba(255,102,0,0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="loader" style={{ width: '24px', height: '24px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                <span style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>Analyse profonde...</span>
              </div>
            ) : (
              <>
                <Icons.Scan />
                <span style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: '700' }}>{formData.tracking_number ? "DÉTECTÉ !" : "SCANNER TRACKING"}</span>
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={photoScanRef} 
            accept="image/*" 
            capture="environment" 
            style={{ display: 'none' }} 
            onChange={handlePhotoScan} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de suivi (Tracking)</label>
          <input 
            type="text" 
            name="tracking_number" 
            className="form-input" 
            placeholder="Numéro détecté..." 
            value={formData.tracking_number} 
            onChange={handleChange} 
            required 
            style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)', textAlign: 'center', border: '2px solid var(--primary-light)' }}
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

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '56px', fontSize: '1.1rem', marginTop: '1rem' }}>
          {loading ? "Enregistrement..." : "Valider et Enregistrer"}
        </button>
      </form>

      <nav className="bottom-nav">
        <Link href="/chine" className="nav-item"><Icons.Home /></Link>
        <Link href="/add" className="nav-item active" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', boxShadow: 'var(--shadow-lg)' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item"><Icons.BarChart /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default memo(AddPackage);
