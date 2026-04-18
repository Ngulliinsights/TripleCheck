import React from "react"

import { residentialConfig } from "../../local/config/propertyTypes"
import { PropertyListingRoute } from "../shared/PropertyListingRoute"

export default function PropertiesResidential(): React.ReactElement {
  return (
    <PropertyListingRoute
      config={residentialConfig}
      heroConfig={{
        title: "Residential Properties",
        subtitle:
          "Find your perfect home among Kenya's finest residential properties with verified listings and premium amenities.",
      }}
      className="residential-properties-page"
    />
  )
}

PropertiesResidential.displayName = "PropertiesResidential"