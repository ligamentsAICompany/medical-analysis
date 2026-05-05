'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Sparkles, Loader } from 'lucide-react';
import { useMedDocs } from '../context/MedDocsContext';

export function AppHeader() {
  const { documents, modelsReady, modelsPreloading } = useMedDocs();
  const readyCount = documents.filter((d) => d.status === 'ready').length;

  return (
    <header className="app-header">
      <Link href="/" className="header-brand" aria-label="MedDocs home">
        <div className="header-logo">
          <Activity size={20} aria-hidden />
        </div>
        <div className="header-title">
          <h1>MedDocs</h1>
          <p>Medical Document Manager</p>
        </div>
      </Link>
      <div className="header-spacer" />

      {modelsPreloading ? (
        <span className="ai-status-pill ai-status-pill--loading">
          <Loader size={12} className="spin" aria-hidden />
          AI loading…
        </span>
      ) : modelsReady ? (
        <span className="ai-status-pill ai-status-pill--ready">
          <Sparkles size={12} aria-hidden />
          AI ready
        </span>
      ) : null}

      <span className="header-badge">
        {readyCount} document{readyCount !== 1 ? 's' : ''} ready
      </span>
    </header>
  );
}
