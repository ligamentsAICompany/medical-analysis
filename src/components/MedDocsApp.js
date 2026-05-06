'use client';

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Sparkles } from 'lucide-react';
import UploadZone from './UploadZone';
import DocumentTable from './DocumentTable';
import PdfViewer from './PdfViewer';
import Toast from './Toast';
import { AppHeader } from './AppHeader';
import { useMedDocs } from '../context/MedDocsContext';

const SAMPLE_IMAGES = [
  {
    href: '/ChatGPT%20Image%20May%205%2C%202026%2C%2004_02_24%20AM.png',
    label: 'Imaging grid',
  },
  {
    href: '/ChatGPT%20Image%20May%205%2C%202026%2C%2004_04_37%20AM.png',
    label: 'Chest X-ray',
  },
  {
    href: '/ChatGPT%20Image%20May%205%2C%202026%2C%2004_05_53%20AM.png',
    label: 'Ultrasound',
  },
  {
    href: '/ChatGPT%20Image%20May%205%2C%202026%2C%2004_11_05%20AM.png',
    label: 'CT Scan',
  },
  {
    href: '/ChatGPT%20Image%20May%205%2C%202026%2C%2004_13_05%20AM.png',
    label: 'MRI',
  },
];

export default function MedDocsApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    toasts, addToast, removeToast,
    documents, addDocument, deleteDocument,
    analyzeFile,
  } = useMedDocs();

  const [viewerDoc, setViewerDoc] = useState(null);

  const readyCount = useMemo(
    () => documents.filter((d) => d.status === 'ready').length,
    [documents]
  );
  const analysingCount = useMemo(
    () => documents.filter((d) => d.status === 'analysing').length,
    [documents]
  );

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId) return;
    const d = documents.find((x) => x.id === viewId);
    if (d && d.status === 'ready') {
      setViewerDoc(d);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, documents, router]);

  const handleFiles = useCallback((files) => {
    files.forEach((file, idx) => {
      const id = addDocument(file);
      setTimeout(() => analyzeFile(id, file), 50);
      if (idx === 0) router.push(`/analysis/${id}`);
    });
  }, [addDocument, analyzeFile, router]);

  const handleDelete = useCallback((id) => {
    if (viewerDoc?.id === id) setViewerDoc(null);
    deleteDocument(id);
    addToast('Document deleted', 'info', 2500);
  }, [deleteDocument, viewerDoc, addToast]);

  const handleOpenAnalysis = useCallback((doc) => {
    router.push(`/analysis/${doc.id}`);
  }, [router]);

  return (
    <div className="app">
      <AppHeader />

      <main className="app-main">
        <div className="home-shell home-bento">
          <section className="home-hero" aria-label="Workspace overview">
            <div className="stat-card stat-card--indigo">
              <span className="stat-card__label">Total documents</span>
              <span className="stat-card__value">{documents.length}</span>
              <span className="stat-card__accent" aria-hidden />
            </div>
            <div className="stat-card stat-card--sky">
              <span className="stat-card__label">Ready for review</span>
              <span className="stat-card__value">{readyCount}</span>
              <span className="stat-card__accent" aria-hidden />
            </div>
            <div className="stat-card stat-card--teal">
              <span className="stat-card__label">In analysis</span>
              <span className="stat-card__value">{analysingCount}</span>
              <span className="stat-card__accent" aria-hidden />
            </div>
          </section>

          <UploadZone onFiles={handleFiles} addToast={addToast} />

          <section className="samples-bento" aria-labelledby="samples-heading">
            <div className="samples-bento__intro">
              <div className="samples-bento__icon-wrap" aria-hidden>
                <Sparkles size={18} className="samples-bento__icon" />
              </div>
              <div>
                <h2 id="samples-heading" className="samples-bento__title">
                 Images (download)
                </h2>
                <p className="samples-bento__lead">
                  Grab a PNG and drop it on the zone above — AI will generate a clinical intelligence report.
                </p>
              </div>
            </div>
            <div className="samples-bento__grid">
              {SAMPLE_IMAGES.map((sample) => (
                <a
                  key={sample.href}
                  className="sample-link sample-link--premium"
                  href={sample.href}
                  download
                >
                  <Download size={14} aria-hidden />
                  {sample.label}
                </a>
              ))}
            </div>
          </section>

          <div className="section-gap">
            <DocumentTable
              documents={documents}
              onView={setViewerDoc}
              onAnalysis={handleOpenAnalysis}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </main>

      {viewerDoc && (
        <PdfViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
