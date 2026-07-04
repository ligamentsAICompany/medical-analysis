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
import { useAuth } from '../context/AuthContext';
import {
  isAnalyzeUploadFile,
  isDocumentBundleFile,
  isGeminiVisionUpload,
  validateAnalyzeFileSelection,
} from '../lib/medicalFileTypes';
import {
  MAX_DOCUMENT_FILES_PER_REQUEST,
  MAX_VISION_FILES_PER_REQUEST,
} from '../config/uploadLimits';

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
  const { user } = useAuth();
  const {
    toasts, addToast, removeToast,
    documents, addDocument, addImageBundle, deleteDocument,
    analyzeFile,
    analyzeFileBundle,
    reportsLoading,
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

  const handleFiles = useCallback(
    (fileList) => {
      const raw = [...fileList]
      if (!raw.length) return

      const selection = validateAnalyzeFileSelection(raw)
      if (!selection.ok) {
        addToast(selection.error, 'error')
        return
      }

      let vSeen = 0
      let dSeen = 0
      const arr = raw.filter((f) => {
        if (!isAnalyzeUploadFile(f)) return false
        if (isGeminiVisionUpload(f)) {
          if (vSeen >= MAX_VISION_FILES_PER_REQUEST) return false
          vSeen += 1
          return true
        }
        if (isDocumentBundleFile(f)) {
          if (dSeen >= MAX_DOCUMENT_FILES_PER_REQUEST) return false
          dSeen += 1
          return true
        }
        return false
      })
      if (arr.length < raw.length) {
        addToast(
          `Some files were skipped (max ${MAX_VISION_FILES_PER_REQUEST} imaging and ${MAX_DOCUMENT_FILES_PER_REQUEST} document/ZIP files per request).`,
          'warning',
          6000
        )
      }

      if (arr.length >= 2) {
        const id = addImageBundle(arr)
        setTimeout(() => analyzeFileBundle(id, arr), 50)
        router.push(`/analysis/${id}`)
        addToast(
          `Analysing ${arr.length} files together for one clinical report…`,
          'info',
          4000
        )
        return
      }

      arr.forEach((file, idx) => {
        const id = addDocument(file)
        setTimeout(() => analyzeFile(id, file), 50)
        if (idx === 0) router.push(`/analysis/${id}`)
      })
    },
    [addDocument, addImageBundle, addToast, analyzeFile, analyzeFileBundle, router]
  )

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
              loading={reportsLoading}
              isAdmin={Boolean(user?.isAdmin)}
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
