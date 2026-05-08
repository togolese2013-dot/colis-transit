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
  FileText: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  Weight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"></path>
      <path d="M5 12h14"></path>
      <rect x="5" y="5" width="14" height="14" rx="2"></rect>
    </svg>
  ),
  Truck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  )
};

const AddPackage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const excelInputRef = useRef<HTMLInputElement>(null);
  const photoScanRef = useRef<HTMLInputElement>(null);
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

        const packagesToInsert = data.map((row: any) => ({
          tracking_number: String(row.tracking_number || row["N° Suivi"] || row.Tracking || "").trim(),
          customer_name: String(row.customer_name || row.Nom || row.Client || "").trim(),
          customer_phone: String(row.customer_phone || row.Telephone || row.Tel || "").trim(),
          weight_kg: row.weight_kg || row.Poids || null,
          shipping_type: (row.shipping_type || row.Type || "ORDINAIRE").toUpperCase(),
          status: "RECU_CHINE",
          created_at: new Date().toISOString(),
        })).filter(p => p.tracking_number);

        const { error } = await supabase.from("packages").insert(packagesToInsert);
        if (error) throw error;

        alert(`${packagesToInsert.length} colis importés avec succès !`);
        router.push("/chine");
      } catch (err: any) {
        alert("Erreur Excel : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [router]);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "tracking_number" ? value.toUpperCase() : value 
    }));
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
      const { error } = await supabase.from('packages').insert([{ 
        ...formData, 
        photo_url,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null 
      }]);
      if (error) throw error;
      router.push("/chine");
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header className="header" style={{ justifyContent: 'space-between', background: 'var(--primary)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button" style={{ color: 'white' }}><Icons.Back /></button>
          <h1 style={{ fontSize: '1.1rem', color: 'white' }}>Nouveau Colis</h1>
        </div>
        <button type="button" onClick={() => excelInputRef.current?.click()} className="btn-icon" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}><Icons.FileText /></button>
        <input type="file" ref={excelInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleExcelImport} />
      </header>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error && <div style={{ background: '#fff0f0', color: '#d00', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>⚠️ {error}</div>}
        
        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <button type="button" onClick={() => photoScanRef.current?.click()} disabled={loading} style={{ flex: 2, height: '120px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
            {loading ? <span className="loader"></span> : <><Icons.Scan /><span style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>SCANNER</span></>}
          </button>
          <input type="file" ref={photoScanRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoScan} />

          <div style={{ flex: 1, height: '120px', background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #eee' }}>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-p" />
            <label htmlFor="photo-p" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Icons.Camera /><span style={{ fontSize: '0.6rem' }}>Photo</span></>}
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de Tracking</label>
          <input type="text" name="tracking_number" className="form-input" placeholder="Tapez ou scannez..." value={formData.tracking_number} onChange={handleChange} required style={{ fontSize: '1.3rem', fontWeight: '800', textAlign: 'center', border: '2px solid var(--primary)', borderRadius: '12px' }} />
        </div>

        {/* Nouveaux Champs : Poids et Type */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Poids (kg)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.01" name="weight_kg" className="form-input" placeholder="0.00" value={formData.weight_kg} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
              <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}><Icons.Weight /></div>
            </div>
          </div>
          <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
            <label className="form-label">Type d'envoi</label>
            <div style={{ position: 'relative' }}>
              <select name="shipping_type" className="form-input" value={formData.shipping_type} onChange={handleChange} style={{ paddingLeft: '2.5rem', appearance: 'none' }}>
                <option value="ORDINAIRE">Ordinaire</option>
                <option value="EXPRESS">Express 🚀</option>
              </select>
              <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}><Icons.Truck /></div>
            </div>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <input type="text" name="customer_name" className="form-input" placeholder="Nom du client" value={formData.customer_name} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="tel" name="customer_phone" className="form-input" placeholder="Téléphone" value={formData.customer_phone} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '60px', borderRadius: '16px', fontWeight: 'bold' }}>
          {loading ? "Chargement..." : "ENREGISTRER LE COLIS"}
        </button>
      </form>

      <nav className="bottom-nav">
        <Link href="/chine" className="nav-item"><Icons.Home /></Link>
        <Link href="/add" className="nav-item active" style={{ background: 'var(--primary)', color: 'white', marginTop: '-20px', height: '56px', width: '56px', borderRadius: '50%' }}><Icons.Plus /></Link>
        <Link href="/stats" className="nav-item" style={{ opacity: 0.3 }}><Icons.Scan /></Link>
      </nav>

      <style jsx>{`
        .loader { width: 24px; height: 24px; border: 3px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.7rem center; background-size: 1rem; }
      `}</style>
    </div>
  );
};

export default memo(AddPackage);
