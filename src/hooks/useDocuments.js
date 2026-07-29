'use client';

import { useState, useCallback } from 'react';
import {
  DICOM_MIME,
  effectiveVisionMimeType,
  isDicomFile,
  isGeminiVisionUpload,
  isTextBundleFile,
  isZipFile,
  partitionClinicalBundle,
} from '../lib/medicalFileTypes';

let nextId = 1;

export function useDocuments() {
  const [documents, setDocuments] = useState([]);

  const addDocument = useCallback((file, meta = {}) => {
    const id = `doc-${Date.now()}-${nextId++}`;
    const objectUrl = URL.createObjectURL(file);
    const fileType =
      (file.type && file.type.trim()) ||
      (isDicomFile(file) ? DICOM_MIME : file.type);
    const isZip = isZipFile(file);
    const doc = {
      id,
      name: file.name,
      attachmentName: file.name,
      fileType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      isMock: false,
      isZipArchive: isZip,
      file,
      objectUrl,
      textContent: null,
      analysis: null,
      isImageBundle: false,
      bundleFiles: null,
      bundleObjectUrls: null,
      userFeedback: null,
      reportId: null,
      isPersisted: false,
      createdBy: meta.createdBy || null,
      uploadedBy: meta.createdBy || null,
      clinicalContext: meta.clinicalContext || null,
    };
    setDocuments(prev => [doc, ...prev]);
    return id;
  }, []);

  /**
   * Several files → one document, one combined AI analysis.
   * Vision-only: multiple images/DICOM. Mixed: PDF/TXT/DOCX + imaging (same patient).
   */
  const addImageBundle = useCallback((files, meta = {}) => {
    const id = `doc-${Date.now()}-${nextId++}`;
    const bundleObjectUrls = files.map((f) => URL.createObjectURL(f));
    const { textFiles, visionFiles, isFullPartition } = partitionClinicalBundle(files);
    const bundleHasDocuments = textFiles.length > 0;
    const primaryIdx = Math.max(
      0,
      files.findIndex((f) => isGeminiVisionUpload(f))
    );
    const primaryFile = files[primaryIdx] || files[0];
    const shortNames = files.map((f) => f.name).slice(0, 2).join(', ');
    const name =
      bundleHasDocuments && isFullPartition
        ? files.length > 2
          ? `Combined report (${shortNames} +${files.length - 2} more)`
          : `Combined report (${shortNames})`
        : files.length > 2
          ? `${files.length} images (${shortNames} +${files.length - 2} more)`
          : `${files.length} images (${shortNames})`;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const doc = {
      id,
      name,
      attachmentName: primaryFile.name,
      fileType: effectiveVisionMimeType(primaryFile),
      size: totalSize,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      isMock: false,
      file: primaryFile,
      objectUrl: bundleObjectUrls[primaryIdx],
      textContent: null,
      analysis: null,
      isImageBundle: true,
      bundleHasDocuments: bundleHasDocuments && isFullPartition,
      bundleFiles: files,
      bundleObjectUrls,
      userFeedback: null,
      reportId: null,
      isPersisted: false,
      createdBy: meta.createdBy || null,
      uploadedBy: meta.createdBy || null,
      clinicalContext: meta.clinicalContext || null,
    };
    setDocuments((prev) => [doc, ...prev]);
    return id;
  }, []);

  // Accepts a plain object patch OR a (doc) => patch function
  const updateDocument = useCallback((id, updater) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== id) return d;
      const patch = typeof updater === 'function' ? updater(d) : updater;
      return { ...d, ...patch };
    }));
  }, []);

  const deleteDocument = useCallback((id) => {
    setDocuments((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc?.bundleObjectUrls?.length) {
        doc.bundleObjectUrls.forEach((u) => URL.revokeObjectURL(u));
      } else if (doc?.objectUrl && doc.objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(doc.objectUrl);
      }
      const feedbackUrls = doc?.userFeedback?.attachments
        ?.map((a) => a.objectUrl)
        .filter(Boolean);
      if (feedbackUrls?.length) {
        feedbackUrls.forEach((u) => URL.revokeObjectURL(u));
      }
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  return {
    documents,
    setDocuments,
    addDocument,
    addImageBundle,
    updateDocument,
    deleteDocument,
  };
}
