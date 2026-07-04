'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { PiArrowRight } from 'react-icons/pi'
import { PageHeader } from './shell/PageHeader'
import { DashboardCharts } from './dashboard/DashboardCharts'
import { RecentActivity } from './dashboard/RecentActivity'
import { useMedDocs } from '../context/MedDocsContext'
import { useAuth } from '../context/AuthContext'

export function DashboardView () {
  const { user } = useAuth()
  const { documents, reportsLoading } = useMedDocs()

  const stats = useMemo(() => {
    const ready = documents.filter((d) => d.status === 'ready').length
    const analysing = documents.filter((d) => d.status === 'analysing').length
    const persisted = documents.filter((d) => d.isPersisted).length
    const imaging = documents.filter((d) => d.analysis?.imageAnalysis).length
    return { total: documents.length, ready, analysing, persisted, imaging }
  }, [documents])

  return (
    <>
      <PageHeader
        breadcrumb="Home · Dashboard"
        title="Overview"
        description={
          user?.isAdmin
            ? 'Clinical intelligence across all users in your workspace.'
            : 'Your clinical document pipeline at a glance.'
        }
        actions={(
          <Link href="/analysis" className="shell-btn shell-btn--primary">
            New analysis
            <PiArrowRight size={16} aria-hidden />
          </Link>
        )}
      />

      <div className="shell-kpi-grid">
        <div className="shell-kpi">
          <p className="eyebrow shell-kpi__eyebrow">Total reports</p>
          <p className="kpi-value shell-kpi__value tabular-nums">{stats.total}</p>
          <p className="shell-kpi__sub">{stats.persisted} saved to cloud</p>
        </div>
        <div className="shell-kpi">
          <p className="eyebrow shell-kpi__eyebrow">Ready for review</p>
          <p className="kpi-value shell-kpi__value tabular-nums">{stats.ready}</p>
          <p className="shell-kpi__sub">Completed analyses</p>
        </div>
        <div className="shell-kpi">
          <p className="eyebrow shell-kpi__eyebrow">In analysis</p>
          <p className="kpi-value shell-kpi__value tabular-nums">{stats.analysing}</p>
          <p className="shell-kpi__sub">Processing now</p>
        </div>
        <div className="shell-kpi">
          <p className="eyebrow shell-kpi__eyebrow">Imaging studies</p>
          <p className="kpi-value shell-kpi__value tabular-nums">{stats.imaging}</p>
          <p className="shell-kpi__sub">With image analysis</p>
        </div>
      </div>

      <DashboardCharts documents={documents} />

      <RecentActivity
        documents={documents}
        loading={reportsLoading}
        isAdmin={Boolean(user?.isAdmin)}
      />
    </>
  )
}
