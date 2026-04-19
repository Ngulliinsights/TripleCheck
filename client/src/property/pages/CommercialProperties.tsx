import React from "react"

import { commercialConfig } from "../config/propertyTypes"
import { PropertyListingRoute } from "../shared/PropertyListingRoute"

export default function CommercialProperties(): React.ReactElement {
  return (
    <PropertyListingRoute
      config={commercialConfig}
      heroConfig={{
        title: "Commercial Properties",
        subtitle:
          "Discover premium commercial real estate opportunities across Kenya's prime business locations.",
      }}
      className="commercial-properties-page"
    />
  )
}

CommercialProperties.displayName = "CommercialProperties"