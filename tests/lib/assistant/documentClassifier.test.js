import { describe, expect, it } from 'vitest'
import { classifyDocument } from '../../../src/lib/heuristics'
import { describeClinicalFile } from '../../../src/lib/assistant/documentClassifier'

describe('documentClassifier helpers', () => {
  it('classifies lab report text via heuristics', () => {
    const result = classifyDocument('Laboratory report CBC reference range specimen collected')
    expect(result.type).toBe('Lab Report')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('describes imaging uploads', () => {
    const file = { type: 'image/png', name: 'ct-scan.png' }
    expect(describeClinicalFile(file)).toBe('imaging study')
  })
})
