'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useMedDocs } from '../../../src/context/MedDocsContext';
import AnalysisPageView from '../../../src/components/AnalysisPageView';
import Toast from '../../../src/components/Toast';
import { AppHeader } from '../../../src/components/AppHeader';

export default function AnalysisDocPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.docId;

  const {
    documents,
    deleteDocument,
    addToast,
    removeToast,
    toasts,
    enhanceWithAI,
    aiLoading,
    aiLoadingId,
    aiLoadProgress,
  } = useMedDocs();

  const doc = useMemo(() => documents.find(d => d.id === docId), [documents, docId]);

  useEffect(() => {
    if (!docId) return;
    if (documents.length > 0 && !doc) {
      addToast('Document not found', 'error', 3000);
      router.replace('/');
    }
  }, [docId, doc, documents.length, router, addToast]);

  const handleViewPdf = useCallback(() => {
    if (!doc) return;
    router.push(`/?view=${encodeURIComponent(doc.id)}`);
  }, [doc, router]);

  const handleDelete = useCallback((id) => {
    deleteDocument(id);
    addToast('Document deleted', 'info', 2500);
    router.replace('/');
  }, [deleteDocument, addToast, router]);

  if (!doc) {
    return (
      <div className="app">
        <AppHeader />
        <div className="analysis-page analysis-page--v2 analysis-page--empty analysis-page--premium">
          <div className="analysis-shell">
            <div className="analysis-empty-state" role="status" aria-live="polite">
              <Loader size={28} className="spin analysis-empty-state__icon" aria-hidden />
              <p className="analysis-empty-state__title">Loading document</p>
              <p className="analysis-empty-state__sub text-muted">Preparing your workspace…</p>
            </div>
          </div>
        </div>
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <>
      <AnalysisPageView
        doc={doc}
        onViewPdf={handleViewPdf}
        onDelete={handleDelete}
        onEnhanceAI={enhanceWithAI}
        aiLoading={aiLoading && aiLoadingId === doc.id}
        aiLoadProgress={aiLoadingId === doc.id ? aiLoadProgress : null}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}
