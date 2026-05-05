'use client';

import { useState, useCallback } from 'react';
import { MOCK_DOCUMENTS } from '../lib/mockData';

let nextId = 1;

export function useDocuments() {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);

  const addDocument = useCallback((file) => {
    const id = `doc-${Date.now()}-${nextId++}`;
    const objectUrl = URL.createObjectURL(file);
    const doc = {
      id,
      name: file.name,
      fileType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      isMock: false,
      file,
      objectUrl,
      textContent: null,
      analysis: null,
    };
    setDocuments(prev => [doc, ...prev]);
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
    setDocuments(prev => {
      const doc = prev.find(d => d.id === id);
      if (doc?.objectUrl) URL.revokeObjectURL(doc.objectUrl);
      return prev.filter(d => d.id !== id);
    });
  }, []);

  return { documents, addDocument, updateDocument, deleteDocument };
}
