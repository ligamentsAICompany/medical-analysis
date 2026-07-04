'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuth } from '../../context/AuthContext'
import { useMedDocs } from '../../context/MedDocsContext'
import Toast from '../Toast'
import { FloatingAssistant } from '../assistant/FloatingAssistant'
import { AssistantSidePanel } from '../assistant/AssistantSidePanel'
import { AssistantDeleteConfirm } from '../assistant/AssistantDeleteConfirm'

export function AppShell ({ children }) {
  const { user } = useAuth()
  const { documents, toasts, removeToast } = useMedDocs()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="shell">
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        isAdmin={Boolean(user?.isAdmin)}
        docCount={documents.length}
      />
      <div className={`shell-main${sidebarCollapsed ? ' shell-main--collapsed' : ''}`}>
        <div className="shell-content">
          {children}
        </div>
      </div>
      <FloatingAssistant />
      <AssistantSidePanel />
      <AssistantDeleteConfirm />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
