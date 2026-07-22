'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useMedDocs } from '../../../../../context/MedDocsContext';
import { useAuth } from '../../../../../context/AuthContext';
import ReviewAnalysisView from '../../../../../components/analysis/ReviewAnalysisView';

export default function AnalysisReviewPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.docId;

  const { documents, addToast } = useMedDocs();
  const { user, loading: authLoading } = useAuth();

  const doc = useMemo(() => documents.find((d) => d.id === docId), [documents, docId]);
  const canReview = user?.role === 'CLINICIAN' || user?.isAdmin;

  useEffect(() => {
    if (authLoading) return;
    if (!canReview) {
      addToast('Clinician or admin access required to review analyses', 'error', 3500);
      router.replace(`/analysis/${docId}`);
      return;
    }
    if (docId && documents.length > 0 && !doc) {
      addToast('Document not found', 'error', 3000);
      router.replace('/analysis');
    }
  }, [authLoading, canReview, docId, doc, documents.length, router, addToast]);

  if (authLoading || !canReview || !doc) {
    return (
      <div className="analysis-page analysis-page--v2 analysis-page--empty analysis-page--premium">
        <div className="analysis-shell">
          <div className="analysis-empty-state" role="status" aria-live="polite">
            <Loader size={28} className="spin analysis-empty-state__icon" aria-hidden />
            <p className="analysis-empty-state__title">Loading review</p>
            <p className="analysis-empty-state__sub text-muted">Checking access…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page analysis-page--v2 analysis-page--premium">
      <div className="analysis-shell">
        <header className="review-page__header">
          <h1>Clinician Review — {doc.name}</h1>
          <p className="text-muted">
            Flag incorrect or missing findings. Submitted corrections are stored against this report for
            future accuracy improvements.
          </p>
        </header>
        <ReviewAnalysisView doc={doc} addToast={addToast} />
      </div>
    </div>
  );
}
