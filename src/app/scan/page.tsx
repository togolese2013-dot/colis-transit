"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { ChevronLeft, Zap, ScanLine } from "lucide-react";

const NATIVE_FORMATS = ['code_128', 'code_39', 'qr_code', 'itf'];

const ZXING_HINTS: Map<DecodeHintType, any> = new Map();
ZXING_HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE, BarcodeFormat.ITF,
]);

export default function ScanPage() {
  const router = useRouter();
  const videoRef    = useRef<HTMLVideoElement>(null);
  const readerRef   = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number | null>(null);
  const detectedRef = useRef(false);

  const [error,    setError]    = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [engine,   setEngine]   = useState<'native' | 'zxing' | null>(null);

  const onDetected = (raw: string) => {
    if (detectedRef.current) return;
    detectedRef.current = true;
    const text = raw.toUpperCase();
    setDetected(text);
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = 880;
      osc.start(); setTimeout(() => osc.stop(), 120);
    } catch {}
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => router.push(`/add?tracking=${encodeURIComponent(text)}`), 350);
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      // High-res rear camera for reading from a distance
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' }, width: { min: 1280, ideal: 1920 }, height: { min: 720, ideal: 1080 } },
      }).catch(() =>
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      );
    }

    async function start() {
      try {
        const stream = await startCamera();
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        if ('BarcodeDetector' in window) {
          // Native API — hardware-accelerated on Chrome/Android, much faster than ZXing
          setEngine('native');
          let detector: any;
          try {
            detector = new (window as any).BarcodeDetector({ formats: NATIVE_FORMATS });
          } catch {
            detector = new (window as any).BarcodeDetector();
          }

          const loop = async () => {
            if (detectedRef.current || cancelled) return;
            try {
              const results: any[] = await detector.detect(video);
              if (results.length > 0) { onDetected(results[0].rawValue); return; }
            } catch {}
            rafRef.current = requestAnimationFrame(loop);
          };
          // Wait for video to be ready before first frame
          video.addEventListener('loadeddata', () => { rafRef.current = requestAnimationFrame(loop); }, { once: true });
          if (video.readyState >= 2) rafRef.current = requestAnimationFrame(loop);

        } else {
          // Fallback: ZXing — feed it a cropped canvas stream (viewfinder only)
          // instead of the full 1920×1080 frame → ~16x fewer pixels to decode
          setEngine('zxing');

          const CROP_W = 480, CROP_H = 288;
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = CROP_W; cropCanvas.height = CROP_H;
          const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true })!;

          // Draw viewfinder area of video onto cropCanvas at 60fps
          const drawFrames = () => {
            if (detectedRef.current || cancelled) return;
            const vw = video.videoWidth, vh = video.videoHeight;
            if (vw && vh) {
              const sw = window.innerWidth, sh = window.innerHeight;
              const scale = Math.max(sw / vw, sh / vh);
              const clipX = (vw * scale - sw) / 2;
              const clipY = (vh * scale - sh) / 2;
              const srcX = ((sw - 270) / 2 + clipX) / scale;
              const srcY = ((sh - 160) / 2 + clipY) / scale;
              const srcW = 270 / scale;
              const srcH = 160 / scale;
              cropCtx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, CROP_W, CROP_H);
            }
            rafRef.current = requestAnimationFrame(drawFrames);
          };
          rafRef.current = requestAnimationFrame(drawFrames);

          // Feed the cropped canvas stream to ZXing
          const cropStream = cropCanvas.captureStream(30);
          const cropVideo = document.createElement('video');
          cropVideo.muted = true; cropVideo.playsInline = true;
          cropVideo.srcObject = cropStream;
          await cropVideo.play();

          const reader = new BrowserMultiFormatReader(ZXING_HINTS, 0);
          readerRef.current = reader;
          reader.decodeFromStream(cropStream, cropVideo, (result) => {
            if (result) {
              onDetected(result.getText());
              stream.getTracks().forEach(t => t.stop());
            }
          });
        }
      } catch {
        if (!cancelled) setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      readerRef.current?.reset();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line

  const handleBack = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    readerRef.current?.reset();
    streamRef.current?.getTracks().forEach(t => t.stop());
    router.push("/add");
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 100, overflow: 'hidden' }}>

      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted playsInline />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleBack}
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>Scanner un code</span>
        </div>
        {/* Engine badge */}
        {engine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '0.3rem 0.625rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.6875rem', fontWeight: '700' }}>
            {engine === 'native' ? <Zap size={11} /> : <ScanLine size={11} />}
            {engine === 'native' ? 'Natif' : 'ZXing'}
          </div>
        )}
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
              background: engine === 'native' ? '#f97316' : 'white',
              boxShadow: engine === 'native' ? '0 0 10px #f97316, 0 0 20px rgba(249,115,22,0.4)' : '0 0 8px rgba(255,255,255,0.6)',
              borderRadius: '1px',
              animation: 'scanLine 1.6s ease-in-out infinite',
            }} />
          )}
        </div>
        {!detected && !error && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', fontWeight: '500', textAlign: 'center' }}>
            Centrez le code-barres dans le cadre
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
