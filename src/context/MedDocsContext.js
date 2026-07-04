'use client';

import React, { createContext, useContext } from 'react';
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
    addDocument,
    addImageBundle,
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
