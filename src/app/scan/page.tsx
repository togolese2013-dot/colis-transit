"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/library";
import { ChevronLeft } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
      if (result && !detectedRef.current) {
        detectedRef.current = true;
        const text = result.getText().toUpperCase();
        setDetected(text);
        reader.reset();

        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = "sine"; osc.frequency.value = 880;
          osc.start(); setTimeout(() => osc.stop(), 120);
        } catch {}
        if (navigator.vibrate) navigator.vibrate(200);

        setTimeout(() => router.push(`/add?tracking=${encodeURIComponent(text)}`), 350);
      }
    }).catch(() => setError("Impossible d'accéder à la caméra. Vérifiez les permissions."));

    return () => { reader.reset(); };
  }, []); // eslint-disable-line

  const handleBack = () => { readerRef.current?.reset(); router.push("/add"); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 100, overflow: 'hidden' }}>

      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        muted
        playsInline
      />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem 1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10 }}>
        <button
          onClick={handleBack}
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>Scanner un code</span>
      </div>

      {/* Viewfinder */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', pointerEvents: 'none' }}>
        <div style={{ width: '270px', height: '160px', position: 'relative' }}>
          {[
            { top: 0, left: 0, borderTop: '3px solid white', borderLeft: '3px solid white', borderTopLeftRadius: '6px' },
            { top: 0, right: 0, borderTop: '3px solid white', borderRight: '3px solid white', borderTopRightRadius: '6px' },
            { bottom: 0, left: 0, borderBottom: '3px solid white', borderLeft: '3px solid white', borderBottomLeftRadius: '6px' },
            { bottom: 0, right: 0, borderBottom: '3px solid white', borderRight: '3px solid white', borderBottomRightRadius: '6px' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: '24px', height: '24px', ...style }} />
          ))}
          {!detected && (
            <div style={{
              position: 'absolute', left: '8px', right: '8px', height: '2px',
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent), 0 0 20px rgba(249,115,22,0.4)',
              borderRadius: '1px',
              animation: 'scanLine 1.6s ease-in-out infinite',
            }} />
          )}
        </div>
        {!detected && !error && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', fontWeight: '500', textAlign: 'center' }}>
            Pointez vers un code-barres ou QR code
          </p>
        )}
      </div>

      {detected && (
        <div style={{ position: 'absolute', bottom: '3.5rem', left: '1rem', right: '1rem', background: 'rgba(16,185,129,0.95)', backdropFilter: 'blur(8px)', color: 'white', borderRadius: '16px', padding: '1rem 1.25rem', textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8, marginBottom: '0.25rem' }}>Code détecté</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: '700', letterSpacing: '0.04em' }}>{detected}</div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', bottom: '3.5rem', left: '1rem', right: '1rem', background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(8px)', color: 'white', borderRadius: '16px', padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600' }}>
          {error}
        </div>
      )}
    </div>
  );
}
