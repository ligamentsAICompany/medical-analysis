'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { PiArrowRight, PiChartLineUp, PiFileText, PiImage } from 'react-icons/pi'
import StatusBadge from '../StatusBadge'
import { formatRelativeTime, getDocTypeLabel } from './dashboardUtils'

function ActivityIcon ({ doc }) {
  const isImage = Boolean(doc.analysis?.imageAnalysis)
  const Icon = isImage ? PiImage : PiFileText
  return (
    <span className={`dash-activity__icon${isImage ? ' dash-activity__icon--imaging' : ''}`} aria-hidden>
      <Icon size={16} />
    </span>
  )
}

export function RecentActivity ({ documents, loading, isAdmin }) {
  const recent = useMemo(
    () => [...documents]
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 8),
    [documents]
  )

  return (
    <section className="shell-card dash-activity">
      <div className="shell-card__header dash-activity__header">
        <div>
          <p className="eyebrow">Recent activity</p>
          <p className="dash-activity__sub">Latest uploads and completed analyses</p>
        </div>
        <Link href="/analysis" className="dash-activity__link">
          View all
          <PiArrowRight size={14} aria-hidden />
        </Link>
      </div>
      <div className="shell-card__divider" />
      <div className="shell-card__body dash-activity__body">
        {loading ? (
          <p className="dash-activity__empty">Loading reports…</p>
        ) : recent.length === 0 ? (
          <div className="dash-activity__empty">
            <PiChartLineUp size={28} aria-hidden />
            <p>No reports yet.</p>
            <Link href="/analysis" className="shell-btn shell-btn--secondary">
              Upload a file
            </Link>
          </div>
        ) : (
          <ul className="dash-activity__list">
            {recent.map((doc) => (
              <li key={doc.id}>
                <Link href={`/analysis/${doc.id}`} className="dash-activity__item">
                  <ActivityIcon doc={doc} />
                  <div className="dash-activity__content">
                    <div className="dash-activity__row">
                      <span className="dash-activity__name">{doc.name}</span>
                      <span className="dash-activity__time tabular-nums">
                        {formatRelativeTime(doc.uploadedAt)}
                      </span>
                    </div>
                    <div className="dash-activity__meta">
                      <span className="dash-activity__type">{getDocTypeLabel(doc)}</span>
                      {doc.analysis?.patientName ? (
                        <span className="dash-activity__patient">{doc.analysis.patientName}</span>
                      ) : null}
                      {isAdmin && doc.createdBy ? (
                        <span className="dash-activity__owner">{doc.createdBy}</span>
                      ) : null}
                      <StatusBadge status={doc.status} />
                    </div>
                  </div>
                  <PiArrowRight size={14} className="dash-activity__chevron" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
