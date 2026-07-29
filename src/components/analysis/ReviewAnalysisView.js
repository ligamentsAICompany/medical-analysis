'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flag, Loader, Plus, X } from 'lucide-react';
import {
  ConfidenceBar,
  Section,
  LabResultsTable,
  EntityChip,
  ENTITY_STYLES,
  ENTITY_LABELS,
  ClinicalDetailsPanel,
} from './AnalysisShared';
import { submitCorrection, listCorrections } from '../../lib/correctionsClient';

/** Best-effort classification of the source upload for correction records. */
function inferAnalysisType(doc) {
  if (doc?.isZipArchive) return 'dicom';
  const docType = doc?.analysis?.classification?.type || '';
  if (docType === 'Lab Report') return 'lab';
  if (doc?.analysis?.imageAnalysis) return 'generic_image';
  return 'document';
}

function CorrectionPopover({ fieldPath, correctionType, originalValue, onSubmit, onClose }) {
  const [correctedValue, setCorrectedValue] = useState(
    correctionType === 'missing' ? '' : (originalValue ?? '')
  );
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!correctedValue.trim()) {
      setError('Corrected value is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ correctedValue: correctedValue.trim(), note: note.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to submit correction');
    } finally {
      setSubmitting(false);
    }
  }, [correctedValue, note, onSubmit, onClose]);

  return (
    <div className="review-popover" role="dialog" aria-label="Submit correction">
      <div className="review-popover__header">
        <span className="review-popover__title">
          {correctionType === 'missing' ? 'Add missing finding' : 'Flag as incorrect'}
        </span>
        <button type="button" className="review-popover__close" onClick={onClose} aria-label="Cancel">
          <X size={14} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="review-popover__body">
        <p className="review-popover__field-path">{fieldPath}</p>
        {correctionType !== 'missing' && (
          <div className="review-popover__original">
            <span>Current value</span>
            <code>{String(originalValue ?? '—')}</code>
          </div>
        )}
        <label className="review-popover__label">
          <span>{correctionType === 'missing' ? 'Finding text' : 'Corrected value'}</span>
          <textarea
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            rows={3}
            required
          />
        </label>
        <label className="review-popover__label">
          <span>Note (optional)</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="review-popover__error">{error}</p>}
        <div className="review-popover__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary btn--sm" disabled={submitting}>
            {submitting ? <Loader size={13} className="spin" /> : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FlagButton({ fieldPath, originalValue, correctionType = 'incorrect', onSubmit, label }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="review-flag-anchor">
      <button
        type="button"
        className="btn btn--ghost btn--sm review-flag-btn"
        onClick={() => setOpen(true)}
        aria-label={label || `Flag ${fieldPath}`}
      >
        {correctionType === 'missing' ? <Plus size={13} /> : <Flag size={13} />}
        {correctionType === 'missing' ? ' Add missing' : ' Flag'}
      </button>
      {open && (
        <CorrectionPopover
          fieldPath={fieldPath}
          correctionType={correctionType}
          originalValue={originalValue}
          onSubmit={(payload) => onSubmit({ fieldPath, correctionType, originalValue, ...payload })}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
}

function PriorCorrectionsList({ corrections }) {
  if (!corrections?.length) {
    return <p className="text-muted">No corrections logged yet for this report.</p>;
  }
  return (
    <ul className="review-corrections-list">
      {corrections.map((c) => (
        <li key={c.correctionId} className="review-corrections-list__item">
          <span className="review-corrections-list__path">{c.fieldPath}</span>
          <span className={`review-corrections-list__type review-corrections-list__type--${c.correctionType}`}>
            {c.correctionType}
          </span>
          <span className="review-corrections-list__value">{String(c.correctedValue)}</span>
          {c.note && <span className="review-corrections-list__note">"{c.note}"</span>}
          {c.correctedByEmail && (
            <span className="review-corrections-list__by">— {c.correctedByEmail}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ReviewAnalysisView({ doc, addToast }) {
  const reportId = doc?.reportId || doc?.id;
  const analysis = doc?.analysis;
  const analysisType = inferAnalysisType(doc);

  const [corrections, setCorrections] = useState([]);
  const [loadingCorrections, setLoadingCorrections] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [flaggedLabRow, setFlaggedLabRow] = useState(null);

  const refreshCorrections = useCallback(async () => {
    if (!reportId) return;
    setLoadingCorrections(true);
    setLoadError(null);
    try {
      const list = await listCorrections(reportId);
      setCorrections(list);
    } catch (err) {
      setLoadError(err?.message || 'Could not load corrections');
    } finally {
      setLoadingCorrections(false);
    }
  }, [reportId]);

  useEffect(() => {
    refreshCorrections();
  }, [refreshCorrections]);

  const handleSubmitCorrection = useCallback(async ({ fieldPath, correctionType, originalValue, correctedValue, note }) => {
    if (!reportId) throw new Error('No report to attach this correction to.');
    await submitCorrection(reportId, {
      analysisType,
      fieldPath,
      correctionType,
      originalValue: originalValue ?? null,
      correctedValue,
      note,
    });
    addToast?.('Correction submitted', 'success', 2500);
    await refreshCorrections();
  }, [reportId, analysisType, addToast, refreshCorrections]);

  if (!analysis) {
    return <p className="text-muted">No AI analysis available for this document yet.</p>;
  }

  const entities = analysis.entities || {};
  const imageAnalysis = analysis.imageAnalysis;
  const insights = analysis.aiInsights?.insights || [];

  return (
    <div className="review-analysis-view">
      <ClinicalDetailsPanel clinicalContext={doc?.clinicalContext} />

      <Section title="Classification">
        <div className="review-classification">
          <span>{analysis.classification?.type || 'Unknown'}</span>
          <ConfidenceBar value={analysis.classification?.confidence || 0} />
          <FlagButton
            fieldPath="classification.type"
            originalValue={analysis.classification?.type}
            onSubmit={handleSubmitCorrection}
          />
        </div>
      </Section>

      <Section title="Summary">
        <div className="review-field-row">
          <p>{analysis.summary || '—'}</p>
          <FlagButton
            fieldPath="summary"
            originalValue={analysis.summary}
            onSubmit={handleSubmitCorrection}
          />
        </div>
      </Section>

      {analysis.labValues?.length > 0 && (
        <Section title="Lab Values">
          <LabResultsTable
            labValues={analysis.labValues}
            onFlagRow={(row, i) => setFlaggedLabRow({ row, i })}
          />
          {flaggedLabRow && (
            <CorrectionPopover
              fieldPath={`labValues[${flaggedLabRow.i}].value`}
              correctionType="incorrect"
              originalValue={flaggedLabRow.row.value}
              onSubmit={(payload) =>
                handleSubmitCorrection({
                  fieldPath: `labValues[${flaggedLabRow.i}].value`,
                  correctionType: 'incorrect',
                  originalValue: flaggedLabRow.row.value,
                  ...payload,
                })
              }
              onClose={() => setFlaggedLabRow(null)}
            />
          )}
          <div className="review-field-row review-field-row--add">
            <FlagButton
              fieldPath="labValues"
              correctionType="missing"
              onSubmit={handleSubmitCorrection}
              label="Add a missing lab value"
            />
          </div>
        </Section>
      )}

      {imageAnalysis && (
        <Section title="Imaging Findings">
          <ul className="review-list">
            {(imageAnalysis.findings || []).map((f, i) => (
              <li key={`finding-${i}`} className="review-list__item">
                <span>{f}</span>
                <FlagButton
                  fieldPath={`imageAnalysis.findings[${i}]`}
                  originalValue={f}
                  onSubmit={handleSubmitCorrection}
                />
              </li>
            ))}
          </ul>
          <div className="review-field-row review-field-row--add">
            <FlagButton
              fieldPath="imageAnalysis.findings"
              correctionType="missing"
              onSubmit={handleSubmitCorrection}
              label="Add a missing finding"
            />
          </div>
          <ul className="review-list">
            {(imageAnalysis.impression || []).map((imp, i) => (
              <li key={`impression-${i}`} className="review-list__item">
                <span>{imp}</span>
                <FlagButton
                  fieldPath={`imageAnalysis.impression[${i}]`}
                  originalValue={imp}
                  onSubmit={handleSubmitCorrection}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {insights.length > 0 && (
        <Section title="AI Insights" defaultOpen={false}>
          <ul className="review-list">
            {insights.map((item, i) => (
              <li key={i} className="review-list__item">
                <span>{item}</span>
                <FlagButton
                  fieldPath={`aiInsights.insights[${i}]`}
                  originalValue={item}
                  onSubmit={handleSubmitCorrection}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Entities" defaultOpen={false}>
        {Object.keys(ENTITY_LABELS).filter((key) => entities[key]?.length).map((key) => (
          <div key={key} className="review-entity-group">
            <span className="review-entity-group__label">{ENTITY_LABELS[key]}</span>
            <div className="review-entity-group__chips">
              {entities[key].map((val, i) => (
                <span key={i} className="review-entity-group__chip-wrap">
                  <EntityChip label={val} color={ENTITY_STYLES[key]?.color} bg={ENTITY_STYLES[key]?.bg} />
                  <FlagButton
                    fieldPath={`entities.${key}[${i}]`}
                    originalValue={val}
                    onSubmit={handleSubmitCorrection}
                  />
                </span>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Prior Corrections" defaultOpen>
        {loadingCorrections ? (
          <p className="text-muted"><Loader size={13} className="spin" /> Loading…</p>
        ) : loadError ? (
          <p className="review-popover__error">{loadError}</p>
        ) : (
          <PriorCorrectionsList corrections={corrections} />
        )}
      </Section>
    </div>
  );
}
