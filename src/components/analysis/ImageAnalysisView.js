'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

// ── Sub-components ──────────────────────────────────────────────────────────

function ReportHeader({ doc, imageAnalysis }) {
  return (
    <div className="img-report-header">
      <div className="img-report-header__badge">
        <Sparkles size={13} />
        <span>AI Analysis · Static Report</span>
      </div>
      <h2 className="img-report-header__exam">{imageAnalysis.examTitle}</h2>

      <div className="img-report-meta-grid">
        <MetaRow label="Modality"           value={imageAnalysis.modality} />
        <MetaRow label="Report Date"        value={imageAnalysis.reportDate} />
        <MetaRow label="Accession No."      value={imageAnalysis.accessionNumber} />
        <MetaRow label="Referring Physician" value={imageAnalysis.referringPhysician} />
        <MetaRow label="Reporting Radiologist" value={imageAnalysis.radiologist} />
        <MetaRow label="File"               value={doc.name} />
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

function ImagePanel({ doc }) {
  const src = doc.objectUrl;
  if (!src) return null;
  return (
    <div className="img-preview-panel">
      <p className="img-preview-panel__label">Uploaded Image</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={doc.name}
        className="img-preview-panel__img"
      />
      <p className="img-preview-panel__filename">{doc.name}</p>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

export function ImageAnalysisView({ doc }) {
  const ia = doc?.analysis?.imageAnalysis;
  if (!ia) return null;

  return (
    <div className="img-report">
      {/* Two-column layout: image on the left, report on the right */}
      <div className="img-report__layout">

        {/* LEFT — image preview */}
        <div className="img-report__image-col">
          <ImagePanel doc={doc} />
        </div>

        {/* RIGHT — structured report */}
        <div className="img-report__report-col">
          <ReportHeader doc={doc} imageAnalysis={ia} />

          <div className="img-report__sections">
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

          <div className="img-report__footer-note">
            <Sparkles size={12} />
            <span>
              This is an AI-generated static report for demonstration purposes.
              Clinical decisions must be based on formal radiologist review.
              {ia.isStatic && ' API integration planned for real-time analysis.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
