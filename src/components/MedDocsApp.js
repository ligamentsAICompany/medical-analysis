'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Download, Sparkles, Loader } from 'lucide-react';
import UploadZone from './UploadZone';
import DocumentTable from './DocumentTable';
import PdfViewer from './PdfViewer';
import Toast from './Toast';
import { useMedDocs } from '../context/MedDocsContext';

export default function MedDocsApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    toasts, addToast, removeToast,
    documents, addDocument, deleteDocument,
    analyzeFile,
    modelsReady, modelsPreloading,
  } = useMedDocs();

  const [viewerDoc, setViewerDoc] = useState(null);

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId) return;
    const d = documents.find(x => x.id === viewId);
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

  const readyCount = documents.filter(d => d.status === 'ready').length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <Activity size={20} />
        </div>
        <div className="header-title">
          <h1>MedDocs</h1>
          <p>Medical Document Manager</p>
        </div>
        <div className="header-spacer" />

        {modelsPreloading ? (
          <span className="ai-status-pill ai-status-pill--loading">
            <Loader size={12} className="spin" />
            AI loading…
          </span>
        ) : modelsReady ? (
          <span className="ai-status-pill ai-status-pill--ready">
            <Sparkles size={12} />
            AI ready
          </span>
        ) : null}

        <span className="header-badge">{readyCount} document{readyCount !== 1 ? 's' : ''} ready</span>
      </header>

      <main className="app-main">
        <UploadZone onFiles={handleFiles} addToast={addToast} />

        <div className="samples-banner" style={{ marginTop: 20 }}>
          <div className="samples-banner__text">
            <h3>Sample medical PDFs for testing</h3>
            <p>Download and drag into the upload zone above to see medical analysis in action</p>
          </div>
          <div className="samples-banner__links">
            <a className="sample-link" href="/samples/blood_report_cbc_metabolic.pdf" download>
              <Download size={13} /> Blood Report
            </a>
            <a className="sample-link" href="/samples/chest_xray_radiology_report.pdf" download>
              <Download size={13} /> Chest X-Ray
            </a>
            <a className="sample-link" href="/samples/clinical_assessment_hypertension.pdf" download>
              <Download size={13} /> Clinical Assessment
            </a>
          </div>
        </div>

        <div className="section-gap">
          <DocumentTable
            documents={documents}
            onView={setViewerDoc}
            onAnalysis={handleOpenAnalysis}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {viewerDoc && (
        <PdfViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
