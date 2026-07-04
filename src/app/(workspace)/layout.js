'use client'

import React, { Suspense } from 'react'
import { AppShell } from '../../components/shell/AppShell'

export default function WorkspaceLayout ({ children }) {
  return (
    <AppShell>
      <Suspense fallback={<p style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}>
        {children}
      </Suspense>
    </AppShell>
  )
}
