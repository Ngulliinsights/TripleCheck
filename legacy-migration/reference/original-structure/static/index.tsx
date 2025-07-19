import React from "react";
import { Switch, Route } from "wouter";

// Import static pages
import FeaturesPage from "../features";
import OurStoryPage from "../our-story";
import TeamPage from "../team";
import PartnersPage from "../partners";
import PressMediaPage from "../press-media";
import PricingPage from "../pricing";

/**
 * Static routes module
 * Handles all static/informational page routing
 */
export default function StaticRoutes() {
  return (
    <Switch>
      <Route path="/static/features" component={FeaturesPage} />
      <Route path="/static/our-story" component={OurStoryPage} />
      <Route path="/static/team" component={TeamPage} />
      <Route path="/static/partners" component={PartnersPage} />
      <Route path="/static/press-media" component={PressMediaPage} />
      <Route path="/static/pricing" component={PricingPage} />
      
      {/* Default static page - redirect to features */}
      <Route path="/static">
        {() => {
          window.location.href = "/static/features";
          return null;
        }}
      </Route>
    </Switch>
  );
}