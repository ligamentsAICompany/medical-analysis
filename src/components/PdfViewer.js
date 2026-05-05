'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Download, FileText } from 'lucide-react';

export default function PdfViewer({ doc, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!doc) return null;

  const isPdf = doc.fileType === 'application/pdf';
  const hasFile = !doc.isMock && doc.objectUrl;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={`Viewing ${doc.name}`}>
      <div className="pdf-modal">
        {/* Header */}
        <div className="pdf-modal__header">
          <div className="pdf-modal__title">
            <FileText size={16} />
            <span title={doc.name}>{doc.name}</span>
          </div>
          <div className="pdf-modal__actions">
            {hasFile && (
              <a href={doc.objectUrl} download={doc.name} className="btn btn--ghost btn--sm">
                <Download size={15} /> Download
              </a>
            )}
            <button className="btn-icon" onClick={onClose} aria-label="Close viewer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="pdf-modal__body">
          {hasFile && isPdf ? (
            <iframe
              src={doc.objectUrl}
              title={doc.name}
              className="pdf-iframe"
              aria-label="PDF document viewer"
            />
          ) : hasFile && doc.fileType.startsWith('image/') ? (
            <div className="pdf-modal__image-wrap">
              <img src={doc.objectUrl} alt={doc.name} className="pdf-modal__image" />
            </div>
          ) : (
            <div className="pdf-mock-placeholder">
              <FileText size={64} strokeWidth={1} />
              <h3>{doc.name}</h3>
              {doc.isMock ? (
                <p>This is a demo document. Upload a real file to view it here.</p>
              ) : (
                <p>Preview not available for this file type.</p>
              )}
              {doc.textContent && (
                <div className="pdf-mock-text">
                  <h4>Extracted text preview</h4>
                  <pre>{doc.textContent.slice(0, 800)}{doc.textContent.length > 800 ? '…' : ''}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
