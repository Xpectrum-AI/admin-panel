'use client';

import React from 'react';

interface HoneycombDashboardProps {
  title?: string;
  subtitle?: string;
  honeycombUrl?: string;
  className?: string;
}

export default function HoneycombDashboard({ 
  title = "Voice Production Analytics",
  subtitle = "Real-time Honeycomb Dashboard",
  honeycombUrl = "https://ui.honeycomb.io/xpectrum-ai-b8/environments/voice-integration-prod/board/4rrGWSxR3Q2",
  className = ""
}: HoneycombDashboardProps) {
  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <div className="p-5 bg-slate-50 border-b border-slate-200">
        <h1 className="m-0 text-2xl text-slate-800 font-semibold">{title}</h1>
        <p className="mt-1 mb-0 text-slate-600 text-sm">{subtitle}</p>
      </div>
      
      <iframe
        src={honeycombUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        className="border-none flex-1"
        title="Honeycomb Board"
        allow="fullscreen"
      />
    </div>
  );
}
