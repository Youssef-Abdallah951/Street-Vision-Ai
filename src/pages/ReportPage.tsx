import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Loader2,
  Send,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Input'
import { StepIndicator } from '@/components/report/StepIndicator'
import { ImageUploader } from '@/components/report/ImageUploader'
import { LocationPickerMap } from '@/components/report/LocationPickerMap'
import { DetectionOverlay } from '@/components/ai/DetectionOverlay'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SeverityBadge } from '@/components/ui/badges'
import { analyzeStreetImage } from '@/services/aiDetection'
import { getCurrentPosition } from '@/services/mapProvider'
import { fallbackCenter } from '@/services/mapProvider'
import { useAppStore } from '@/store/app'
import type { DetectionResult, Severity } from '@/types'
import { CATEGORIES, SEVERITIES, SEVERITY_META } from '@/lib/constants'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'photo', label: 'Photo' },
  { id: 'location', label: 'Location' },
  { id: 'ai', label: 'AI Analysis' },
  { id: 'results', label: 'Results' },
  { id: 'details', label: 'Details' },
]

const ANALYZE_ITEMS = [
  'Analyzing image pixels',
  'Detecting objects of interest',
  'Classifying problem type',
  'Estimating severity & size',
]

export function ReportPage() {
  const navigate = useNavigate()
  const submitReport = useAppStore((s) => s.submitReport)
  const toast = useAppStore((s) => s.toast)

  const [step, setStep] = useState(0)
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'located' | 'denied'>('idle')
  const [analysis, setAnalysis] = useState<DetectionResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeTick, setAnalyzeTick] = useState(0)
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState('')
  const submittedRef = useRef(false)

  // Auto-request location when arriving at the location step
  useEffect(() => {
    if (step === 1 && !position && geoStatus === 'idle') {
      setGeoStatus('locating')
      getCurrentPosition()
        .then((pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude])
          setGeoStatus('located')
        })
        .catch(() => {
          setPosition([fallbackCenter.lat, fallbackCenter.lng])
          setGeoStatus('denied')
        })
    }
  }, [step, position, geoStatus])

  // Kick off AI analysis when entering the analysis step
  useEffect(() => {
    if (step === 2 && image && !analysis && !analyzing) {
      setAnalyzing(true)
      setAnalyzeTick(0)
      analyzeStreetImage(image)
        .then((res) => {
          setAnalysis(res)
          setAnalyzing(false)
          setStep(3)
        })
        .catch(() => {
          setAnalyzing(false)
          toast('Analysis failed', 'Could not analyze the image. Please try again.', 'error')
          setStep(1)
        })
    }
  }, [step, image, analysis, analyzing, toast])

  // Animated ticker while analyzing
  useEffect(() => {
    if (!analyzing) return
    const t = setInterval(() => setAnalyzeTick((v) => v + 1), 700)
    return () => clearInterval(t)
  }, [analyzing])

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(image)
    if (step === 1) return Boolean(position)
    if (step === 2) return Boolean(analysis)
    if (step === 3) return Boolean(analysis)
    if (step === 4) return true
    return false
  }, [step, image, position, analysis])

  const submit = async () => {
    if (!analysis || !position || !image || submittedRef.current) return
    submittedRef.current = true
    setSubmitError('')
    try {
      const id = await submitReport({
        imageFile,
        category: analysis.category,
        description: description.trim() || undefined,
        severity: analysis.severity,
        confidence: analysis.confidence,
        lat: position[0],
        lng: position[1],
        address: undefined,
        detection: analysis,
      })
      toast('Report submitted', 'AI verified. A maintenance team has been notified.')
      navigate(`/reports/${id}`, { replace: true })
    } catch {
      setSubmitError('Could not submit the report. Please try again.')
      submittedRef.current = false
    }
  }

  const activeItem = ANALYZE_ITEMS[analyzeTick % ANALYZE_ITEMS.length]

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Report a Problem"
        description="Snap a photo, pin the spot, and let AI route it to the right team."
      />

      <div className="mt-8">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <Card className="mt-6">
        <CardContent className="p-5 sm:p-8">
          {/* Step 0 — Photo */}
          {step === 0 && (
            <div className="animate-fade-in">
              <CardTitle className="text-lg">Step 1 · Capture the problem</CardTitle>
              <CardDescription className="mt-1">
                Take a photo from the street or upload an existing image. Make sure the problem is clearly visible.
              </CardDescription>
              <div className="mt-5">
                <ImageUploader value={image} onChange={setImage} onFileChange={setImageFile} />
              </div>
            </div>
          )}

          {/* Step 1 — Location */}
          {step === 1 && (
            <div className="animate-fade-in">
              <CardTitle className="text-lg">Step 2 · Pin the exact location</CardTitle>
              <CardDescription className="mt-1">
                {geoStatus === 'locating' ? 'Requesting your location…' : 'We automatically detected your location. Drag the pin to fine-tune it.'}
              </CardDescription>
              <div className="mt-5">
                {position ? (
                  <LocationPickerMap position={position} onChange={setPosition} />
                ) : (
                  <div className="flex h-[340px] items-center justify-center rounded-2xl border border-surface-200 dark:border-surface-700">
                    <div className="flex flex-col items-center gap-2 text-surface-400">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm">Requesting location permission…</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Analyzing */}
          {step === 2 && image && (
            <div className="animate-fade-in">
              <CardTitle className="text-lg">AI is analyzing your photo</CardTitle>
              <CardDescription className="mt-1">
                StreetVision Vision is detecting the problem type, severity and size.
              </CardDescription>
              <div className="mt-6">
                <div className="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700">
                  <img src={image} alt="Analyzing" className="max-h-[380px] w-full object-cover" />
                  <div className="pointer-events-none absolute inset-x-0 h-16 animate-scan-line bg-gradient-to-b from-transparent via-brand-400/40 to-transparent" style={{ animation: 'scan-line 1.8s linear infinite' }} />
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-950/30">
                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 px-8 py-5 shadow-lift backdrop-blur dark:bg-surface-900/90">
                      <Sparkles className="h-8 w-8 animate-pulse text-brand-500" />
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{activeItem}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Results */}
          {step === 3 && analysis && image && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Step 4 · AI Detection Results</CardTitle>
              </div>
              <CardDescription className="mt-1">
                AI found a problem with {analysis.confidence}% confidence. Review and correct if needed.
              </CardDescription>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <DetectionOverlay
                  imageUrl={image}
                  detections={analysis.detections}
                  className="rounded-xl"
                />

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-surface-200 p-3.5 dark:border-surface-700">
                      <p className="text-xs text-surface-400">Problem</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-surface-900 dark:text-white">
                        {analysis.label}
                      </p>
                    </div>
                    <div className="rounded-xl border border-surface-200 p-3.5 dark:border-surface-700">
                      <p className="text-xs text-surface-400">Estimated size</p>
                      <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-white">
                        {analysis.estimatedSize ?? 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-surface-600 dark:text-surface-300">Confidence</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{analysis.confidence}%</span>
                    </div>
                    <ProgressBar value={analysis.confidence} className="mt-2" />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-surface-600 dark:text-surface-300">Severity</p>
                    <div className="flex flex-wrap gap-2">
                      {SEVERITIES.map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setAnalysis((a) => (a ? { ...a, severity: s as Severity } : a))
                          }
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                            analysis.severity === s
                              ? 'border-transparent text-white shadow-soft'
                              : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300',
                          )}
                          style={analysis.severity === s ? { background: `var(--sv-severity-${s})` } : undefined}
                        >
                          {SEVERITY_META[s].label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <SeverityBadge severity={analysis.severity} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-600 dark:text-surface-300">
                      Did AI get it wrong?
                    </label>
                    <Select
                      value={analysis.category}
                      onChange={(e) =>
                        setAnalysis((a) =>
                          a
                            ? {
                                ...a,
                                category: e.target.value as DetectionResult['category'],
                                label: e.target.value.replace('-', ' '),
                              }
                            : a,
                        )
                      }
                      className="mt-2"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <p className="rounded-xl bg-surface-50 px-4 py-3 text-sm leading-relaxed text-surface-600 dark:bg-surface-800/60 dark:text-surface-300">
                    {analysis.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Details */}
          {step === 4 && analysis && position && image && (
            <div className="animate-fade-in">
              <CardTitle className="text-lg">Step 5 · Add details & submit</CardTitle>
              <CardDescription className="mt-1">
                Optionally add context to help the maintenance team. Then submit your report.
              </CardDescription>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <Textarea
                    label="Description (optional)"
                    placeholder="e.g. The pothole is right next to the bus stop and cars have to swerve around it."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={400}
                  />
                  <div className="rounded-xl border border-surface-200 p-4 dark:border-surface-700">
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-200">Contact & privacy</p>
                    <p className="mt-1 text-xs leading-relaxed text-surface-400">
                      Your report is posted with your location only. Your exact identity is kept private from
                      the public feed.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
                    <img src={image} alt="Report summary" className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-surface-900 dark:text-white">
                          {analysis.label}
                        </p>
                        <p className="text-xs text-surface-400">AI confidence {analysis.confidence}%</p>
                      </div>
                      <SeverityBadge severity={analysis.severity} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-3 text-sm text-surface-600 dark:border-surface-700 dark:text-surface-300">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                    <span className="truncate">
                      {position[0].toFixed(5)}, {position[1].toFixed(5)}
                    </span>
                  </div>
                  {submitError && (
                    <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      {submitError}
                    </p>
                  )}
                  <Button
                    size="lg"
                    className="mt-auto w-full"
                    onClick={submit}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Submit report
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between border-t border-surface-100 pt-5 dark:border-surface-800">
            <Button
              variant="ghost"
              onClick={() => {
                setStep((s) => Math.max(0, s - 1))
                setSubmitError('')
              }}
              disabled={step === 0}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              {step === 4 && (
                <Button variant="ghost" onClick={() => { setStep(0); setAnalysis(null); setImage(null); setImageFile(null); setPosition(null); setGeoStatus('idle'); submittedRef.current = false; }} leftIcon={<RotateCcw className="h-4 w-4" />}>
                  Start over
                </Button>
              )}
              {step < 4 && (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {step === 0 ? 'Continue' : step === 1 ? 'Analyze photo' : 'Continue'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}