import React from "react"

import { landConfig } from "../../local/config/propertyTypes"
import { PropertyListingRoute } from "../shared/PropertyListingRoute"

export default function Lands(): React.ReactElement {
  return (
    <PropertyListingRoute
      config={landConfig}
      heroConfig={{
        title: "Land Properties",
        subtitle:
          "Verified land with comprehensive documentation across Kenya.",
      }}
      className="land-properties-page"
    />
  )
}

Lands.displayName = "Lands"