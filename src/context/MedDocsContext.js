'use client';

import React, { createContext, useContext } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../hooks/useToast';
import { useAnalysis } from '../hooks/useAnalysis';

const MedDocsContext = createContext(null);

export function MedDocsProvider({ children }) {
  const { toasts, addToast, removeToast } = useToast();
  const { documents, addDocument, updateDocument, deleteDocument } = useDocuments();
  const analysis = useAnalysis({ updateDocument, addToast });

  const value = {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    toasts,
    addToast,
    removeToast,
    ...analysis,
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
