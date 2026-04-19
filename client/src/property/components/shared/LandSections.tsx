/**
 * Shared Land Sections
 *
 * Canonical components for rendering land features and verification data.
 * Consumed by both LandDetails and PropertyDetails to eliminate duplication.
 *
 * Also exports the shared LandFeatures and LandVerificationData types so
 * every consumer uses the same shape (previously each file declared its own).
 */

import { FileCheck, TreePine } from "lucide-react"
import React from "react"

import { Badge } from "../../../local/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../local/components/ui/card"
import { formatDate } from "../../../local/utils/date-utils"
import { NOT_SPECIFIED, getVerificationBadgeVariant } from "../../utils/ui-utils"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface LandFeatures {
  size: string
  soilType: string
  waterAccess: boolean
  roadAccess: boolean
  electricity: boolean
  landUse: "agricultural" | "residential" | "commercial" | "industrial" | "mixed"
  topography: "flat" | "hilly" | "mountainous" | "valley"
  drainage: "excellent" | "good" | "fair" | "poor"
  vegetation?: string
  nearbyAmenities?: string[]
}

export interface LandVerificationData {
  titleDeedStatus: "verified" | "pending" | "missing" | "disputed"
  surveyStatus: "completed" | "pending" | "required"
  boundaryStatus: "clear" | "disputed" | "unmarked"
  landRights: "freehold" | "leasehold" | "customary" | "government"
  encumbrances: string[]
  lastSurveyDate?: string
  surveyorName?: string
  registrationNumber?: string
}

// ---------------------------------------------------------------------------
// LandFeaturesSection
// ---------------------------------------------------------------------------

interface LandFeaturesSectionProps {
  features: LandFeatures
}

export function LandFeaturesSection({ features }: LandFeaturesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreePine className="h-5 w-5" />
          Land Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column — descriptive attributes */}
          <div className="space-y-4">
            {(
              [
                ["Size", features.size],
                ["Soil Type", features.soilType],
                ["Land Use", features.landUse],
                ["Topography", features.topography],
              ] as [string, string | undefined][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium capitalize">
                  {value ?? NOT_SPECIFIED}
                </span>
              </div>
            ))}
          </div>

          {/* Right column — boolean utilities */}
          <div className="space-y-4">
            {(
              [
                ["Water Access", features.waterAccess ? "Available" : "Not Available"],
                ["Road Access", features.roadAccess ? "Yes" : "No"],
                ["Electricity", features.electricity ? "Available" : "Not Available"],
                ["Drainage", features.drainage ?? NOT_SPECIFIED],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {features.vegetation && (
          <div className="mt-4 pt-4 border-t flex justify-between">
            <span className="text-muted-foreground">Vegetation:</span>
            <span className="font-medium">{features.vegetation}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// LandVerificationSection
// ---------------------------------------------------------------------------

interface LandVerificationSectionProps {
  verification: LandVerificationData
}

export function LandVerificationSection({
  verification,
}: LandVerificationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Land Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column — badge statuses */}
          <div className="space-y-4">
            {(
              [
                ["Title Deed", verification.titleDeedStatus],
                ["Survey Status", verification.surveyStatus],
                ["Boundary Status", verification.boundaryStatus],
              ] as [string, string][]
            ).map(([label, status]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <Badge variant={getVerificationBadgeVariant(status)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Right column — text values */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Land Rights:</span>
              <span className="font-medium capitalize">
                {verification.landRights ?? NOT_SPECIFIED}
              </span>
            </div>
            {verification.registrationNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration #:</span>
                <span className="font-medium">
                  {verification.registrationNumber}
                </span>
              </div>
            )}
            {verification.lastSurveyDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Survey:</span>
                <span className="font-medium">
                  {formatDate(verification.lastSurveyDate)}
                </span>
              </div>
            )}
          </div>
        </div>

        {verification.encumbrances.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Encumbrances:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {verification.encumbrances.map(e => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
