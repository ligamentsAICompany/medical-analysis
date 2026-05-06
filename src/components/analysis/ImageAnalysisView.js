'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

// ── Sub-components ──────────────────────────────────────────────────────────

function ReportHeader({ doc, imageAnalysis }) {
  return (
    <div className="img-report-header">
      <div className="img-report-header__badge">
        <Sparkles size={13} />
        <span>
        Clinical Intelligence Report
        </span>
      </div>
      <h2 className="img-report-header__exam">{imageAnalysis.examTitle}</h2>

      <div className="img-report-meta-grid">
        <MetaRow label="Modality"           value={imageAnalysis.modality} />
        <MetaRow label="Report Date"        value={imageAnalysis.reportDate} />
        <MetaRow label="Accession No."      value={imageAnalysis.accessionNumber} />
        <MetaRow label="Referring Physician" value={imageAnalysis.referringPhysician} />
        <MetaRow label="Reporting Radiologist" value={imageAnalysis.radiologist} />
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="img-meta-row">
      <span className="img-meta-row__label">{label}</span>
      <span className="img-meta-row__value">{value}</span>
    </div>
  );
}

function ReportSection({ title, children, accentColor = '#1e40af', defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="img-section" style={{ '--section-accent': accentColor }}>
      <button
        type="button"
        className="img-section__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="img-section__title" style={{ color: accentColor }}>{title}</span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="img-section__body">{children}</div>}
    </div>
  );
}

function FindingsList({ items }) {
  return (
    <ul className="img-findings-list">
      {items.map((item, i) => (
        <li key={i} className="img-findings-list__item">
          <span className="img-findings-list__bullet" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ImpressionList({ items }) {
  return (
    <ol className="img-impression-list">
      {items.map((item, i) => (
        <li key={i} className="img-impression-list__item">{item}</li>
      ))}
    </ol>
  );
}

function AiInsightsSection({ aiInsights }) {
  if (!aiInsights) return null;
  const {
    executiveSummary,
    insights = [],
    limitations = [],
    careCoordinationNotes = [],
  } = aiInsights;
  const hasContent =
    (executiveSummary && executiveSummary.trim()) ||
    insights.length > 0 ||
    limitations.length > 0 ||
    careCoordinationNotes.length > 0;
  if (!hasContent) return null;

  return (
    <ReportSection title="AI clinical insights" accentColor="#4f46e5" defaultOpen>
      {executiveSummary ? (
        <p className="img-text img-insights__exec">{executiveSummary}</p>
      ) : null}
      {insights.length > 0 ? (
        <>
          <p className="img-insights__label">Key insights</p>
          <FindingsList items={insights} />
        </>
      ) : null}
      {limitations.length > 0 ? (
        <>
          <p className="img-insights__label">Limitations</p>
          <FindingsList items={limitations} />
        </>
      ) : null}
      {careCoordinationNotes.length > 0 ? (
        <>
          <p className="img-insights__label">Care coordination and documentation</p>
          <FindingsList items={careCoordinationNotes} />
        </>
      ) : null}
      <p className="img-insights__disclaimer">
        AI insights support documentation and workflow; they are not a substitute for qualified
        clinical judgment or formal imaging interpretation.
      </p>
    </ReportSection>
  );
}

function ImagePanel({ doc }) {
  const src = doc.objectUrl;
  if (!src) return null;
  const altText = doc.name ? `Source upload: ${doc.name}` : 'Uploaded medical image'
  return (
    <div className="img-preview-panel img-preview-panel--below-report">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={altText}
        className="img-preview-panel__img"
      />
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

export function ImageAnalysisView({ doc }) {
  const ia = doc?.analysis?.imageAnalysis;
  const aiInsights = doc?.analysis?.aiInsights;
  if (!ia) return null;

  return (
    <div className="img-report img-report--v2">
      <div className="img-report__layout">
        {/* AI report first */}
        <div className="img-report__report-col">
          <ReportHeader doc={doc} imageAnalysis={ia} />

          <div className="img-report__sections">
            <AiInsightsSection aiInsights={aiInsights} />

            <ReportSection title="Clinical Indication" accentColor="#0f766e" defaultOpen>
              <p className="img-text">{ia.indication}</p>
            </ReportSection>

            <ReportSection title="Technique" accentColor="#6d28d9" defaultOpen={false}>
              <p className="img-text">{ia.technique}</p>
            </ReportSection>

            <ReportSection title="Findings" accentColor="#1e40af" defaultOpen>
              <FindingsList items={ia.findings} />
            </ReportSection>

            <ReportSection title="Impression" accentColor="#9a3412" defaultOpen>
              <ImpressionList items={ia.impression} />
            </ReportSection>
          </div>
        </div>

        {/* Source image below the analysis */}
        <div className="img-report__image-col">
          <ImagePanel doc={doc} />
        </div>
      </div>
    </div>
  );
}
