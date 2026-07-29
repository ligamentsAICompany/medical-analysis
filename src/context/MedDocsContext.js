'use client';

import React, { createContext, useCallback, useContext } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../hooks/useToast';
import { useAnalysis } from '../hooks/useAnalysis';
import { useReports } from '../hooks/useReports';
import { useAuth } from './AuthContext';

const MedDocsContext = createContext(null);

export function MedDocsProvider({ children }) {
  const { toasts, addToast, removeToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const {
    documents,
    setDocuments,
    addDocument,
    addImageBundle,
    updateDocument,
    deleteDocument,
  } = useDocuments();

  const displayOwner = user?.email || null;

  const addDocumentWithOwner = useCallback((file, clinicalContext) => {
    return addDocument(file, { createdBy: displayOwner, clinicalContext: clinicalContext || null });
  }, [addDocument, displayOwner]);

  const addImageBundleWithOwner = useCallback((files, clinicalContext) => {
    return addImageBundle(files, { createdBy: displayOwner, clinicalContext: clinicalContext || null });
  }, [addImageBundle, displayOwner]);

  const reports = useReports({
    documents,
    setDocuments,
    updateDocument,
    addToast,
    isAuthenticated: Boolean(user),
    authLoading,
    userId: user?.uid || user?.email || null,
  });
  const analysis = useAnalysis({
    updateDocument,
    addToast,
    persistReport: reports.persistReport,
  });

  const handleDeleteDocument = async (id) => {
    const removed = await reports.removeReport(id);
    if (removed) deleteDocument(id);
  };

  const value = {
    documents,
    setDocuments,
    addDocument: addDocumentWithOwner,
    addImageBundle: addImageBundleWithOwner,
    updateDocument,
    deleteDocument: handleDeleteDocument,
    toasts,
    addToast,
    removeToast,
    ...analysis,
    ...reports,
  };

  return (
    <MedDocsContext.Provider value={value}>
      {children}
    </MedDocsContext.Provider>
  );
}

export function useMedDocs() {
  const ctx = useContext(MedDocsContext);
  if (!ctx) {
    throw new Error('useMedDocs must be used within MedDocsProvider');
  }
  return ctx;
}
