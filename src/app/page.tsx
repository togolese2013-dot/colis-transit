"use client";

import React from "react";
import Link from "next/link";

const Icons = {
  Plane: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5l-8.2-1.8c-.9-.2-1.8.1-2.4.7l-.5.5c-.4.4-.5 1-.2 1.4l7.2 3.6-3.6 7.2c-.4.4-.3 1 .1 1.4l.5.5c.6.6 1.5.9 2.4.7l8.2-1.8 3.5 3.5c1.5 1.5 3.5 1 4-.5s-.5-2.5-2-4l-3.5-3.5z"></path>
    </svg>
  ),
  Truck: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  )
};

export default function EntryPage() {
  return (
    <div className="container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Antigravity</h1>
        <p style={{ color: 'var(--text-muted)' }}>Plateforme Logistique Internationale</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Link href="/chine" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ff6600 0%, #ff9800 100%)', 
            padding: '2rem', 
            borderRadius: 'var(--radius-xl)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(255, 102, 0, 0.2)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Espace Chine</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Gestion des réceptions et envois</p>
            </div>
            <Icons.Plane />
          </div>
        </Link>

        <Link href="/lome" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #0052cc 0%, #007bff 100%)', 
            padding: '2rem', 
            borderRadius: 'var(--radius-xl)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0, 82, 204, 0.2)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Espace Lomé</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Gestion des arrivées et livraisons</p>
            </div>
            <Icons.Truck />
          </div>
        </Link>
      </div>

      <p style={{ textAlign: 'center', marginTop: '4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        © 2026 Antigravity Logistics
      </p>
    </div>
  );
}
