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
  FileText: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  )
};

const AddPackage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const excelInputRef = useRef<HTMLInputElement>(null);
  const photoScanRef = useRef<HTMLInputElement>(null);
  const multiPhotoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_phone: "",
    weight_kg: "",
    shipping_type: "ORDINAIRE",
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
    
    setFormData(prev => ({ ...prev, tracking_number: text.toUpperCase() }));
    setLoading(false);
  };

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      const originalImg = new Image();
      originalImg.src = URL.createObjectURL(file);
      await new Promise((resolve) => (originalImg.onload = resolve));

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas Error");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Context Error");

      const tryScan = async (dataUrl: string) => {
        try {
          const reader = new BrowserMultiFormatReader();
          const result = await reader.decodeFromImageUrl(dataUrl);
          return result ? result.getText() : null;
        } catch (e) {
          try {
            const quaggaResult = await new Promise((resolve) => {
              Quagga.decodeSingle({
                src: dataUrl,
                numOfWorkers: 0,
                inputStream: { size: 1200 },
                decoder: { readers: ["code_128_reader", "ean_reader"] },
                locate: true
              }, (res) => resolve(res));
            });
            return (quaggaResult as any)?.codeResult?.code || null;
          } catch (e2) { return null; }
        }
      };

      canvas.width = 1200;
      canvas.height = 800;
      ctx.filter = "contrast(220%) grayscale(100%)";
      const zoomSize = Math.min(originalImg.width, originalImg.height) * 0.6;
      ctx.drawImage(originalImg, (originalImg.width - zoomSize)/2, (originalImg.height - zoomSize)/2, zoomSize, zoomSize, 0, 0, 1200, 800);
      let text = await tryScan(canvas.toDataURL("image/jpeg", 0.95));
      if (text) { finishScan(text); return; }

      canvas.width = 1600;
      canvas.height = 1600 * (originalImg.height / originalImg.width);
      ctx.filter = "contrast(160%) brightness(105%)";
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      text = await tryScan(canvas.toDataURL("image/jpeg", 0.85));
      if (text) { finishScan(text); return; }

      throw new Error("Code non détecté.");

    } catch (err) {
      setError("Désolé, code non détecté. Tapez-le manuellement.");
    } finally {
      setLoading(false);
      if (photoScanRef.current) photoScanRef.current.value = "";
    }
  };

  const handleMultiPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "tracking_number" ? value.toUpperCase() : value 
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    try {
      // Upload de toutes les photos
      for (const photoFile of photos) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${photoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('packages').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('packages').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      const { error } = await supabase.from('packages').insert([{ 
        ...formData, 
        photo_url: uploadedUrls[0] || null, // On garde l'ancienne colonne pour compatibilité
        photo_urls: uploadedUrls, // Nouveau tableau
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null 
      }]);

      if (error) throw error;
      router.push("/chine");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header className="header" style={{ justifyContent: 'space-between', background: 'var(--primary)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button" style={{ color: 'white' }}><Icons.Back /></button>
          <h1 style={{ fontSize: '1.1rem', color: 'white' }}>Nouveau Colis</h1>
        </div>
      </header>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error && <div style={{ background: '#fff0f0', color: '#d00', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>⚠️ {error}</div>}
        
        {/* SECTION SCAN ET PHOTOS MULTIPLES */}
        <div style={{ background: 'white', padding: '1.2rem', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button type="button" onClick={() => photoScanRef.current?.click()} disabled={loading} style={{ flex: 1.5, height: '110px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
              {loading ? <span className="loader"></span> : <><Icons.Scan /><span style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>SCANNER TRACKING</span></>}
            </button>
            <input type="file" ref={photoScanRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoScan} />

            <button type="button" onClick={() => multiPhotoInputRef.current?.click()} style={{ flex: 1, height: '110px', background: '#f8f9fa', color: 'var(--primary)', border: '2px dashed var(--primary)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Camera />
              <span style={{ fontSize: '0.7rem', marginTop: '0.4rem', fontWeight: 'bold' }}>+ PHOTOS</span>
            </button>
            <input type="file" ref={multiPhotoInputRef} accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handleMultiPhotoChange} />
          </div>

          {/* GALERIE D'APERÇU */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
              {previews.map((src, index) => (
                <div key={index} style={{ position: 'relative', flex: '0 0 80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eee' }}>
                  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(index)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Trash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de Tracking</label>
          <input type="text" name="tracking_number" className="form-input" placeholder="Tapez ou scannez..." value={formData.tracking_number} onChange={handleChange} required style={{ fontSize: '1.3rem', fontWeight: '800', textAlign: 'center', border: '2px solid var(--primary)', borderRadius: '12px' }} />
        </div>

        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
          <div className="form-group">
            <input type="text" name="customer_name" className="form-input" placeholder="Nom du client" value={formData.customer_name} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="tel" name="customer_phone" className="form-input" placeholder="Téléphone" value={formData.customer_phone} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Poids (kg)</label>
            <input type="number" step="0.01" name="weight_kg" className="form-input" placeholder="0.00" value={formData.weight_kg} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
            <label className="form-label">Type d'envoi</label>
            <select name="shipping_type" className="form-input" value={formData.shipping_type} onChange={handleChange} style={{ appearance: 'none' }}>
              <option value="ORDINAIRE">Ordinaire</option>
              <option value="EXPRESS">Express 🚀</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '60px', borderRadius: '16px', fontWeight: 'bold' }}>
          {loading ? "Envoi des photos..." : "ENREGISTRER LE COLIS"}
        </button>
      </form>

      <nav className="bottom-nav">
        <Link href="/chine" className="nav-item"><Icons.Home /></Link>
        <Link href="/add" className="nav-item active" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', borderRadius: '50%' }}><Icons.Plus /></Link>
        <div className="nav-item" style={{ opacity: 0.3 }}><Icons.Scan /></div>
      </nav>

      <style jsx>{`
        .loader { width: 24px; height: 24px; border: 3px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default memo(AddPackage);
