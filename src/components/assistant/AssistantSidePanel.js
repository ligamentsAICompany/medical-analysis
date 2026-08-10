'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAssistant } from '../../context/AssistantContext'
import { AssistantPanel } from './AssistantPanel'

const MIN_WIDTH = 280
const MAX_WIDTH = 520
const DEFAULT_WIDTH = 360
const CSS_VAR = '--shell-panel-w'
const MOBILE_BREAKPOINT = 768

function isMobileViewport () {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT
}

function maxPanelForViewport () {
  if (typeof window === 'undefined') return MAX_WIDTH
  if (isMobileViewport()) return window.innerWidth
  const sidebar = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--shell-sidebar-expanded')
  ) || 232
  const available = window.innerWidth - sidebar
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.floor(available * 0.42)))
}

export function AssistantSidePanel () {
  const { isOpen, closeAssistant } = useAssistant()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(DEFAULT_WIDTH)

  useEffect(() => {
    const sync = () => {
      setIsMobile(isMobileViewport())
      const cap = maxPanelForViewport()
      setWidth((w) => Math.min(w, cap))
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const panelWidth = isOpen && !isMobile ? width : 0
    root.style.setProperty(CSS_VAR, `${panelWidth}px`)
  }, [isOpen, width, isMobile])

  useEffect(() => {
    const root = document.documentElement
    return () => { root.style.removeProperty(CSS_VAR) }
  }, [])

  useEffect(() => {
    if (!isOpen || !isMobile) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen, isMobile])

  const handleMouseDown = useCallback((e) => {
    if (isMobile) return
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [isMobile, width])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizing) return
      const delta = startXRef.current - e.clientX
      const cap = maxPanelForViewport()
      const next = Math.max(MIN_WIDTH, Math.min(cap, startWidthRef.current + delta))
      setWidth(next)
    }
    const onMouseUp = () => {
      if (!isResizing) return
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing])

  // Deliberately NOT calling maxPanelForViewport() here: it reads real
  // window/DOM state, which differs between SSR (no window, falls back to
  // MAX_WIDTH) and the client's very first render (real window exists
  // immediately, before any effect runs) — that mismatch is exactly what
  // caused a real hydration warning (server 360 vs. client 280 on a
  // narrow viewport). `width` state is already kept correctly clamped by
  // the mount/resize effects above; using it directly here keeps the
  // initial server and client render identical, with the correct capped
  // value settling in via those effects immediately after hydration.
  const panelWidth = isMobile ? undefined : width

  return (
    <>
      {isOpen && isMobile ? (
        <button
          type="button"
          className="assistant-backdrop"
          aria-label="Close assistant"
          onClick={closeAssistant}
        />
      ) : null}
      <aside
        className={`assistant-side-panel${isOpen ? ' assistant-side-panel--open' : ''}${isResizing ? ' assistant-side-panel--resizing' : ''}${isMobile ? ' assistant-side-panel--mobile' : ''}`}
        style={panelWidth ? { width: panelWidth } : undefined}
        aria-hidden={!isOpen}
      >
        {!isMobile ? (
          <div
            className="assistant-side-panel__handle"
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize assistant panel"
            tabIndex={0}
          />
        ) : null}
        <div className="assistant-side-panel__stripe" aria-hidden />
        <AssistantPanel />
      </aside>
    </>
  )
}
