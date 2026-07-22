'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles, ChevronDown, ChevronUp, AlertTriangle, Loader, RefreshCw,
} from 'lucide-react';

export function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#15803d' : pct >= 60 ? '#b45309' : '#dc2626';
  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar">
        <div className="conf-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="conf-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

export function EntityChip({ label, color, bg }) {
  return <span className="entity-chip" style={{ color, background: bg }}>{label}</span>;
}

export const ENTITY_STYLES = {
  persons:       { color: '#1d4ed8', bg: '#dbeafe', prefix: '👤' },
  dates:         { color: '#15803d', bg: '#dcfce7', prefix: '📅' },
  organizations: { color: '#b45309', bg: '#fef3c7', prefix: '🏥' },
  medications:   { color: '#7c3aed', bg: '#ede9fe', prefix: '💊' },
  locations:     { color: '#0f766e', bg: '#ccfbf1', prefix: '📍' },
};

export const ENTITY_LABELS = {
  persons: 'People', dates: 'Dates', organizations: 'Organizations',
  medications: 'Medications', locations: 'Locations',
};

const ANALYSING_MESSAGES = [
  'Preparing clinical intelligence…',
  'Care agent is working…',
  'Generating medical insight…',
  'From data to care action…',
];

export function Section({ title, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel-section analysis-bento__section analysis-panel-card">
      <button type="button" className="panel-section__header" onClick={() => setOpen(o => !o)}>
        <span className="panel-section__title-row">
          {title}
          {badge && <span className="panel-section__badge">{badge}</span>}
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="panel-section__body">{children}</div>}
    </div>
  );
}

export function LabResultsTable({ labValues, onFlagRow }) {
  const [showAll, setShowAll] = useState(false);
  if (!labValues?.length) return <p className="text-muted">No structured lab values detected.</p>;

  const abnormal = labValues.filter(v => v.flag === 'HIGH' || v.flag === 'LOW');
  const displayed = showAll ? labValues : labValues.slice(0, 12);

  return (
    <div className="lab-table-wrap">
      {abnormal.length > 0 && (
        <div className="lab-alert">
          <AlertTriangle size={14} />
          <span><strong>{abnormal.length} abnormal value{abnormal.length > 1 ? 's' : ''}</strong> detected — review recommended</span>
        </div>
      )}
      <table className="lab-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Reference</th>
            <th>Flag</th>
            {onFlagRow && <th className="lab-review-col">Review</th>}
          </tr>
        </thead>
        <tbody>
          {displayed.map((row, i) => {
            const isHigh = row.flag === 'HIGH';
            const isLow  = row.flag === 'LOW';
            const flagColor = isHigh ? '#dc2626' : isLow ? '#b45309' : '#15803d';
            const rowCls = isHigh || isLow ? 'lab-row lab-row--abnormal' : 'lab-row';
            return (
              <tr key={i} className={rowCls}>
                <td className="lab-test">{row.test}</td>
                <td className="lab-value" style={{ color: (isHigh || isLow) ? flagColor : 'inherit', fontWeight: (isHigh || isLow) ? 700 : 400 }}>
                  {row.value}
                </td>
                <td className="lab-unit">{row.unit}</td>
                <td className="lab-ref">{row.refRange || '—'}</td>
                <td className="lab-flag">
                  {row.flag && row.flag !== 'NORMAL' ? (
                    <span className="lab-flag-badge" style={{ color: flagColor, background: isHigh ? '#fee2e2' : '#fef3c7', borderColor: flagColor }}>
                      {row.flag}
                    </span>
                  ) : row.flag === 'NORMAL' ? (
                    <span className="lab-flag-badge lab-flag-badge--normal">✓</span>
                  ) : '—'}
                </td>
                {onFlagRow && (
                  <td className="lab-review-col">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm review-flag-btn"
                      onClick={() => onFlagRow(row, i)}
                      aria-label={`Flag ${row.test} value`}
                    >
                      Flag
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {labValues.length > 12 && (
        <button type="button" className="btn btn--ghost btn--sm lab-show-more" onClick={() => setShowAll(s => !s)}>
          {showAll ? `Show less` : `Show all ${labValues.length} values`}
        </button>
      )}
    </div>
  );
}

function VitalsSummary({ labValues }) {
  const vitals = labValues?.filter(v =>
    /blood pressure|heart rate|spo|oxygen|respiratory|temperature|weight|bmi|glucose/i.test(v.test)
  );
  if (!vitals?.length) return null;
  return (
    <div className="vitals-grid">
      {vitals.map((v, i) => {
        const isHigh = v.flag === 'HIGH';
        const isLow  = v.flag === 'LOW';
        const accent = isHigh ? '#dc2626' : isLow ? '#b45309' : '#15803d';
        const bg     = isHigh ? '#fee2e2' : isLow ? '#fef3c7' : '#f0fdf4';
        return (
          <div key={i} className="vital-card" style={{ borderColor: accent, background: bg }}>
            <span className="vital-card__label">{v.test.replace(/\s*\(.*\)/, '')}</span>
            <span className="vital-card__value" style={{ color: accent }}>{v.value}</span>
            <span className="vital-card__unit">{v.unit}</span>
            {(isHigh || isLow) && (
              <span className="vital-card__flag" style={{ color: accent }}>{v.flag}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ImagingFindings({ text }) {
  if (!text) return null;
  const blocks = [];

  const findingsMatch = text.match(/FINDINGS?[:]\s*([\s\S]+?)(?=IMPRESSION|CONCLUSION|RECOMMENDATION|REPORTED BY|$)/i);
  const impressionMatch = text.match(/IMPRESSION\s*[/-]?\s*CONCLUSION[:]\s*([\s\S]+?)(?=RECOMMENDATION|REPORTED BY|$)/i)
    || text.match(/IMPRESSION[:]\s*([\s\S]+?)(?=RECOMMENDATION|REPORTED BY|$)/i);
  const recommendMatch = text.match(/RECOMMENDATION[S]?[:]\s*([\s\S]+?)(?=REPORTED BY|$)/i);

  if (findingsMatch) blocks.push({ label: 'Radiological Findings', text: findingsMatch[1].trim().slice(0, 800), color: '#1e40af', bg: '#eff6ff' });
  if (impressionMatch) blocks.push({ label: 'Impression / Conclusion', text: impressionMatch[1].trim().slice(0, 600), color: '#9a3412', bg: '#fff7ed' });
  if (recommendMatch) blocks.push({ label: 'Recommendations', text: recommendMatch[1].trim().slice(0, 400), color: '#047857', bg: '#f0fdf4' });

  if (!blocks.length) return null;
  return (
    <div className="imaging-blocks">
      {blocks.map((b, i) => (
        <div key={i} className="imaging-block" style={{ borderLeftColor: b.color, background: b.bg }}>
          <p className="imaging-block__label" style={{ color: b.color }}>{b.label}</p>
          <p className="imaging-block__text">{b.text}</p>
        </div>
      ))}
    </div>
  );
}

function MedicationList({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const medLines = lines.filter(l =>
    /\d+\s*mg|\btablet\b|\bcapsule\b|\bdaily\b|\btwice\b|\bonce\b|\bOD\b|\bBD\b|\bTDS\b/i.test(l) &&
    l.length > 10 && l.length < 200
  );
  if (!medLines.length) return null;
  return (
    <div className="med-list">
      {medLines.slice(0, 10).map((line, i) => (
        <div key={i} className="med-item">
          <span className="med-dot">💊</span>
          <span className="med-text">{line.trim().replace(/^\d+\.\s*/, '')}</span>
        </div>
      ))}
    </div>
  );
}

function InsightList({ items }) {
  return (
    <ul className="doc-insights__list">
      {items.map((item, i) => (
        <li key={i} className="doc-insights__item">{item}</li>
      ))}
    </ul>
  );
}

export function AiProgressBar({ aiLoadProgress }) {
  const isGeminiWait =
    aiLoadProgress?.file === 'Gemini' &&
    aiLoadProgress?.total === 1 &&
    aiLoadProgress?.loaded === 0;

  if (isGeminiWait) {
    return (
      <div className="ai-inline-progress">
        <Loader size={13} className="spin" />
        <div className="ai-inline-progress__right">
          <span className="ai-inline-progress__label">Calling AI…</span>
        </div>
      </div>
    );
  }

  const pct = aiLoadProgress?.total
    ? Math.round((aiLoadProgress.loaded / aiLoadProgress.total) * 100)
    : null;

  const isUploading = aiLoadProgress?.phase === 'uploading';
  const label = isUploading
    ? `Uploading to cloud… ${pct != null ? `${pct}%` : ''}`
    : aiLoadProgress?.phase === 'analyzing'
      ? 'AI analysis in progress…'
      : aiLoadProgress?.file
        ? `Loading ${aiLoadProgress.file}…`
        : 'Running AI analysis…';

  return (
    <div className="ai-inline-progress">
      <Loader size={13} className="spin" />
      <div className="ai-inline-progress__right">
        <span className="ai-inline-progress__label">{label}</span>
        {pct !== null && (
          <div className="ai-progress__bar" style={{ marginTop: 4 }}>
            <div className="ai-progress__fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalysisDocumentBody({ doc, onEnhanceAI, aiLoading, aiLoadProgress }) {
  if (!doc) return null;
  const { analysis, textContent } = doc;
  const docType = analysis?.classification?.type || '';
  const isLabReport    = docType === 'Lab Report';
  const isImaging      = docType === 'Imaging Report';
  const isPrescription = docType === 'Prescription';
  const isClinical     = ['Discharge Summary', 'Other'].includes(docType) || /clinical|assessment|vital/i.test(textContent || '');
  const labValues      = analysis?.labValues || [];
  const abnormalCount  = labValues.filter(v => v.flag === 'HIGH' || v.flag === 'LOW').length;
  const isAnalysing    = doc.status === 'analysing';
  const aiInsights     = analysis?.aiInsights || null;
  const hasAiInsights = Boolean(
    aiInsights?.executiveSummary ||
    aiInsights?.insights?.length ||
    aiInsights?.limitations?.length ||
    aiInsights?.careCoordinationNotes?.length
  );
  const [analysingMessageIdx, setAnalysingMessageIdx] = useState(0);

  useEffect(() => {
    if (!isAnalysing) {
      setAnalysingMessageIdx(0);
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setAnalysingMessageIdx((prev) => (prev + 1) % ANALYSING_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(intervalId);
  }, [isAnalysing]);

  return (
    <div className="analysis-page__body-inner analysis-doc-shell">
      {isAnalysing && (
        <div className="ai-analysing-banner">
          <Loader size={15} className="spin" />
          <span>{ANALYSING_MESSAGES[analysingMessageIdx]}</span>
        </div>
      )}

      <div className="analysis-bento">
        <div className="analysis-bento__main">
          <Section title="Clinical Intelligence Report">
            {analysis?.classification ? (
              <>
                <div className="classification-header">
                  <span className="classification-type">{docType}</span>
                  {analysis.aiEnhanced && <span className="ai-badge"><Sparkles size={11} /> AI</span>}
                </div>
                <ConfidenceBar value={analysis.classification.confidence} />
              </>
            ) : <p className="text-muted">Classifying…</p>}
          </Section>

          <Section title="AI Summary">
            {aiLoading && !analysis?.summary ? (
              <AiProgressBar aiLoadProgress={aiLoadProgress} />
            ) : analysis?.summary ? (
              <p className="summary-text">{analysis.summary}</p>
            ) : (
              <p className="text-muted">Summary will appear after AI analysis.</p>
            )}
          </Section>

          {hasAiInsights && (
            <Section title="AI Insights">
              {aiInsights.executiveSummary ? (
                <p className="doc-insights__exec">{aiInsights.executiveSummary}</p>
              ) : null}
              {aiInsights.insights?.length > 0 ? (
                <div className="doc-insights__group">
                  <p className="doc-insights__label">Key insights</p>
                  <InsightList items={aiInsights.insights} />
                </div>
              ) : null}
              {aiInsights.limitations?.length > 0 ? (
                <div className="doc-insights__group">
                  <p className="doc-insights__label">Limitations</p>
                  <InsightList items={aiInsights.limitations} />
                </div>
              ) : null}
              {aiInsights.careCoordinationNotes?.length > 0 ? (
                <div className="doc-insights__group">
                  <p className="doc-insights__label">Care coordination</p>
                  <InsightList items={aiInsights.careCoordinationNotes} />
                </div>
              ) : null}
            </Section>
          )}

          {(isLabReport || labValues.length > 0) && (
            <Section
              title="Lab Results"
              badge={abnormalCount > 0 ? `${abnormalCount} abnormal` : `${labValues.length} values`}
            >
              <LabResultsTable labValues={labValues} />
            </Section>
          )}

          {isClinical && !isLabReport && labValues.length > 0 && (
            <Section title="Vital Signs" badge={abnormalCount > 0 ? `${abnormalCount} flagged` : null}>
              <VitalsSummary labValues={labValues} />
              <div style={{ marginTop: 8 }}>
                <LabResultsTable labValues={labValues} />
              </div>
            </Section>
          )}

          {isImaging && (
            <Section title="Imaging Findings">
              <ImagingFindings text={textContent} />
            </Section>
          )}

          {(isPrescription || analysis?.entities?.medications?.length > 0) && (
            <Section title="Medications">
              {analysis.entities?.medications?.length > 0 && (
                <div className="entity-group" style={{ marginBottom: 12 }}>
                  <p className="entity-group__label">💊 Detected medications</p>
                  <div className="entity-chips">
                    {analysis.entities.medications.map((m, i) => (
                      <EntityChip key={i} label={m} color="#7c3aed" bg="#ede9fe" />
                    ))}
                  </div>
                </div>
              )}
              {isPrescription && <MedicationList text={textContent} />}
            </Section>
          )}

          <Section title="Extracted Entities" defaultOpen={false}>
            {analysis?.entities ? (
              Object.entries(analysis.entities)
                .filter(([k]) => k !== 'medications')
                .map(([key, vals]) => {
                  if (!vals?.length) return null;
                  const style = ENTITY_STYLES[key] || { color: '#475569', bg: '#f1f5f9', prefix: '' };
                  return (
                    <div key={key} className="entity-group">
                      <p className="entity-group__label">{style.prefix} {ENTITY_LABELS[key] || key}</p>
                      <div className="entity-chips">
                        {vals.map((v, i) => <EntityChip key={i} label={v} color={style.color} bg={style.bg} />)}
                      </div>
                    </div>
                  );
                })
            ) : <p className="text-muted">No entities extracted.</p>}
          </Section>
        </div>

        {/* <aside className="analysis-bento__side">
          {analysis?.metrics && Object.keys(analysis.metrics).length > 0 && (
            <Section title="Patient Details" defaultOpen>
              <dl className="metrics-list">
                {Object.entries(analysis.metrics).map(([k, v]) => (
                  <div key={k} className="metrics-row">
                    <dt className="metrics-key">{k}</dt>
                    <dd className="metrics-val">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {aiLoading && (
            <div className="ai-enhance-box ai-enhance-box--running">
              <div className="ai-enhance-box__text">
                <Sparkles size={16} />
                <div>
                  <p className="ai-enhance-box__title">AI analysis in progress</p>
                  <p className="ai-enhance-box__sub">
                    {aiLoadProgress?.file === 'Gemini'
                      ? 'Calling Google Gemini…'
                      : aiLoadProgress?.file
                        ? `Downloading ${aiLoadProgress.file}…`
                        : 'Running AI…'}
                  </p>
                </div>
              </div>
              {aiLoadProgress?.total > 0 && (
                <div className="ai-progress">
                  <div className="ai-progress__bar">
                    <div className="ai-progress__fill" style={{
                      width: `${Math.round((aiLoadProgress.loaded / aiLoadProgress.total) * 100)}%`
                    }} />
                  </div>
                  <span className="ai-progress__label">
                    {Math.round((aiLoadProgress.loaded / aiLoadProgress.total) * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {!aiLoading && textContent && doc.status === 'ready' && (
            <div className="ai-enhance-box">
              <div className="ai-enhance-box__text">
                <RefreshCw size={16} />
                <div>
                  <p className="ai-enhance-box__title">Re-run Gemini</p>
                  <p className="ai-enhance-box__sub">Generate a fresh structured analysis from the extracted text.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onEnhanceAI(doc.id, textContent, doc.name)}
              >
                Re-run
              </button>
            </div>
          )}
        </aside> */}
      </div>
    </div>
  );
}
