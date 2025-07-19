import React from "react";
import { Switch, Route } from "wouter";

// Import all service pages
import AlertsPage from "./alerts";
import BasicChecksPage from "./basic-checks";
import DocumentAuthPage from "./document-auth";
import FraudDetectionPage from "./fraud-detection";
import KarmaPage from "./karma";
import ListPropertyPage from "./list-property";
import ReportsPage from "./reports";
import ReputationPage from "./reputation";
import ResourcesPage from "./resources";
import ReviewsPage from "./reviews";
import TenantsPage from "./tenants";
import TrustPointsPage from "./trust-points";

/**
 * Services routes module
 * Handles all service-related routing with proper nested structure
 */
export default function ServicesRoutes() {
  return (
    <Switch>
      {/* Property Verification Services */}
      <Route path="/services/basic-checks" component={BasicChecksPage} />
      <Route path="/services/document-auth" component={DocumentAuthPage} />
      <Route path="/services/fraud-detection" component={FraudDetectionPage} />
      
      {/* Community Trust Network */}
      <Route path="/services/reviews" component={ReviewsPage} />
      <Route path="/services/trust-points" component={TrustPointsPage} />
      <Route path="/services/karma" component={KarmaPage} />
      
      {/* Market Insights */}
      <Route path="/services/reports" component={ReportsPage} />
      <Route path="/services/alerts" component={AlertsPage} />
      <Route path="/services/resources" component={ResourcesPage} />
      
      {/* For Landlords & Agents */}
      <Route path="/services/list-property" component={ListPropertyPage} />
      <Route path="/services/reputation" component={ReputationPage} />
      <Route path="/services/tenants" component={TenantsPage} />
      
      {/* Default services page - redirect to basic checks */}
      <Route path="/services">
        {() => {
          window.location.href = "/services/basic-checks";
          return null;
        }}
      </Route>
    </Switch>
  );
}