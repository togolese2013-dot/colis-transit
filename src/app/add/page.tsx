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
  )
};

const AddPackage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
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

      // ZONE 1 : Centre agrandi (Focus sur le code)
      canvas.width = 1200;
      canvas.height = 800;
      ctx.filter = "contrast(200%) grayscale(100%)";
      const zoomSize = Math.min(originalImg.width, originalImg.height) * 0.6;
      ctx.drawImage(originalImg, (originalImg.width - zoomSize)/2, (originalImg.height - zoomSize)/2, zoomSize, zoomSize, 0, 0, 1200, 800);
      let text = await tryScan(canvas.toDataURL("image/jpeg", 0.9));
      if (text) { finishScan(text); return; }

      // ZONE 2 : Pleine image optimisée
      canvas.width = 1600;
      canvas.height = 1600 * (originalImg.height / originalImg.width);
      ctx.filter = "contrast(150%) brightness(110%)";
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      text = await tryScan(canvas.toDataURL("image/jpeg", 0.8));
      if (text) { finishScan(text); return; }

      throw new Error("Code non détecté. Vous pouvez le taper manuellement ci-dessous.");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de scan");
    } finally {
      setLoading(false);
      if (photoScanRef.current) photoScanRef.current.value = "";
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === "tracking_number" ? e.target.value.toUpperCase() : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
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
      <header className="header" style={{ justifyContent: 'space-between', background: 'var(--primary)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button" style={{ color: 'white' }}><Icons.Back /></button>
          <div>
            <h1 style={{ fontSize: '1.2rem', color: 'white' }}>Scanner Colis</h1>
            <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>MODE TRIPLE-SCAN V3.0</span>
          </div>
        </div>
      </header>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error && (
          <div style={{ background: '#fff0f0', color: '#d00', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #ffcccc' }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <button type="button" onClick={() => photoScanRef.current?.click()} disabled={loading} style={{ flex: 2, height: '140px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '800', boxShadow: '0 8px 20px rgba(255,102,0,0.4)', transition: 'transform 0.2s' }}>
            {loading ? <span className="loader"></span> : <><Icons.Scan /><span style={{ marginTop: '0.8rem', fontSize: '1rem' }}>SCANNER LE COLIS</span></>}
          </button>
          <input type="file" ref={photoScanRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoScan} />

          <div style={{ flex: 1, height: '140px', background: 'white', borderRadius: '20px', overflow: 'hidden', border: '2px solid #eee' }}>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-p" />
            <label htmlFor="photo-p" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Icons.Camera /><span style={{ fontSize: '0.7rem', marginTop: '0.4rem' }}>Photo</span></>}
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Numéro de Tracking</label>
          <input type="text" name="tracking_number" className="form-input" placeholder="Tapez ou scannez..." value={formData.tracking_number} onChange={handleChange} required style={{ fontSize: '1.5rem', fontWeight: '900', color: '#000', textAlign: 'center', border: '2px solid var(--primary)', borderRadius: '16px', background: '#fff9f5' }} />
        </div>

        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Client (Nom)</label>
            <input type="text" name="customer_name" className="form-input" placeholder="Nom du client" value={formData.customer_name} onChange={handleChange} style={{ borderRadius: '12px' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Téléphone</label>
            <input type="tel" name="customer_phone" className="form-input" placeholder="Numéro de téléphone" value={formData.customer_phone} onChange={handleChange} style={{ borderRadius: '12px' }} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '65px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          {loading ? "Chargement..." : "VALIDER LE COLIS"}
        </button>
      </form>

      <nav className="bottom-nav" style={{ borderRadius: '25px 25px 0 0', height: '70px' }}>
        <Link href="/chine" className="nav-item"><Icons.Home /></Link>
        <Link href="/add" className="nav-item active" style={{ background: 'var(--primary)', color: 'white', marginTop: '-30px', height: '60px', width: '60px', borderRadius: '50%' }}><Icons.Plus /></Link>
        <div className="nav-item" style={{ opacity: 0.3 }}><Icons.Scan /></div>
      </nav>

      <style jsx>{`
        .loader { width: 30px; height: 30px; border: 4px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default memo(AddPackage);
