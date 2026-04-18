/**
 * ListProperty — Seller entry point for listing a new property.
 *
 * Routes directly to UnifiedPropertyWizard which:
 *  1. Requests property document upload (title deed, survey plan, etc.)
 *  2. Extracts data via OCR (PropertyDocumentIntegration.ts)
 *  3. Auto-populates form fields (bedrooms, area, location, etc.)
 *  4. User reviews / edits extracted data
 *  5. Submits the verified property listing
 *
 * NOTE: This differs from PropertyWizard.tsx (admin/internal tool) in that
 * it uses the default wizard configuration and wraps it in the seller-facing
 * page shell. If you need to customise wizard behaviour, pass `config` to
 * UnifiedPropertyWizard from PropertyWizard.tsx instead.
 */

import React from "react"

import { UnifiedPropertyWizard } from "../components/wizard/UnifiedPropertyWizard"

export default function ListPropertyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            List Your Property
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Get your property verified and listed with intelligent document
            processing
          </p>
        </div>

        <UnifiedPropertyWizard />
      </div>
    </div>
  )
}