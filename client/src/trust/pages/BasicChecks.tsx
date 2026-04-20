import React, { useState, useCallback, useMemo } from 'react'
import {
  Shield,
  Search,
  FileText,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Paperclip,
} from 'lucide-react'

import { Button } from '../../local/components/ui/button'
import { Input } from '../../local/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Badge } from '../../local/components/ui/badge'
import { Textarea } from '../../local/components/ui/textarea'
import { Label } from '../../local/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../local/components/ui/select'
import { useToast } from '../../local/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = 'pending' | 'passed' | 'failed' | 'warning'
type ActiveTab = 'new' | 'existing'

interface VerificationCheck {
  id: string
  name: string
  description: string
  status: CheckStatus
  details?: string
  icon: React.ComponentType<{ className?: string }>
}

interface VerificationRequest {
  propertyAddress: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  documentType: string
  additionalInfo: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM: VerificationRequest = {
  propertyAddress: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  documentType: '',
  additionalInfo: '',
}

const INITIAL_CHECKS: VerificationCheck[] = [
  {
    id: 'ownership',
    name: 'Ownership Verification',
    description: 'Verify property ownership documents and title deed',
    status: 'pending',
    icon: FileText,
  },
  {
    id: 'identity',
    name: 'Owner Identity Check',
    description: 'Verify owner identity against national ID database',
    status: 'pending',
    icon: User,
  },
  {
    id: 'location',
    name: 'Property Location',
    description: 'Confirm property exists at the specified address',
    status: 'pending',
    icon: MapPin,
  },
  {
    id: 'legal',
    name: 'Legal Status Check',
    description: 'Check for any legal disputes or encumbrances',
    status: 'pending',
    icon: Shield,
  },
  {
    id: 'contact',
    name: 'Contact Verification',
    description: 'Verify owner contact information',
    status: 'pending',
    icon: Phone,
  },
]

const DOCUMENT_TYPES = [
  { value: 'title-deed', label: 'Title Deed' },
  { value: 'lease-agreement', label: 'Lease Agreement' },
  { value: 'sale-agreement', label: 'Sale Agreement' },
  { value: 'survey-plan', label: 'Survey Plan' },
  { value: 'id-copy', label: 'ID Copy' },
  { value: 'other', label: 'Other Document' },
] as const

// Mock results used by both search and runAllChecks
const MOCK_CHECK_RESULTS: Record<string, { status: CheckStatus; details: string }> = {
  ownership: { status: 'passed', details: 'Title deed verified and authentic.' },
  identity: { status: 'passed', details: 'Owner identity confirmed.' },
  location: { status: 'warning', details: 'Property address needs minor clarification.' },
  legal: { status: 'passed', details: 'No legal disputes found.' },
  contact: { status: 'failed', details: 'Phone number could not be verified.' },
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CheckStatus,
  { icon: React.ReactNode; badgeClass: string; label: string }
> = {
  passed: {
    icon: <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />,
    badgeClass: 'bg-green-100 text-green-800',
    label: 'Passed',
  },
  failed: {
    icon: <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />,
    badgeClass: 'bg-red-100 text-red-800',
    label: 'Failed',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" aria-hidden="true" />,
    badgeClass: 'bg-yellow-100 text-yellow-800',
    label: 'Warning',
  },
  pending: {
    icon: <Clock className="w-5 h-5 text-gray-400" aria-hidden="true" />,
    badgeClass: 'bg-gray-100 text-gray-600',
    label: 'Pending',
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckRow({ check }: { check: VerificationCheck }) {
  const { icon: statusIcon, badgeClass, label } = STATUS_CONFIG[check.status]
  const IconComponent = check.icon

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/40"
      role="listitem"
    >
      <div className="p-2 bg-muted rounded-full shrink-0">
        <IconComponent className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm">{check.name}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {statusIcon}
            <Badge className={badgeClass}>{label}</Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{check.description}</p>

        {check.details && (
          <p className="mt-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
            {check.details}
          </p>
        )}
      </div>
    </div>
  )
}

function StatusStat({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${colorClass ?? ''}`}>{value}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BasicChecks() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ActiveTab>('new')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunningChecks, setIsRunningChecks] = useState(false)
  const [checks, setChecks] = useState<VerificationCheck[]>(INITIAL_CHECKS)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<VerificationRequest>(INITIAL_FORM)

  // ── Derived state ──────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    completed: checks.filter((c) => c.status !== 'pending').length,
    passed: checks.filter((c) => c.status === 'passed').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    failed: checks.filter((c) => c.status === 'failed').length,
  }), [checks])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateFormData = useCallback(
    <K extends keyof VerificationRequest>(key: K, value: VerificationRequest[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetChecks = useCallback(() => {
    setChecks(INITIAL_CHECKS.map((c) => ({ ...c, status: 'pending', details: undefined })))
  }, [])

  const applyMockResults = useCallback(() => {
    setChecks((prev) =>
      prev.map((check) => {
        const result = MOCK_CHECK_RESULTS[check.id]
        return result ? { ...check, ...result } : check
      })
    )
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmitVerification = useCallback(async () => {
    if (!formData.propertyAddress || !formData.ownerName || !formData.documentType) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in the property address, owner name, and document type.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { formService } = await import('../../local/services/FormService')
      const result = await formService.submitVerificationRequest(formData)

      if (result.success) {
        resetChecks()
        setFormData(INITIAL_FORM)
        toast({
          title: 'Verification submitted',
          description: 'Your request has been submitted and checks are now queued.',
        })
      }
    } catch {
      toast({
        title: 'Submission failed',
        description: 'Failed to submit verification request. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, resetChecks, toast])

  const handleSearchExisting = useCallback(async () => {
    const query = searchQuery.trim()
    if (!query) {
      toast({
        title: 'Enter search criteria',
        description: 'Please enter a property ID or address to search.',
        variant: 'destructive',
      })
      return
    }

    applyMockResults()
    toast({
      title: 'Verification results loaded',
      description: `Found results for "${query}".`,
    })
  }, [searchQuery, applyMockResults, toast])

  const runAllChecks = useCallback(async () => {
    if (isRunningChecks) return
    setIsRunningChecks(true)
    resetChecks()

    for (let i = 0; i < INITIAL_CHECKS.length; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 800))
      const checkId = INITIAL_CHECKS[i].id
      const result = MOCK_CHECK_RESULTS[checkId]

      setChecks((prev) =>
        prev.map((check) =>
          check.id === checkId
            ? {
                ...check,
                status: result?.status ?? 'passed',
                details: result?.details ?? `Completed at ${new Date().toLocaleTimeString()}`,
              }
            : check
        )
      )
    }

    setIsRunningChecks(false)
    toast({ title: 'All checks completed', description: 'Basic verification checks are done.' })
  }, [isRunningChecks, resetChecks, toast])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" aria-hidden="true" />
            Basic Property Checks
          </h1>
          <p className="text-muted-foreground">
            Perform essential verification checks on property ownership, location, and legal status.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8" role="tablist" aria-label="Verification tabs">
          {([
            { id: 'new', label: 'New Verification', icon: <Upload className="w-4 h-4" /> },
            { id: 'existing', label: 'Check Existing', icon: <Search className="w-4 h-4" /> },
          ] as const).map(({ id, label, icon }) => (
            <Button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              variant={activeTab === id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2"
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tab Panel */}
            <div role="tabpanel" aria-label={activeTab === 'new' ? 'New Verification' : 'Check Existing'}>
              {activeTab === 'new' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit New Verification Request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="property-address">
                          Property Address <span aria-hidden="true" className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="property-address"
                          placeholder="Enter complete property address"
                          value={formData.propertyAddress}
                          onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                          rows={3}
                          required
                          aria-required="true"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="document-type">
                          Document Type <span aria-hidden="true" className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.documentType}
                          onValueChange={(value) => updateFormData('documentType', value)}
                        >
                          <SelectTrigger id="document-type" aria-required="true">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="owner-name">
                          Owner Name <span aria-hidden="true" className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="owner-name"
                          placeholder="Full name as on documents"
                          value={formData.ownerName}
                          onChange={(e) => updateFormData('ownerName', e.target.value)}
                          required
                          aria-required="true"
                          autoComplete="name"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="owner-phone">Phone Number</Label>
                        <Input
                          id="owner-phone"
                          type="tel"
                          placeholder="+254 7XX XXX XXX"
                          value={formData.ownerPhone}
                          onChange={(e) => updateFormData('ownerPhone', e.target.value)}
                          autoComplete="tel"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="owner-email">Email Address</Label>
                        <Input
                          id="owner-email"
                          type="email"
                          placeholder="owner@example.com"
                          value={formData.ownerEmail}
                          onChange={(e) => updateFormData('ownerEmail', e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="additional-info">Additional Information</Label>
                      <Textarea
                        id="additional-info"
                        placeholder="Any additional details that might help with verification"
                        value={formData.additionalInfo}
                        onChange={(e) => updateFormData('additionalInfo', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleSubmitVerification}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Upload className="w-4 h-4" aria-hidden="true" />
                        )}
                        {isSubmitting ? 'Submitting…' : 'Submit for Verification'}
                      </Button>

                      <Button variant="outline" className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" aria-hidden="true" />
                        Attach Documents
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Search Existing Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Property ID, address, or owner name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchExisting()}
                        aria-label="Search query"
                        className="flex-1"
                      />
                      <Button onClick={handleSearchExisting} className="flex items-center gap-2">
                        <Search className="w-4 h-4" aria-hidden="true" />
                        Search
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Search by property ID (e.g.{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">PROP-123</code>),
                      full address, or owner name. Press Enter to search.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Verification Checks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Verification Checks</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runAllChecks}
                    disabled={isRunningChecks}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRunningChecks ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    {isRunningChecks ? 'Running…' : 'Run All Checks'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" role="list" aria-label="Verification check results">
                  {checks.map((check) => (
                    <CheckRow key={check.id} check={check} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusStat
                  label={`Completed (of ${checks.length})`}
                  value={stats.completed}
                />
                <div className="border-t pt-3 space-y-3">
                  <StatusStat label="Passed" value={stats.passed} colorClass="text-green-600" />
                  <StatusStat label="Warnings" value={stats.warnings} colorClass="text-yellow-600" />
                  <StatusStat label="Failed" value={stats.failed} colorClass="text-red-600" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: <Download className="w-4 h-4" />, label: 'Download Report' },
                  { icon: <Mail className="w-4 h-4" />, label: 'Email Results' },
                  { icon: <Eye className="w-4 h-4" />, label: 'View Full Report' },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Schedule Follow-up' },
                ].map(({ icon, label }) => (
                  <Button
                    key={label}
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    {React.cloneElement(icon, { 'aria-hidden': true })}
                    {label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our verification process typically takes 24–48 hours to complete.
                </p>
                <div className="space-y-1">
                  {[
                    { emoji: '📋', label: 'Verification Guide' },
                    { emoji: '📞', label: 'Contact Support' },
                    { emoji: '❓', label: 'FAQ' },
                  ].map(({ emoji, label }) => (
                    <Button
                      key={label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <span aria-hidden="true">{emoji}</span>
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}