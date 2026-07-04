import { describe, expect, it } from 'vitest'
import { parseCommand } from '../../../src/lib/assistant/intentParser'

describe('intentParser keyword tier', () => {
  it('detects navigate to dashboard', () => {
    const parsed = parseCommand('Go to dashboard')
    expect(parsed.intent).toBe('navigate')
    expect(parsed.module).toBe('dashboard')
    expect(parsed.confidence).toBeGreaterThan(0.6)
  })

  it('detects report search', () => {
    const parsed = parseCommand('Find lab reports for Sarah')
    expect(parsed.intent).toBe('search')
    expect(parsed.module).toBe('reports')
  })

  it('detects count intent', () => {
    const parsed = parseCommand('How many reports?')
    expect(parsed.intent).toBe('count')
    expect(parsed.module).toBe('reports')
  })

  it('detects open latest', () => {
    const parsed = parseCommand('Open latest report')
    expect(parsed.intent).toBe('open')
    expect(parsed.openLatest).toBe(true)
  })
})
