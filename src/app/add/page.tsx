"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { BrowserMultiFormatReader } from "@zxing/library";
import Quagga from "@ericblade/quagga2";

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

  const finishScan = (text: string) => {
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
    
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    setFormData(prev => ({ ...prev, tracking_number: text }));
    setLoading(false);
  };

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      const imageUrl = URL.createObjectURL(file);

      // 1. NATIVE DETECTOR
      if (typeof window !== "undefined" && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'qr_code', 'ean_13', 'code_39']
          });
          const img = new Image();
          img.src = imageUrl;
          await new Promise((resolve) => (img.onload = resolve));
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes && barcodes.length > 0) {
            finishScan(barcodes[0].rawValue);
            return;
          }
        } catch (e) {}
      }

      // 2. QUAGGA2
      const quaggaResult = await new Promise((resolve) => {
        Quagga.decodeSingle({
          src: imageUrl,
          numOfWorkers: 0,
          inputStream: { size: 1920 },
          decoder: { readers: ["code_128_reader", "ean_reader", "code_39_reader"] },
          locate: true
        }, (result) => resolve(result));
      });

      if ((quaggaResult as any)?.codeResult) {
        finishScan((quaggaResult as any).codeResult.code);
        return;
      }

      // 3. ZXING
      const reader = new BrowserMultiFormatReader();
      const zxingResult = await reader.decodeFromImageUrl(imageUrl);
      if (zxingResult) {
        finishScan(zxingResult.getText());
        return;
      }

      throw new Error("Impossible de lire ce code. Tapez-le manuellement ou réessayez avec une photo plus nette.");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de scan");
    } finally {
      setLoading(false);
      if (photoScanRef.current) photoScanRef.current.value = "";
    }
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
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (!data || data.length === 0) throw new Error("Fichier vide");
        
        const packagesToInsert = data.map((row: any) => ({
          tracking_number: String(row.tracking_number || row["N° Suivi"] || "").trim(),
          customer_name: String(row.customer_name || row.Nom || "").trim(),
          customer_phone: String(row.customer_phone || row.Telephone || "").trim(),
          status: "RECU_CHINE",
          created_at: new Date().toISOString(),
        })).filter(p => p.tracking_number);

        const { error } = await supabase.from("packages").insert(packagesToInsert);
        if (error) throw error;
        alert(`${packagesToInsert.length} colis importés !`);
        router.push("/chine");
      } catch (error: any) { alert(error.message); } finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let photo_url = null;
    try {
      if (photo) {
        const fileName = `${Date.now()}.${photo.name.split('.').pop()}`;
        await supabase.storage.from('packages').upload(fileName, photo);
        photo_url = supabase.storage.from('packages').getPublicUrl(fileName).data.publicUrl;
      }
      const { error } = await supabase.from('packages').insert([{ ...formData, photo_url }]);
      if (error) throw error;
      router.push("/chine");
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header className="header" style={{ justifyContent: 'space-between', borderBottom: '2px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button"><Icons.Back /></button>
          <div>
            <h1 style={{ fontSize: '1.2rem' }}>Nouveau Colis</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>VERSION 2.0 - SCAN PHOTO ACTIVE</span>
          </div>
        </div>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-icon"><Icons.FileText /></button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleExcelImport} />
      </header>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error && <div style={{ background: '#fff0f0', color: '#d00', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}
        
        <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px dashed var(--primary)' }}>
          <p style={{ fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem', fontWeight: '600' }}>Étape 1 : Identifiez le colis</p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, height: '120px', background: 'white', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-p" />
              <label htmlFor="photo-p" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Icons.Camera /><span style={{ fontSize: '0.7rem', marginTop: '0.4rem' }}>Photo Colis</span></>}
              </label>
            </div>

            <button type="button" onClick={() => photoScanRef.current?.click()} disabled={loading} style={{ flex: 1.5, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(255,102,0,0.3)' }}>
              {loading ? <span className="loader"></span> : <><Icons.Scan /><span style={{ marginTop: '0.5rem' }}>PRENDRE PHOTO & SCANNER</span></>}
            </button>
            <input type="file" ref={photoScanRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoScan} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de suivi (Tracking)</label>
          <input type="text" name="tracking_number" className="form-input" placeholder="Scannez ou tapez ici..." value={formData.tracking_number} onChange={handleChange} required style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)', textAlign: 'center', padding: '1.2rem' }} />
        </div>

        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', marginBottom: '1rem', color: '#666', fontWeight: '600' }}>Étape 2 : Infos destinataire (Optionnel)</p>
          <div className="form-group">
            <input type="text" name="customer_name" className="form-input" placeholder="Nom du client" value={formData.customer_name} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="tel" name="customer_phone" className="form-input" placeholder="Téléphone" value={formData.customer_phone} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '60px', borderRadius: '16px', fontSize: '1.1rem' }}>
          {loading ? "Enregistrement..." : "ENREGISTRER LE COLIS"}
        </button>
      </form>

      <nav className="bottom-nav">
        <Link href="/chine" className="nav-item"><Icons.Home /></Link>
        <Link href="/add" className="nav-item active" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item"><Icons.BarChart /></Link>
        <Link href="/profile" className="nav-item"><Icons.User /></Link>
      </nav>

      <style jsx>{`
        .loader { width: 24px; height: 24px; border: 3px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default memo(AddPackage);
