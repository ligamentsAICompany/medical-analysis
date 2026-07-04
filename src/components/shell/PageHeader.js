'use client'

import React from 'react'

export function PageHeader ({ breadcrumb, title, description, actions }) {
  return (
    <header className="shell-page-header">
      {breadcrumb ? <p className="eyebrow">{breadcrumb}</p> : null}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">{title}</h1>
          {description ? (
            <p style={{ marginTop: 8, color: 'var(--muted-foreground)' }}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: 8 }}>{actions}</div> : null}
      </div>
    </header>
  )
}
