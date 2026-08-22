import type { PriorityFactors, Severity } from '@/types'
import { SEVERITY_META } from '@/lib/constants'
import { clampScore } from '@/lib/utils'

// ============================================================
// AI Priority Score
//
// Modular weighted scoring algorithm. Weights are exposed so the
// formula can be tuned or swapped without touching the UI.
//
//   severityWeight      0-40   by detected severity
//   confidenceWeight    0-15   scaled by AI confidence
//   confirmationsWeight 0-20   community confirms (cap ~15)
//   sizeWeight          0-10   estimated size of the problem
//   roadImportance      0-10   traffic / location importance
//   recencyWeight       0-5    fresher reports score higher
//                       -----
//   total               0-100
// ============================================================

export interface ScoringWeights {
  severity: number
  confidence: number
  confirmations: number
  size: number
  roadImportance: number
  recency: number
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  severity: 40,
  confidence: 15,
  confirmations: 20,
  size: 10,
  roadImportance: 10,
  recency: 5,
}

const SEVERITY_POINTS: Record<Severity, number> = {
  critical: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
}

const MAX_CONFIRMATIONS_FOR_SCORE = 20
const FRESHNESS_DAYS = 30

function normConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence / 100))
}

export function calculatePriorityScore(
  factors: PriorityFactors,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  const severityPts = SEVERITY_POINTS[factors.severity] * weights.severity
  const confidencePts = normConfidence(factors.confidence) * weights.confidence
  const confirmPts =
    (Math.min(factors.confirmations, MAX_CONFIRMATIONS_FOR_SCORE) / MAX_CONFIRMATIONS_FOR_SCORE) *
    weights.confirmations
  const sizePts = clampScore(factors.sizeFactor * 100) / 100 * weights.size
  const roadPts = clampScore(factors.roadImportance * 10) / 10 * weights.roadImportance
  const recencyPts =
    Math.max(0, 1 - factors.ageDays / FRESHNESS_DAYS) * weights.recency

  const total =
    severityPts + confidencePts + confirmPts + sizePts + roadPts + recencyPts
  return clampScore(total)
}

export function severityPoints(severity: Severity): number {
  return SEVERITY_POINTS[severity]
}

export function severityIndex(severity: Severity): number {
  return SEVERITY_META[severity].index
}
