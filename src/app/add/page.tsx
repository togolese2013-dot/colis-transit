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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_phone: "",
    status: "RECU_CHINE",
  });

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
      // 1. Charger l'image originale
      const originalImg = new Image();
      originalImg.src = URL.createObjectURL(file);
      await new Promise((resolve) => (originalImg.onload = resolve));

      // 2. REDIMENSIONNEMENT OPTIMISÉ (Le secret pour ZXing/Quagga)
      // Les photos de 12MP+ sont trop lourdes et floues pour les lecteurs JS.
      // On réduit à une taille "Full HD" gérable.
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas non prêt");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Context non prêt");

      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / originalImg.width);
      canvas.width = originalImg.width * scale;
      canvas.height = originalImg.height * scale;
      
      // On dessine l'image optimisée
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // --- TENTATIVE A : NATIVE ---
      if (typeof window !== "undefined" && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'qr_code', 'ean_13', 'code_39']
          });
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes && barcodes.length > 0) {
            finishScan(barcodes[0].rawValue);
            return;
          }
        } catch (e) {}
      }

      // --- TENTATIVE B : QUAGGA2 (Avec l'image optimisée) ---
      const quaggaResult = await new Promise((resolve) => {
        Quagga.decodeSingle({
          src: optimizedDataUrl,
          numOfWorkers: 0,
          inputStream: { size: 1600 },
          decoder: { 
            readers: ["code_128_reader", "ean_reader", "code_39_reader"],
            multiple: false
          },
          locate: true,
          halfSample: false // On garde la précision
        }, (result) => resolve(result));
      });

      if ((quaggaResult as any)?.codeResult) {
        finishScan((quaggaResult as any).codeResult.code);
        return;
      }

      // --- TENTATIVE C : ZXING (Fallback final) ---
      const reader = new BrowserMultiFormatReader();
      const zxingResult = await reader.decodeFromImageUrl(optimizedDataUrl);
      if (zxingResult) {
        finishScan(zxingResult.getText());
        return;
      }

      throw new Error("Code non détecté. Conseil : Prenez la photo de plus près et bien au centre.");

    } catch (err) {
      console.error("Scan error:", err);
      setError("Le scan a échoué. Veuillez taper le numéro de suivi manuellement.");
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
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>VERSION 2.1 - OPTIMISATION HD ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Canvas caché pour le pré-traitement */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error && <div style={{ background: '#fff0f0', color: '#d00', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}
        
        <div style={{ background: 'white', padding: '1rem', borderRadius: '20px', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, height: '120px', background: '#f8f9fa', borderRadius: '12px', overflow: 'hidden' }}>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-p" />
              <label htmlFor="photo-p" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Icons.Camera /><span style={{ fontSize: '0.7rem', marginTop: '0.4rem' }}>Photo Colis</span></>}
              </label>
            </div>

            <button type="button" onClick={() => photoScanRef.current?.click()} disabled={loading} style={{ flex: 1.5, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(255,102,0,0.3)' }}>
              {loading ? <span className="loader"></span> : <><Icons.Scan /><span style={{ marginTop: '0.5rem' }}>SCANNER LE TRACKING</span></>}
            </button>
            <input type="file" ref={photoScanRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoScan} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de suivi (Tracking)</label>
          <input type="text" name="tracking_number" className="form-input" placeholder="Tapez ou scannez..." value={formData.tracking_number} onChange={handleChange} required style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)', textAlign: 'center', border: '2px solid var(--primary-light)' }} />
        </div>

        <div className="form-group">
          <label className="form-label">Nom du Client</label>
          <input type="text" name="customer_name" className="form-input" placeholder="Optionnel" value={formData.customer_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input type="tel" name="customer_phone" className="form-input" placeholder="Optionnel" value={formData.customer_phone} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '60px', borderRadius: '16px', marginTop: '1rem' }}>
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
