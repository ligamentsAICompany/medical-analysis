'use client';

import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { DICOM_MIME, isDicomFile } from '../lib/medicalFileTypes';

const ACCEPTED = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/webp', DICOM_MIME, 'application/x-dicom'];
const MAX_MB = 20;

function validate(file, addToast) {
  const typeOk = (file.type && ACCEPTED.includes(file.type)) || isDicomFile(file);
  if (!typeOk) {
    addToast(`${file.name}: unsupported file type`, 'error');
    return false;
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    addToast(`${file.name}: exceeds ${MAX_MB} MB limit`, 'error');
    return false;
  }
  return true;
}

export default function UploadZone({ onFiles, addToast }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((files) => {
    const valid = [...files].filter(f => validate(f, addToast));
    if (valid.length) onFiles(valid);
  }, [onFiles, addToast]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => handleFiles(e.target.files);

  return (
    <div
      className={`upload-zone${dragging ? ' upload-zone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      aria-label="Upload files"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,.dcm,.dicom,application/pdf,text/plain,image/*,application/dicom"
        className="upload-zone__input"
        onChange={onInputChange}
      />
      <div className="upload-zone__icon">
        <UploadCloud size={40} strokeWidth={1.5} />
      </div>
      <p className="upload-zone__title">
        {dragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
      </p>
      <p className="upload-zone__sub">
        <FileText size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        PDF, TXT, images, DICOM (.dcm) — max {MAX_MB} MB each. Drop several images together for one imaging report, or PDF/TXT plus imaging for one combined patient report (up to 8 imaging files, 6 documents per request).
      </p>
    </div>
  );
}
