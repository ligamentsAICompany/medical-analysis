'use client';

import React, { Suspense } from 'react';
import MedDocsApp from '../src/components/MedDocsApp';

export default function Page() {
  return (
    <Suspense fallback={<div className="app" style={{ padding: 32 }}><p className="text-muted">Loading…</p></div>}>
      <MedDocsApp />
    </Suspense>
  );
}
