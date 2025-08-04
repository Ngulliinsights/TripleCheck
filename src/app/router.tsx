import { LoadingSpinner } from '../shared/components/ui/LoadingSpinner';
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { LazyRoutes } from './lazy-routes';

/**
 * Comprehensive MVP Router - All Pages Accessible
 * 
 * This router provides access to all pages without authentication barriers
 * for stakeholder presentations and MVP demonstrations.
 * 
 * All routes are organized by domain and fully accessible.
 */

export const AppRouter: React.FC = () => {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <Routes>
        {/* ==========================================
            CORE APPLICATION ROUTES
            ========================================== */}
        <Route path="/" element={<LazyRoutes.Home />} />
        <Route path="/features" element={<LazyRoutes.Features />} />
        <Route path="/pricing" element={<LazyRoutes.Pricing />} />
        <Route path="/about" element={<LazyRoutes.About />} />

        {/* ==========================================
            AUTHENTICATION ROUTES
            ========================================== */}
        <Route path="/login" element={<LazyRoutes.Login />} />
        <Route path="/register" element={<LazyRoutes.Register />} />
        <Route path="/auth/login" element={<LazyRoutes.Login />} />
        <Route path="/auth/register" element={<LazyRoutes.Register />} />
        <Route path="/forgot-password" element={<LazyRoutes.ForgotPassword />} />

        {/* ==========================================
            USER MANAGEMENT ROUTES
            ========================================== */}
        <Route path="/dashboard" element={<LazyRoutes.Dashboard />} />
        <Route path="/profile" element={<LazyRoutes.UserProfile />} />
        <Route path="/settings" element={<LazyRoutes.UserSettings />} />
        <Route path="/team" element={<LazyRoutes.Team />} />
        <Route path="/tenants" element={<LazyRoutes.Tenants />} />

        {/* ==========================================
            PROPERTY MANAGEMENT ROUTES
            ========================================== */}
        <Route path="/properties" element={<LazyRoutes.Properties />} />
        <Route path="/properties/residential" element={<LazyRoutes.PropertiesResidential />} />
        <Route path="/properties/commercial" element={<LazyRoutes.PropertiesCommercial />} />
        <Route path="/properties/land" element={<LazyRoutes.Lands />} />
        <Route path="/property/:id" element={<LazyRoutes.PropertyDetails />} />
        <Route path="/property/:id/edit" element={<LazyRoutes.PropertyEdit />} />
        <Route path="/land/:id" element={<LazyRoutes.LandDetails />} />
        <Route path="/compare" element={<LazyRoutes.PropertyCompare />} />
        <Route path="/list-property" element={<LazyRoutes.ListProperty />} />
        <Route path="/property/wizard" element={<LazyRoutes.PropertyWizard />} />
        <Route path="/property/map" element={<LazyRoutes.PropertyMap />} />
        <Route path="/property/photos" element={<LazyRoutes.PropertyPhotos />} />
        <Route path="/property/optimize" element={<LazyRoutes.PropertyOptimize />} />
        <Route path="/property/verification" element={<LazyRoutes.PropertyVerification />} />
        <Route path="/verify-property" element={<LazyRoutes.VerifyProperty />} />
        <Route path="/property/gallery" element={<LazyRoutes.ImageGallery />} />

        {/* ==========================================
            LAND VERIFICATION ROUTES (Kenya-specific)
            ========================================== */}
        <Route path="/land-verification" element={<LazyRoutes.LandVerification />} />
        <Route path="/land-verification/dashboard" element={<LazyRoutes.LandVerificationDashboard />} />
        <Route path="/land-verification/new" element={<LazyRoutes.NewLandVerification />} />
        <Route path="/verification" element={<LazyRoutes.LandVerification />} />
        <Route path="/verification/:id" element={<LazyRoutes.LandVerification />} />

        {/* ==========================================
            TRUST & FRAUD DETECTION ROUTES
            ========================================== */}
        <Route path="/trust/basic-checks" element={<LazyRoutes.BasicChecks />} />
        <Route path="/trust/fraud-detection" element={<LazyRoutes.FraudDetection />} />
        <Route path="/trust/document-auth" element={<LazyRoutes.DocumentAuth />} />
        <Route path="/trust/reports" element={<LazyRoutes.TrustReports />} />
        <Route path="/trust/alerts" element={<LazyRoutes.TrustAlerts />} />
        <Route path="/trust/karma" element={<LazyRoutes.TrustKarma />} />
        <Route path="/trust/reputation" element={<LazyRoutes.TrustReputation />} />
        <Route path="/trust/points" element={<LazyRoutes.TrustPoints />} />
        <Route path="/trust/reviews" element={<LazyRoutes.TrustReviews />} />
        <Route path="/trust/fraud-protection" element={<LazyRoutes.FraudProtectionInfo />} />
        <Route path="/trust-score" element={<LazyRoutes.TrustPoints />} />

        {/* ==========================================
            COMMUNICATION ROUTES
            ========================================== */}
        <Route path="/inbox" element={<LazyRoutes.Inbox />} />
        <Route path="/messages" element={<LazyRoutes.MessageCenter />} />
        <Route path="/notifications" element={<LazyRoutes.Notifications />} />

        {/* ==========================================
            SEARCH & DISCOVERY ROUTES
            ========================================== */}
        <Route path="/search" element={<LazyRoutes.SearchResults />} />
        <Route path="/advanced-search" element={<LazyRoutes.AdvancedSearch />} />

        {/* ==========================================
            ANALYTICS & REPORTING ROUTES
            ========================================== */}
        <Route path="/analytics" element={<LazyRoutes.Analytics />} />

        {/* ==========================================
            CONTENT & MARKETING ROUTES
            ========================================== */}
        <Route path="/blog" element={<LazyRoutes.Blog />} />
        <Route path="/blog/:slug" element={<LazyRoutes.BlogPost />} />
        <Route path="/blog-test" element={<LazyRoutes.BlogTest />} />
        <Route path="/resources" element={<LazyRoutes.Resources />} />
        <Route path="/community" element={<LazyRoutes.Community />} />
        <Route path="/community-resources" element={<LazyRoutes.CommunityAndResources />} />
        <Route path="/fraud-resources" element={<LazyRoutes.FraudResources />} />
        <Route path="/find-professionals" element={<LazyRoutes.FindProfessionals />} />
        <Route path="/our-story" element={<LazyRoutes.OurStory />} />
        <Route path="/partners" element={<LazyRoutes.Partners />} />
        <Route path="/press" element={<LazyRoutes.PressMedia />} />

        {/* ==========================================
            BUSINESS & DEMO ROUTES
            ========================================== */}
        <Route path="/services" element={<LazyRoutes.Services />} />
        <Route path="/services/basic-checks" element={<LazyRoutes.BasicChecks />} />
        <Route path="/services/fraud-detection" element={<LazyRoutes.FraudDetection />} />
        <Route path="/services/document-auth" element={<LazyRoutes.DocumentAuth />} />
        <Route path="/services/reputation" element={<LazyRoutes.TrustReputation />} />
        <Route path="/services/list-property" element={<LazyRoutes.ListProperty />} />
        <Route path="/solutions" element={<LazyRoutes.Solutions />} />
        <Route path="/solutions/buyers" element={<LazyRoutes.SolutionsBuyers />} />
        <Route path="/solutions/sellers" element={<LazyRoutes.SolutionsSellers />} />
        <Route path="/solutions/agents" element={<LazyRoutes.SolutionsAgents />} />
        <Route path="/solutions/developers" element={<LazyRoutes.SolutionsDevelopers />} />
        <Route path="/solutions/legal-experts" element={<LazyRoutes.SolutionsLegalExperts />} />
        <Route path="/demo" element={<LazyRoutes.Demo />} />
        <Route path="/mvp-demo" element={<LazyRoutes.MVPDemo />} />
        <Route path="/nav-test" element={<LazyRoutes.NavigationTest />} />
        <Route path="/api-demo" element={<LazyRoutes.ApiDemo />} />
        <Route path="/contact-sales" element={<LazyRoutes.ContactSales />} />

        {/* ==========================================
            EXPERT COORDINATION ROUTES
            ========================================== */}
        <Route path="/expert-coordination" element={<LazyRoutes.ExpertCoordination />} />
        <Route path="/physical-verification" element={<LazyRoutes.PhysicalVerification />} />
        <Route path="/community-intelligence" element={<LazyRoutes.CommunityIntelligence />} />

        {/* ==========================================
            LEGAL & SUPPORT ROUTES
            ========================================== */}
        <Route path="/help" element={<LazyRoutes.Help />} />
        <Route path="/help/getting-started" element={<LazyRoutes.GettingStarted />} />
        <Route path="/contact" element={<LazyRoutes.Contact />} />
        <Route path="/privacy" element={<LazyRoutes.Privacy />} />
        <Route path="/terms" element={<LazyRoutes.Terms />} />
        <Route path="/cookies" element={<LazyRoutes.Cookies />} />
        <Route path="/security" element={<LazyRoutes.Security />} />
        <Route path="/static/partners" element={<LazyRoutes.Partners />} />

        {/* ==========================================
            DEVELOPER & ADMIN ROUTES
            ========================================== */}
        <Route path="/dev" element={<LazyRoutes.DeveloperDashboard />} />
        <Route path="/admin" element={<LazyRoutes.AdminDashboard />} />
        <Route path="/monitoring" element={<LazyRoutes.SystemMonitoring />} />

        {/* ==========================================
            ADDITIONAL MISSING ROUTES
            ========================================== */}
        <Route path="/mvp-demo" element={<LazyRoutes.MVPDemo />} />
        <Route path="/fraud-guide" element={<LazyRoutes.FraudResources />} />
        <Route path="/press-media" element={<LazyRoutes.PressMedia />} />

        {/* ==========================================
            SPECIAL ROUTES
            ========================================== */}
        <Route path="/coming-soon" element={<LazyRoutes.ComingSoon />} />

        {/* ==========================================
            DOCUMENT MANAGEMENT ROUTES
            ========================================== */}
        <Route path="/documents" element={<LazyRoutes.DocumentsPage />} />
        <Route path="/documents/upload" element={<LazyRoutes.DocumentUpload />} />
        <Route path="/documents/:id" element={<LazyRoutes.DocumentViewer />} />

        {/* ==========================================
            LOCATION SERVICES ROUTES
            ========================================== */}
        <Route path="/location" element={<LazyRoutes.LocationServices />} />

        {/* ==========================================
            CATCH-ALL ROUTE
            ========================================== */}
        <Route path="*" element={<LazyRoutes.NotFound />} />
      </Routes>
    </Suspense>
  );
};