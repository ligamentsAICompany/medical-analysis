'use client';

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UploadZone from './UploadZone';
import DocumentTable from './DocumentTable';
import PdfViewer from './PdfViewer';
import Toast from './Toast';
import { ClinicalDetailsForm, EMPTY_CLINICAL_CONTEXT } from './ClinicalDetailsForm';
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
  const [clinicalContext, setClinicalContext] = useState(EMPTY_CLINICAL_CONTEXT);
  const [showNewFinding, setShowNewFinding] = useState(false);

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
        const id = addImageBundle(arr, clinicalContext)
        setTimeout(() => analyzeFileBundle(id, arr, clinicalContext), 50)
        router.push(`/analysis/${id}`)
        addToast(
          `Analysing ${arr.length} files together for one clinical report…`,
          'info',
          4000
        )
        return
      }

      arr.forEach((file, idx) => {
        const id = addDocument(file, clinicalContext)
        setTimeout(() => analyzeFile(id, file, clinicalContext), 50)
        if (idx === 0) router.push(`/analysis/${id}`)
      })
    },
    [addDocument, addImageBundle, addToast, analyzeFile, analyzeFileBundle, router, clinicalContext]
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

          {showNewFinding && (
            <div className="analysis-workspace__new-finding">
              <ClinicalDetailsForm
                value={clinicalContext}
                onChange={setClinicalContext}
                onClear={() => setClinicalContext(EMPTY_CLINICAL_CONTEXT)}
                onClose={() => setShowNewFinding(false)}
              />
              <UploadZone onFiles={handleFiles} addToast={addToast} />
            </div>
          )}

          <div className="section-gap">
            <DocumentTable
              documents={documents}
              onView={setViewerDoc}
              onAnalysis={handleOpenAnalysis}
              onDelete={handleDelete}
              loading={reportsLoading}
              isAdmin={Boolean(user?.isAdmin)}
              onNewFinding={() => setShowNewFinding((v) => !v)}
              newFindingOpen={showNewFinding}
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
