/**
 * PropertyListingRoute
 *
 * Single reusable wrapper that powers every category listing page
 * (Residential, Commercial, Land). Previously each page was a ~50-line
 * file with identical structure; now the shared logic lives here and each
 * route file is reduced to a 10-line default export.
 */

import React, { useCallback, useState } from "react"

import { PropertyListingPage } from "../PropertyListingPage"
import type { PropertyTypeConfig } from "@shared/types/property"
import { CompareBar } from "../CompareBar"
import { CompareModal } from "../CompareModal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeroConfig {
  title: string
  subtitle: string
}

interface PropertyListingRouteProps {
  config: PropertyTypeConfig<any, any>
  heroConfig: HeroConfig
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PropertyListingRoute({
  config,
  heroConfig,
  className,
}: PropertyListingRouteProps) {
  const [showCompareModal, setShowCompareModal] = useState(false)

  const openCompareModal = useCallback(() => setShowCompareModal(true), [])
  const closeCompareModal = useCallback(() => setShowCompareModal(false), [])

  return (
    <>
      <PropertyListingPage
        config={config}
        enableCompare
        enablePhotoManagement
        heroConfig={heroConfig}
        className={className}
      />

      {/* Floating compare UI — rendered outside the listing page so it can
          overlay without affecting the scroll container */}
      <CompareBar onQuickCompare={openCompareModal} />
      <CompareModal isOpen={showCompareModal} onClose={closeCompareModal} />
    </>
  )
}
