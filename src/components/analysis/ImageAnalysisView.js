'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { isDicomFile, isGeminiVisionUpload, isTextBundleFile } from '../../lib/medicalFileTypes';

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

function MultiImageStrip ({ doc, previewIndex, onSelectPreview }) {
  const urls = doc.bundleObjectUrls?.length > 1 ? doc.bundleObjectUrls : null
  if (!urls) return null
  return (
    <div
      className="img-multi-strip"
      role="tablist"
      aria-label="Choose which upload to preview"
    >
      {urls.map((src, i) => {
        const sliceFile = doc.bundleFiles?.[i]
        const sliceIsDicom = sliceFile ? isDicomFile(sliceFile) : false
        const sliceIsDoc = sliceFile ? isTextBundleFile(sliceFile) : false
        const selected = i === previewIndex
        return (
          <button
            key={`${doc.id}-strip-${i}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={sliceFile?.name ? `Show preview ${i + 1}: ${sliceFile.name}` : `Show preview ${i + 1}`}
            className={`img-multi-strip__cell${selected ? ' img-multi-strip__cell--selected' : ''}`}
            onClick={() => onSelectPreview(i)}
          >
            {sliceIsDicom ? (
              <div
                className="img-multi-strip__dicom"
                role="presentation"
              >
                <span className="img-multi-strip__dicom-label">DICOM</span>
              </div>
            ) : sliceIsDoc ? (
              <div className="img-multi-strip__doc" role="presentation">
                <span className="img-multi-strip__doc-label">
                  {sliceFile?.type === 'application/pdf' ? 'PDF' : 'TXT'}
                </span>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={src}
                alt=""
                className="img-multi-strip__thumb"
              />
            )}
            <span className="img-multi-strip__idx">{i + 1}</span>
          </button>
        )
      })}
    </div>
  )
}

function isPrimarySliceDicom (doc) {
  if (doc.isImageBundle) return isDicomFile(doc.bundleFiles?.[0])
  return isDicomFile(doc.file || { type: doc.fileType, name: doc.name })
}

function isSliceDicomAtIndex (doc, index) {
  const f = doc.bundleFiles?.[index]
  if (f) return isDicomFile(f)
  return isDicomFile(doc.file || { type: doc.fileType, name: doc.name })
}

function firstVisionBundleIndex (doc) {
  if (!doc.bundleFiles?.length) return 0
  const i = doc.bundleFiles.findIndex((f) => isGeminiVisionUpload(f))
  return i >= 0 ? i : 0
}

function ImagePanel ({ doc }) {
  const urls = doc.bundleObjectUrls
  const hasStrip = urls && urls.length > 1
  const [previewIndex, setPreviewIndex] = useState(() =>
    hasStrip ? firstVisionBundleIndex(doc) : 0
  )

  useEffect(() => {
    if (doc.bundleObjectUrls && doc.bundleObjectUrls.length > 1) {
      setPreviewIndex(firstVisionBundleIndex(doc))
    } else {
      setPreviewIndex(0)
    }
  }, [doc.id, doc.bundleObjectUrls, doc.bundleFiles])

  const handleSelectPreview = (i) => {
    setPreviewIndex(i)
  }

  const mainSrc = hasStrip ? urls[previewIndex] : doc.objectUrl
  if (!mainSrc) return null

  const sliceFile = hasStrip ? doc.bundleFiles?.[previewIndex] : doc.file
  const sliceName = sliceFile?.name || doc.name
  const altText = sliceName ? `Source upload: ${sliceName}` : 'Uploaded medical image'
  const bundleHint = hasStrip
    ? ` (${urls.length} files analysed together; showing ${previewIndex + 1} of ${urls.length})`
    : ''
  const mainIsDicom = hasStrip
    ? isSliceDicomAtIndex(doc, previewIndex)
    : isPrimarySliceDicom(doc)
  const mainIsDoc = Boolean(sliceFile && isTextBundleFile(sliceFile))

  return (
    <div className="img-preview-panel img-preview-panel--below-report">
      <MultiImageStrip
        doc={doc}
        previewIndex={previewIndex}
        onSelectPreview={handleSelectPreview}
      />
      {mainIsDoc ? (
        <div
          className="img-preview-panel__doc-placeholder"
          role="note"
          aria-label="Document preview"
        >
          <p className="img-preview-panel__doc-placeholder-text">
            {sliceFile?.type === 'application/pdf' ? 'PDF' : 'Text'} file — open from the workspace to read full content. The report above combines this document with the selected imaging.
          </p>
        </div>
      ) : mainIsDicom ? (
        <div
          className="img-preview-panel__dicom-placeholder"
          role="note"
          aria-label="DICOM file — raster preview not shown in the browser"
        >
          <p className="img-preview-panel__dicom-placeholder-text">
            DICOM file — in-browser pixel preview is not shown. The clinical report above reflects AI analysis of the uploaded object.
          </p>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={mainSrc}
          alt={`${altText}${bundleHint}`}
          className="img-preview-panel__img"
        />
      )}
      {hasStrip && (
        <p className="img-preview-panel__caption">
          Preview {previewIndex + 1} of {urls.length} — click a thumbnail to switch
        </p>
      )}
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
