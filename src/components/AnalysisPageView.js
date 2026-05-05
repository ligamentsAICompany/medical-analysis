'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Download, Trash2, FileText, Image } from 'lucide-react';
import { AnalysisDocumentBody } from './analysis/AnalysisShared';
import { ImageAnalysisView } from './analysis/ImageAnalysisView';
import { AppHeader } from './AppHeader';

export default function AnalysisPageView({
  doc,
  onViewPdf,
  onDelete,
  onEnhanceAI,
  aiLoading,
  aiLoadProgress,
}) {
  const downloadFile = useCallback(() => {
    if (!doc?.objectUrl) return;
    const a = document.createElement('a');
    a.href = doc.objectUrl;
    a.download = doc.name;
    a.click();
  }, [doc]);

  if (!doc) return null;

  const isImage = doc.fileType?.startsWith('image/') || doc.analysis?.imageAnalysis;

  return (
    <div className="app">
      <AppHeader />
      <div className="analysis-page">
        <header className="analysis-page__top">
          <Link href="/" className="analysis-page__back" aria-label="Back to documents">
            <ArrowLeft size={18} />
            <span>Documents</span>
          </Link>
          <div className="analysis-page__hero">
            <div className="analysis-page__hero-icon" aria-hidden>
              {isImage ? <Image size={22} /> : <FileText size={22} />}
            </div>
            <div>
              <h1 className="analysis-page__title">{isImage ? 'Image Analysis' : 'AI analysis'}</h1>
              <p className="analysis-page__filename" title={doc.name}>{doc.name}</p>
            </div>
          </div>
        </header>

        <div className="analysis-page__scroll">
          {isImage ? (
            <ImageAnalysisView doc={doc} />
          ) : (
            <AnalysisDocumentBody
              doc={doc}
              onEnhanceAI={onEnhanceAI}
              aiLoading={aiLoading}
              aiLoadProgress={aiLoadProgress}
            />
          )}
        </div>

        <footer className="analysis-page__footer">
          {!isImage && (
            <button type="button" className="btn btn--ghost" onClick={onViewPdf}>
              <Eye size={15} /> View document
            </button>
          )}
          {doc.objectUrl && !doc.isMock && (
            <button type="button" className="btn btn--ghost" onClick={downloadFile}>
              <Download size={15} /> Download
            </button>
          )}
          <button type="button" className="btn btn--ghost btn--danger-outline" onClick={() => onDelete(doc.id)}>
            <Trash2 size={15} /> Delete
          </button>
        </footer>
      </div>
    </div>
  );
}
