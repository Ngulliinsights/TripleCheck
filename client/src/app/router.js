"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRouter = void 0;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var LoadingSpinner_1 = require("../local/components/ui/LoadingSpinner");
var lazy_routes_1 = require("./lazy-routes");
/**
 * Comprehensive MVP Router - All Pages Accessible
 *
 * This router provides access to all pages without authentication barriers
 * for stakeholder presentations and MVP demonstrations.
 *
 * All routes are organized by domain and fully accessible.
 */
var AppRouter = function () {
    return (<react_1.Suspense fallback={<div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner_1.LoadingSpinner size="lg"/>
        </div>}>
      <react_router_dom_1.Routes>
        {/* ==========================================
            CORE APPLICATION ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/" element={<lazy_routes_1.LazyRoutes.Home />}/>
        <react_router_dom_1.Route path="/features" element={<lazy_routes_1.LazyRoutes.Features />}/>
        <react_router_dom_1.Route path="/pricing" element={<lazy_routes_1.LazyRoutes.Pricing />}/>
        <react_router_dom_1.Route path="/about" element={<lazy_routes_1.LazyRoutes.About />}/>

        {/* ==========================================
            AUTHENTICATION ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/login" element={<lazy_routes_1.LazyRoutes.Login />}/>
        <react_router_dom_1.Route path="/register" element={<lazy_routes_1.LazyRoutes.Register />}/>
        <react_router_dom_1.Route path="/auth/login" element={<lazy_routes_1.LazyRoutes.Login />}/>
        <react_router_dom_1.Route path="/auth/register" element={<lazy_routes_1.LazyRoutes.Register />}/>
        <react_router_dom_1.Route path="/forgot-password" element={<lazy_routes_1.LazyRoutes.ForgotPassword />}/>

        {/* ==========================================
            USER MANAGEMENT ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/dashboard" element={<lazy_routes_1.LazyRoutes.Dashboard />}/>
        <react_router_dom_1.Route path="/profile" element={<lazy_routes_1.LazyRoutes.UserProfile />}/>
        <react_router_dom_1.Route path="/settings" element={<lazy_routes_1.LazyRoutes.UserSettings />}/>
        <react_router_dom_1.Route path="/team" element={<lazy_routes_1.LazyRoutes.Team />}/>
        <react_router_dom_1.Route path="/tenants" element={<lazy_routes_1.LazyRoutes.Tenants />}/>
        <react_router_dom_1.Route path="/activity" element={<lazy_routes_1.LazyRoutes.Activity />}/>

        {/* ==========================================
            PROPERTY MANAGEMENT ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/properties" element={<lazy_routes_1.LazyRoutes.Properties />}/>
        <react_router_dom_1.Route path="/properties/residential" element={<lazy_routes_1.LazyRoutes.PropertiesResidential />}/>
        <react_router_dom_1.Route path="/properties/commercial" element={<lazy_routes_1.LazyRoutes.PropertiesCommercial />}/>
        <react_router_dom_1.Route path="/properties/land" element={<lazy_routes_1.LazyRoutes.Lands />}/>
        <react_router_dom_1.Route path="/property/:id" element={<lazy_routes_1.LazyRoutes.PropertyDetails />}/>
        <react_router_dom_1.Route path="/property/:id/edit" element={<lazy_routes_1.LazyRoutes.PropertyEdit />}/>
        {/* Redirect legacy land routes to unified property route */}
        <react_router_dom_1.Route path="/land/:id" element={<lazy_routes_1.LazyRoutes.LandRedirect />}/>
        <react_router_dom_1.Route path="/compare" element={<lazy_routes_1.LazyRoutes.PropertyCompare />}/>
        <react_router_dom_1.Route path="/list-property" element={<lazy_routes_1.LazyRoutes.ListProperty />}/>
        <react_router_dom_1.Route path="/property/wizard" element={<lazy_routes_1.LazyRoutes.PropertyWizard />}/>
        <react_router_dom_1.Route path="/property/map" element={<lazy_routes_1.LazyRoutes.PropertyMap />}/>
        <react_router_dom_1.Route path="/property/photos" element={<lazy_routes_1.LazyRoutes.PropertyPhotos />}/>
        <react_router_dom_1.Route path="/property/optimize" element={<lazy_routes_1.LazyRoutes.PropertyOptimize />}/>
        <react_router_dom_1.Route path="/property/verification" element={<lazy_routes_1.LazyRoutes.PropertyVerification />}/>
        <react_router_dom_1.Route path="/verify-property" element={<lazy_routes_1.LazyRoutes.PropertyVerification />}/>

        {/* ==========================================
            LAND VERIFICATION ROUTES (Kenya-specific)
            ========================================== */}
        <react_router_dom_1.Route path="/land-verification" element={<lazy_routes_1.LazyRoutes.LandVerification />}/>
        <react_router_dom_1.Route path="/land-verification/dashboard" element={<lazy_routes_1.LazyRoutes.LandVerificationDashboard />}/>
        <react_router_dom_1.Route path="/land-verification/new" element={<lazy_routes_1.LazyRoutes.NewLandVerification />}/>
        <react_router_dom_1.Route path="/verification" element={<lazy_routes_1.LazyRoutes.LandVerification />}/>
        <react_router_dom_1.Route path="/verification/:id" element={<lazy_routes_1.LazyRoutes.LandVerification />}/>

        {/* ==========================================
            TRUST & FRAUD DETECTION ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/trust/basic-checks" element={<lazy_routes_1.LazyRoutes.BasicChecks />}/>
        <react_router_dom_1.Route path="/trust/fraud-detection" element={<lazy_routes_1.LazyRoutes.FraudDetection />}/>
        <react_router_dom_1.Route path="/trust/document-auth" element={<lazy_routes_1.LazyRoutes.DocumentAuth />}/>
        <react_router_dom_1.Route path="/trust/reports" element={<lazy_routes_1.LazyRoutes.TrustReports />}/>
        <react_router_dom_1.Route path="/trust/alerts" element={<lazy_routes_1.LazyRoutes.TrustAlerts />}/>
        <react_router_dom_1.Route path="/trust/karma" element={<lazy_routes_1.LazyRoutes.TrustKarma />}/>
        <react_router_dom_1.Route path="/trust/reputation" element={<lazy_routes_1.LazyRoutes.TrustReputation />}/>
        <react_router_dom_1.Route path="/trust/points" element={<lazy_routes_1.LazyRoutes.TrustPoints />}/>
        <react_router_dom_1.Route path="/trust/reviews" element={<lazy_routes_1.LazyRoutes.TrustReviews />}/>
        <react_router_dom_1.Route path="/trust/fraud-protection" element={<lazy_routes_1.LazyRoutes.FraudProtectionInfo />}/>
        <react_router_dom_1.Route path="/trust-score" element={<lazy_routes_1.LazyRoutes.TrustPoints />}/>

        {/* ==========================================
            COMMUNICATION ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/inbox" element={<lazy_routes_1.LazyRoutes.Inbox />}/>
        <react_router_dom_1.Route path="/messages" element={<lazy_routes_1.LazyRoutes.MessageCenter />}/>
        <react_router_dom_1.Route path="/notifications" element={<lazy_routes_1.LazyRoutes.Notifications />}/>

        {/* ==========================================
            SEARCH & DISCOVERY ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/search" element={<lazy_routes_1.LazyRoutes.SearchResults />}/>
        <react_router_dom_1.Route path="/advanced-search" element={<lazy_routes_1.LazyRoutes.AdvancedSearch />}/>

        {/* ==========================================
            ANALYTICS & REPORTING ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/analytics" element={<lazy_routes_1.LazyRoutes.Analytics />}/>

        {/* ==========================================
            CONTENT & MARKETING ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/blog" element={<lazy_routes_1.LazyRoutes.Blog />}/>
        <react_router_dom_1.Route path="/blog/:slug" element={<lazy_routes_1.LazyRoutes.BlogPost />}/>
        <react_router_dom_1.Route path="/blog-test" element={<lazy_routes_1.LazyRoutes.BlogTest />}/>
        <react_router_dom_1.Route path="/resources" element={<lazy_routes_1.LazyRoutes.Resources />}/>
        <react_router_dom_1.Route path="/community" element={<lazy_routes_1.LazyRoutes.Community />}/>
        <react_router_dom_1.Route path="/community-resources" element={<lazy_routes_1.LazyRoutes.CommunityAndResources />}/>
        <react_router_dom_1.Route path="/fraud-resources" element={<lazy_routes_1.LazyRoutes.FraudResources />}/>
        <react_router_dom_1.Route path="/find-professionals" element={<lazy_routes_1.LazyRoutes.FindProfessionals />}/>
        <react_router_dom_1.Route path="/our-story" element={<lazy_routes_1.LazyRoutes.OurStory />}/>
        <react_router_dom_1.Route path="/partners" element={<lazy_routes_1.LazyRoutes.Partners />}/>
        <react_router_dom_1.Route path="/press" element={<lazy_routes_1.LazyRoutes.PressMedia />}/>

        {/* ==========================================
            BUSINESS & DEMO ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/services" element={<lazy_routes_1.LazyRoutes.Services />}/>
        <react_router_dom_1.Route path="/services/basic-checks" element={<lazy_routes_1.LazyRoutes.BasicChecks />}/>
        <react_router_dom_1.Route path="/services/fraud-detection" element={<lazy_routes_1.LazyRoutes.FraudDetection />}/>
        <react_router_dom_1.Route path="/services/document-auth" element={<lazy_routes_1.LazyRoutes.DocumentAuth />}/>
        <react_router_dom_1.Route path="/services/reputation" element={<lazy_routes_1.LazyRoutes.TrustReputation />}/>
        <react_router_dom_1.Route path="/services/list-property" element={<lazy_routes_1.LazyRoutes.ListProperty />}/>
        <react_router_dom_1.Route path="/solutions" element={<lazy_routes_1.LazyRoutes.Solutions />}/>
        <react_router_dom_1.Route path="/solutions/buyers" element={<lazy_routes_1.LazyRoutes.SolutionsBuyers />}/>
        <react_router_dom_1.Route path="/solutions/sellers" element={<lazy_routes_1.LazyRoutes.SolutionsSellers />}/>
        <react_router_dom_1.Route path="/solutions/agents" element={<lazy_routes_1.LazyRoutes.SolutionsAgents />}/>
        <react_router_dom_1.Route path="/solutions/developers" element={<lazy_routes_1.LazyRoutes.SolutionsDevelopers />}/>
        <react_router_dom_1.Route path="/solutions/legal-experts" element={<lazy_routes_1.LazyRoutes.SolutionsLegalExperts />}/>
        <react_router_dom_1.Route path="/demo" element={<lazy_routes_1.LazyRoutes.Demo />}/>
        <react_router_dom_1.Route path="/mvp-demo" element={<lazy_routes_1.LazyRoutes.MVPDemo />}/>
        <react_router_dom_1.Route path="/nav-test" element={<lazy_routes_1.LazyRoutes.NavigationTest />}/>
        <react_router_dom_1.Route path="/api-demo" element={<lazy_routes_1.LazyRoutes.ApiDemo />}/>
        <react_router_dom_1.Route path="/contact-sales" element={<lazy_routes_1.LazyRoutes.ContactSales />}/>

        {/* ==========================================
            EXPERT COORDINATION ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/expert-coordination" element={<lazy_routes_1.LazyRoutes.ExpertCoordination />}/>
        <react_router_dom_1.Route path="/physical-verification" element={<lazy_routes_1.LazyRoutes.PhysicalVerification />}/>
        <react_router_dom_1.Route path="/community-intelligence" element={<lazy_routes_1.LazyRoutes.CommunityIntelligence />}/>

        {/* ==========================================
            LEGAL & SUPPORT ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/help" element={<lazy_routes_1.LazyRoutes.Help />}/>
        <react_router_dom_1.Route path="/help/getting-started" element={<lazy_routes_1.LazyRoutes.GettingStarted />}/>
        <react_router_dom_1.Route path="/contact" element={<lazy_routes_1.LazyRoutes.Contact />}/>
        <react_router_dom_1.Route path="/privacy" element={<lazy_routes_1.LazyRoutes.Privacy />}/>
        <react_router_dom_1.Route path="/terms" element={<lazy_routes_1.LazyRoutes.Terms />}/>
        <react_router_dom_1.Route path="/cookies" element={<lazy_routes_1.LazyRoutes.Cookies />}/>
        <react_router_dom_1.Route path="/security" element={<lazy_routes_1.LazyRoutes.Security />}/>
        <react_router_dom_1.Route path="/static/partners" element={<lazy_routes_1.LazyRoutes.Partners />}/>

        {/* ==========================================
            DEVELOPER & ADMIN ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/dev" element={<lazy_routes_1.LazyRoutes.DeveloperDashboard />}/>
        <react_router_dom_1.Route path="/admin" element={<lazy_routes_1.LazyRoutes.AdminDashboard />}/>
        <react_router_dom_1.Route path="/monitoring" element={<lazy_routes_1.LazyRoutes.SystemMonitoring />}/>

        {/* ==========================================
            ADDITIONAL MISSING ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/mvp-demo" element={<lazy_routes_1.LazyRoutes.MVPDemo />}/>
        <react_router_dom_1.Route path="/fraud-guide" element={<lazy_routes_1.LazyRoutes.FraudResources />}/>
        <react_router_dom_1.Route path="/press-media" element={<lazy_routes_1.LazyRoutes.PressMedia />}/>

        {/* ==========================================
            SPECIAL ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/coming-soon" element={<lazy_routes_1.LazyRoutes.ComingSoon />}/>

        {/* ==========================================
            DOCUMENT MANAGEMENT ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/documents" element={<lazy_routes_1.LazyRoutes.DocumentsPage />}/>
        <react_router_dom_1.Route path="/documents/upload" element={<lazy_routes_1.LazyRoutes.DocumentUpload />}/>
        <react_router_dom_1.Route path="/documents/:id" element={<lazy_routes_1.LazyRoutes.DocumentViewer />}/>

        {/* ==========================================
            LOCATION SERVICES ROUTES
            ========================================== */}
        <react_router_dom_1.Route path="/location" element={<lazy_routes_1.LazyRoutes.LocationServices />}/>

        {/* ==========================================
            MISSING ROUTE REDIRECTS & FIXES
            ========================================== */}
        <react_router_dom_1.Route path="/activity" element={<lazy_routes_1.LazyRoutes.ComingSoon />}/>
        <react_router_dom_1.Route path="/services/list-property" element={<lazy_routes_1.LazyRoutes.ListProperty />}/>
        <react_router_dom_1.Route path="/services/basic-checks" element={<lazy_routes_1.LazyRoutes.BasicChecks />}/>
        <react_router_dom_1.Route path="/land" element={<lazy_routes_1.LazyRoutes.Lands />}/>

        {/* ==========================================
            CATCH-ALL ROUTE
            ========================================== */}
        <react_router_dom_1.Route path="*" element={<lazy_routes_1.LazyRoutes.NotFound />}/>
      </react_router_dom_1.Routes>
    </react_1.Suspense>);
};
exports.AppRouter = AppRouter;
