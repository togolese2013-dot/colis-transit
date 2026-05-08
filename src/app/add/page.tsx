"use client";

import React, { useState, useRef, useCallback, memo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Camera, Trash2, Home, Plus, BarChart2, User, Users, Zap } from "lucide-react";

const AddPackage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const multiPhotoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_phone: "",
    weight_kg: "",
    shipping_type: "ORDINAIRE",
    status: "RECU_CHINE",
  });

  useEffect(() => {
    const tracking = searchParams.get('tracking');
    if (tracking) setFormData(prev => ({ ...prev, tracking_number: tracking }));
  }, [searchParams]);

const handleMultiPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "tracking_number" ? value.toUpperCase() : value }));

    if (name === "customer_name") {
      if (value.length >= 2) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .ilike('name', `%${value}%`)
          .limit(5);
        setSuggestions(data || []);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  }, []);

  const selectCustomer = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.name,
      customer_phone: customer.phone || prev.customer_phone,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    try {
      for (const photoFile of photos) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${photoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('packages').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('packages').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      const { error } = await supabase.from('packages').insert([{
        ...formData,
        photo_url: uploadedUrls[0] || null,
        photo_urls: uploadedUrls,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      }]);

      if (error) throw error;

      if (formData.customer_name.trim()) {
        await supabase.from('customers').upsert(
          { name: formData.customer_name.trim(), phone: formData.customer_phone.trim() || null },
          { onConflict: 'name' }
        );
      }

      router.push("/chine");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-btn" onClick={() => router.push("/chine")} type="button">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="page-title">Nouveau Colis</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--error-subtle)', color: 'var(--error)',
            border: '1.5px solid var(--error-border)', borderRadius: 'var(--r-xl)',
            padding: '0.875rem 1rem', marginBottom: '1rem',
            fontSize: '0.875rem', fontWeight: '500',
          }}>
            {error}
          </div>
        )}

        {/* Scan & Photos card */}
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1.125rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: previews.length > 0 ? '0.875rem' : 0 }}>

            {/* Live scanner */}
            <button
              type="button"
              onClick={() => router.push('/scan')}
              style={{
                flex: 1.6, height: '96px',
                background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: 'var(--r-xl)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <Zap size={22} strokeWidth={2} />
              <span style={{ fontSize: '0.71875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scanner Tracking</span>
            </button>

            {/* Multi-photos */}
            <button
              type="button"
              onClick={() => multiPhotoInputRef.current?.click()}
              style={{
                flex: 1, height: '96px',
                background: 'var(--bg-subtle)', color: 'var(--accent)',
                border: '1.5px dashed var(--accent-border)', borderRadius: 'var(--r-xl)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Camera size={20} />
              <span style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>+ Photos</span>
            </button>
            <input type="file" ref={multiPhotoInputRef} accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handleMultiPhotoChange} />
          </div>

          {/* Preview gallery */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0, width: '72px', height: '72px', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute', top: '3px', right: '3px',
                      background: 'rgba(239,68,68,0.9)', color: 'white',
                      border: 'none', borderRadius: '50%',
                      width: '20px', height: '20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={10} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tracking number */}
        <div className="form-field">
          <label className="form-label">Numéro de Tracking</label>
          <input
            type="text"
            name="tracking_number"
            className="form-input"
            placeholder="Tapez ou scannez..."
            value={formData.tracking_number}
            onChange={handleChange}
            required
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: '700',
              textAlign: 'center', letterSpacing: '0.02em',
            }}
          />
        </div>

        {/* Customer info */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <label className="form-label">Nom du client</label>
            <input
              type="text"
              name="customer_name"
              className="form-input"
              placeholder="Nom complet"
              value={formData.customer_name}
              onChange={handleChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-xl)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)', overflow: 'hidden',
              }}>
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectCustomer(c)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '0.75rem 1rem', background: 'none', border: 'none',
                      cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: '0.125rem',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-1)' }}>{c.name}</span>
                    {c.phone && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Téléphone</label>
            <input type="tel" name="customer_phone" className="form-input" placeholder="+228 XX XX XX XX" value={formData.customer_phone} onChange={handleChange} />
          </div>
        </div>

        {/* Weight & type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">Poids (kg)</label>
            <input type="number" step="0.01" name="weight_kg" className="form-input" placeholder="0.00" value={formData.weight_kg} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Type d'envoi</label>
            <select name="shipping_type" className="form-input form-select" value={formData.shipping_type} onChange={handleChange}>
              <option value="ORDINAIRE">Ordinaire</option>
              <option value="EXPRESS">Express 🚀</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" />Enregistrement...</>
            : 'Enregistrer le colis'
          }
        </button>
      </form>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/chine"   className="nav-btn" title="Accueil"><Home size={19} /></Link>
        <Link href="/clients" className="nav-btn" title="Clients"><Users size={19} /></Link>
        <Link href="/add"     className="nav-btn add-btn active" title="Ajouter"><Plus size={22} /></Link>
        <Link href="/stats"   className="nav-btn" title="Statistiques"><BarChart2 size={19} /></Link>
        <Link href="/profile" className="nav-btn" title="Profil"><User size={19} /></Link>
      </nav>
    </div>
  );
};

const AddPackageWithSuspense = () => (
  <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner-dark spinner" /></div>}>
    <AddPackage />
  </React.Suspense>
);

export default memo(AddPackageWithSuspense);
