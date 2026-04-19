/**
 * Document Authentication — data layer
 *
 * Architecture
 * ────────────
 * • Query hooks are top-level exports — composable anywhere without violating
 *   the Rules of Hooks.
 * • useDocumentAuthentication owns mutations only. Components compose it with
 *   whichever query hooks they need.
 * • Utility/formatting helpers are module-level pure functions — no hook needed,
 *   no closure cost, fully tree-shakeable.
 * • TanStack Query v5 API throughout: isPending (not isLoading).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { useCallback } from "react"

import { apiClient } from "../../local/services/unified-api-client"

// ─── Domain types ──────────────────────────────────────────────────────────────

export type ProcessingStatus = "processing" | "completed" | "not_found"

export interface DocumentVerificationRequest {
  id: string
  file: File
  filename: string
  mimeType: string
  size: number
  uploadedAt: Date
  userId?: string
  propertyId?: string
}

export interface DocumentVerificationResult {
  id: string
  documentId: string
  overallScore: number
  status: "authentic" | "suspicious" | "forged"
  confidence: number
  checks: VerificationCheck[]
  metadata: DocumentMetadata
  processedAt: Date
  processingTime: number
  riskFactors: RiskFactor[]
  recommendations: string[]
  landSpecificData?: LandDocumentData
}

export interface VerificationCheck {
  type: "metadata" | "visual" | "signature" | "content" | "format"
  name: string
  status: "pass" | "fail" | "warning"
  score: number
  description: string
  details: string[]
  confidence: number
  processingTime: number
}

export interface DocumentMetadata {
  creationDate?: Date
  modificationDate?: Date
  author?: string
  software?: string
  version?: string
  pageCount?: number
  fileSize: number
  hash: string
  digitalSignature?: boolean
  compressionRatio?: number
  colorProfile?: string
  resolution?: { width: number; height: number; dpi: number }
  fonts?: string[]
  embeddedObjects?: number
}

export interface RiskFactor {
  category: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  evidence: string[]
}

export interface LandDocumentData {
  documentType: "title_deed" | "sale_agreement" | "survey_plan" | "compliance_certificate"
  propertyDetails: {
    plotNumber?: string
    location?: string
    size?: string
    coordinates?: string
  }
  ownershipDetails: {
    currentOwner?: string
    previousOwners?: string[]
    ownershipType?: string
  }
  legalStatus: {
    registrationNumber?: string
    registrationDate?: Date
    expiryDate?: Date
    restrictions?: string[]
  }
  verificationMarkers: {
    officialSeals: boolean
    watermarks: boolean
    securityFeatures: boolean
    signatures: boolean
  }
}

export interface SystemStats {
  totalProcessed: number
  currentlyProcessing: number
  statusDistribution: {
    authentic: number
    suspicious: number
    forged: number
  }
  averageProcessingTime: number
  averageScore: number
  uptime: number
  lastProcessed: Date | null
}

// ─── Query key factory ─────────────────────────────────────────────────────────

export const docAuthKeys = {
  all:     ["document-auth"] as const,
  result:  (documentId: string) =>
    [...docAuthKeys.all, "result",  documentId] as const,
  status:  (documentId: string) =>
    [...docAuthKeys.all, "status",  documentId] as const,
  stats:   () =>
    [...docAuthKeys.all, "stats"] as const,
  history: (userId: string, opts?: { limit?: number; offset?: number }) =>
    [...docAuthKeys.all, "history", userId, opts] as const,
  recent:  (limit: number) =>
    [...docAuthKeys.all, "recent",  limit] as const,
} as const

// ─── Query hooks (top-level — composable anywhere) ────────────────────────────

export function useVerificationResult(
  documentId: string,
  options?: Partial<UseQueryOptions<DocumentVerificationResult>>
) {
  return useQuery<DocumentVerificationResult>({
    queryKey: docAuthKeys.result(documentId),
    queryFn:  async () => {
      const res = await apiClient.get<DocumentVerificationResult>(
        `/api/document-auth/results/${documentId}`
      )
      return res.data
    },
    enabled: Boolean(documentId),
    ...options,
  })
}

export function useProcessingStatus(
  documentId: string,
  options?: Partial<UseQueryOptions<ProcessingStatus>>
) {
  return useQuery<ProcessingStatus>({
    queryKey: docAuthKeys.status(documentId),
    queryFn:  async () => {
      const res = await apiClient.get<{ status: ProcessingStatus }>(
        `/api/document-auth/status/${documentId}`
      )
      return res.data.status
    },
    enabled: Boolean(documentId),
    // Poll every 2 s while the document is still processing; stop once done.
    refetchInterval: (query) =>
      query.state.data === "processing" ? 2_000 : false,
    ...options,
  })
}

export function useDocumentAuthStats(
  options?: Partial<UseQueryOptions<SystemStats>>
) {
  return useQuery<SystemStats>({
    queryKey: docAuthKeys.stats(),
    queryFn:  async () => {
      const res = await apiClient.get<SystemStats>("/api/document-auth/stats")
      return res.data
    },
    refetchInterval: 30_000,
    ...options,
  })
}

export function useDocumentHistory(
  userId: string,
  opts?: { limit?: number; offset?: number },
  options?: Partial<UseQueryOptions<DocumentVerificationResult[]>>
) {
  return useQuery<DocumentVerificationResult[]>({
    queryKey: docAuthKeys.history(userId, opts),
    queryFn:  async () => {
      const p = new URLSearchParams()
      if (opts?.limit)  p.append("limit",  String(opts.limit))
      if (opts?.offset) p.append("offset", String(opts.offset))
      const qs = p.toString() ? `?${p}` : ""
      const res = await apiClient.get<DocumentVerificationResult[]>(
        `/api/document-auth/history/${userId}${qs}`
      )
      return res.data
    },
    enabled: Boolean(userId),
    ...options,
  })
}

export function useRecentVerifications(
  limit = 10,
  options?: Partial<UseQueryOptions<DocumentVerificationResult[]>>
) {
  return useQuery<DocumentVerificationResult[]>({
    queryKey: docAuthKeys.recent(limit),
    queryFn:  async () => {
      const res = await apiClient.get<DocumentVerificationResult[]>(
        `/api/document-auth/recent?limit=${limit}`
      )
      return res.data
    },
    ...options,
  })
}

// ─── Utility functions (pure — no hook dependency) ────────────────────────────

export function getDocumentTypeIcon(
  documentType?: LandDocumentData["documentType"]
): string {
  switch (documentType) {
    case "title_deed":            return "📜"
    case "sale_agreement":        return "📋"
    case "survey_plan":           return "🗺️"
    case "compliance_certificate": return "✅"
    default:                       return "📄"
  }
}

export function getStatusColor(
  status: DocumentVerificationResult["status"]
): string {
  switch (status) {
    case "authentic":  return "text-green-600"
    case "suspicious": return "text-yellow-600"
    case "forged":     return "text-red-600"
    default:           return "text-gray-600"
  }
}

export function getStatusBadgeVariant(
  status: DocumentVerificationResult["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "authentic":  return "default"
    case "suspicious": return "secondary"
    case "forged":     return "destructive"
    default:           return "outline"
  }
}

export function getSeverityColor(severity: RiskFactor["severity"]): string {
  switch (severity) {
    case "low":      return "text-blue-600"
    case "medium":   return "text-yellow-600"
    case "high":     return "text-orange-600"
    case "critical": return "text-red-600"
    default:         return "text-gray-600"
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k  = 1_024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i  = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatProcessingTime(ms: number): string {
  if (ms < 1_000)  return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

// ─── Mutation hook ────────────────────────────────────────────────────────────

export function useDocumentAuthentication() {
  const queryClient = useQueryClient()

  // ── Verify document ────────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: async (file: File): Promise<DocumentVerificationResult> => {
      const formData = new FormData()
      formData.append("document",   file)
      formData.append("filename",   file.name)
      formData.append("mimeType",   file.type)
      formData.append("size",       String(file.size))
      formData.append("uploadedAt", new Date().toISOString())

      const res = await apiClient.post<DocumentVerificationResult>(
        "/api/document-auth/verify",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      return res.data
    },
    onSuccess: (result) => {
      queryClient.setQueryData(docAuthKeys.result(result.documentId), result)
      queryClient.invalidateQueries({ queryKey: docAuthKeys.stats() })
    },
  })

  // ── Clear old results ──────────────────────────────────────────────────────

  const clearMutation = useMutation({
    mutationFn: async (olderThan?: Date): Promise<number> => {
      const qs  = olderThan ? `?olderThan=${olderThan.toISOString()}` : ""
      const res = await apiClient.delete<{ cleared: number }>(
        `/api/document-auth/results${qs}`
      )
      return res.data.cleared
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docAuthKeys.all })
    },
  })

  // ── Stable public wrappers ─────────────────────────────────────────────────

  const verifyDocument = useCallback(
    (file: File): Promise<DocumentVerificationResult> =>
      verifyMutation.mutateAsync(file),
    [verifyMutation]
  )

  const clearOldResults = useCallback(
    (olderThan?: Date): Promise<number> =>
      clearMutation.mutateAsync(olderThan),
    [clearMutation]
  )

  return {
    // Mutations
    verifyDocument,
    clearOldResults,

    // Granular loading flags
    isVerifying: verifyMutation.isPending,
    isClearing:  clearMutation.isPending,

    // Combined convenience flag
    isLoading: verifyMutation.isPending || clearMutation.isPending,

    // First error across any mutation (null when all clear)
    error: verifyMutation.error ?? clearMutation.error,
  }
}

export default useDocumentAuthentication