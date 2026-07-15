'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Download, Trash2, FileText, Image, Loader } from 'lucide-react';
import { AnalysisDocumentBody } from './analysis/AnalysisShared';
import { ImageAnalysisView } from './analysis/ImageAnalysisView';
import { AnalysisFeedbackSection } from './analysis/AnalysisFeedback';
import { FeedbackAttachmentsPanel } from './analysis/FeedbackAttachmentsPanel';
import { PageHeader } from './shell/PageHeader';
import { isVisionStudyDoc } from '../lib/medicalFileTypes';
import { downloadAnalysisReport } from '../lib/analysisExport';

const formatFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  const rounded = u === 0 ? Math.round(n) : n < 10 ? Math.round(n * 10) / 10 : Math.round(n);
  return `${rounded} ${units[u]}`;
};

const statusLabel = (status) => {
  if (status === 'analysing') return 'Analysing';
  if (status === 'uploading') return 'Uploading';
  if (status === 'ready') return 'Ready';
  return status || '—';
};

const ANALYSING_MESSAGES = [
  'Preparing clinical intelligence…',
  'Care agent is working…',
  'Generating medical insight…',
  'From data to care action…',
];

export default function AnalysisPageView({
  doc,
  onViewPdf,
  onDelete,
  onEnhanceAI,
  aiLoading,
  aiLoadProgress,
  embedded = false,
}) {
  const downloadSourceFile = useCallback(() => {
    if (!doc?.objectUrl) return;
    const a = document.createElement('a');
    a.href = doc.objectUrl;
    a.download = doc.attachmentName || doc.name;
    a.click();
  }, [doc]);

  const handleDownloadAnalysis = useCallback(() => {
    if (!doc?.analysis) return;
    downloadAnalysisReport(doc, 'text');
  }, [doc]);

  const handleDownloadAnalysisJson = useCallback(() => {
    if (!doc?.analysis) return;
    downloadAnalysisReport(doc, 'json');
  }, [doc]);

  const isImage = useMemo(
    () => isVisionStudyDoc(doc),
    [doc]
  );

  const docTypeLabel = useMemo(() => {
    if (!doc) return '';
    if (isImage) return 'Image';
    return doc.analysis?.classification?.type || 'Document';
  }, [doc, isImage]);

  const showFeedbackPanel = useMemo(() => {
    if (!doc || doc.status !== 'ready' || !doc.analysis) return false;
    return true;
  }, [doc]);

  const classification = doc?.analysis?.classification?.type;
  const [analysingMessageIdx, setAnalysingMessageIdx] = useState(0);

  useEffect(() => {
    if (!doc || doc.status !== 'analysing') {
      setAnalysingMessageIdx(0);
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setAnalysingMessageIdx((prev) => (prev + 1) % ANALYSING_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(intervalId);
  }, [doc, doc?.status]);

  if (!doc) return null;

  return (
    <>
      <PageHeader
        breadcrumb="Analysis · Report"
        title={doc.name}
        description={`${docTypeLabel} · ${statusLabel(doc.status)}${doc.createdBy ? ` · ${doc.createdBy}` : ''}`}
      />

      <div className={`analysis-page analysis-page--v2 analysis-page--premium${embedded ? ' analysis-page--embedded' : ''}`}>
        <div className="analysis-shell">
          <nav className="analysis-toolbar" aria-label="Document actions">
            <Link href="/analysis" className="analysis-toolbar__back" aria-label="Back to analysis">
              <ArrowLeft size={18} aria-hidden />
              <span>Back</span>
            </Link>
            <div className="analysis-toolbar__chips">
              {!isImage && (
                <span className="analysis-chip">
                  Type <strong>{docTypeLabel}</strong>
                </span>
              )}
              <span className="analysis-chip">
                Status <strong>{statusLabel(doc.status)}</strong>
              </span>
              {!isImage && classification && (
                <span className="analysis-chip">
                  Class <strong>{classification}</strong>
                </span>
              )}
            </div>
            <div className="analysis-toolbar__actions">
              {!isImage && (
                <button type="button" className="btn btn--ghost" onClick={onViewPdf}>
                  <Eye size={15} aria-hidden /> View document
                </button>
              )}
              {doc.analysis && doc.status === 'ready' && (
                <>
                  <button type="button" className="btn btn--ghost" onClick={handleDownloadAnalysis}>
                    <Download size={15} aria-hidden /> Download analysis
                  </button>
                  {/* <button type="button" className="btn btn--ghost" onClick={handleDownloadAnalysisJson}>
                    <FileText size={15} aria-hidden /> Export JSON
                  </button> */}
                </>
              )}
              {doc.objectUrl && !doc.isMock && doc.objectUrl.startsWith('blob:') && (
                <button type="button" className="btn btn--ghost" onClick={downloadSourceFile}>
                  <Download size={15} aria-hidden /> Download source
                </button>
              )}
              <button
                type="button"
                className="btn btn--ghost btn--danger-outline"
                onClick={() => onDelete(doc.id)}
              >
                <Trash2 size={15} aria-hidden /> Delete
              </button>
            </div>
          </nav>

          <div className="analysis-page__scroll analysis-page__scroll--v2">
            {isImage ? (
              doc.status === 'analysing' ? (
                <div className="analysis-page__body-inner">
                  <div className="ai-analysing-banner">
                    <Loader size={15} className="spin" aria-hidden />
                    <span>{ANALYSING_MESSAGES[analysingMessageIdx]}</span>
                  </div>
                </div>
              ) : doc.analysis?.imageAnalysis ? (
                <ImageAnalysisView doc={doc} />
              ) : (
                <div className="analysis-page__body-inner">
                  <AnalysisDocumentBody
                    doc={doc}
                    onEnhanceAI={onEnhanceAI}
                    aiLoading={aiLoading}
                    aiLoadProgress={aiLoadProgress}
                  />
                </div>
              )
            ) : (
              <AnalysisDocumentBody
                doc={doc}
                onEnhanceAI={onEnhanceAI}
                aiLoading={aiLoading}
                aiLoadProgress={aiLoadProgress}
              />
            )}
          </div>

          {showFeedbackPanel && (
            <section
              className="analysis-feedback-standalone"
              aria-labelledby={`analysis-feedback-heading-${doc.id}`}
            >
              {doc.userFeedback?.attachments?.some((att) => att.url || att.objectUrl) ? (
                <FeedbackAttachmentsPanel
                  attachments={doc.userFeedback.attachments}
                  title="Submitted feedback attachments"
                />
              ) : null}
              <AnalysisFeedbackSection
                doc={doc}
                showTitle={false}
                pageTitle={
                  <h2 id={`analysis-feedback-heading-${doc.id}`} className="analysis-feedback-standalone__title">
                    Feedback
                  </h2>
                }
              />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
