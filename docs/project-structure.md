# Project Structure

**Generated:** 4/19/2026, 10:36:22 AM
**Max Depth:** 7 levels

```
.
├── client/
│   ├── public/
│   │   ├── assets/
│   │   │   ├── Artmark.svg
│   │   │   └── TripleCheck.ico
│   │   └── sw.js
│   ├── src/
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   └── AnalyticsDashboard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAnalytics.ts
│   │   │   └── index.ts
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── providers.tsx
│   │   │   ├── README.md
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── PasswordReset.tsx
│   │   │   │   ├── RegistrationWizard.tsx
│   │   │   │   └── TwoFactorAuth.tsx
│   │   │   ├── contexts/
│   │   │   │   └── AuthContext.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── pages/
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Register.tsx
│   │   │   ├── services/
│   │   │   │   └── auth-api.ts
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── communication/
│   │   │   ├── components/
│   │   │   │   ├── MessageComposer.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageThread.tsx
│   │   │   │   ├── NotificationCenter.tsx
│   │   │   │   ├── NotificationSystem.tsx
│   │   │   │   └── RealTimeNotifications.tsx
│   │   │   ├── context/
│   │   │   │   └── CommunicationContext.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useMessaging.ts
│   │   │   │   └── useNotifications.ts
│   │   │   ├── pages/
│   │   │   │   ├── Inbox.tsx
│   │   │   │   ├── MessageCenter.tsx
│   │   │   │   └── Notifications.tsx
│   │   │   ├── services/
│   │   │   │   ├── communication-business-logic.ts
│   │   │   │   ├── DocumentCommunicationIntegration.ts
│   │   │   │   └── WebSocketManager.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   └── external-dependencies.ts
│   │   ├── infrastructure/
│   │   │   ├── ai/
│   │   │   ├── api/
│   │   │   │   ├── data-validation.ts
│   │   │   │   ├── queryClient.ts
│   │   │   │   └── request-manager.ts
│   │   │   ├── audit/
│   │   │   │   ├── plugins/
│   │   │   │   │   ├── AccessibilityPlugin.ts
│   │   │   │   │   ├── PerformancePlugin.ts
│   │   │   │   │   └── SecurityPlugin.ts
│   │   │   │   ├── audit.types.ts
│   │   │   │   ├── AuditReporter.ts
│   │   │   │   ├── AuditRunner.ts
│   │   │   │   ├── cli.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── LinkValidator.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── run-audit.ts
│   │   │   │   ├── tsconfig.json
│   │   │   │   ├── types.ts
│   │   │   │   └── UIAuditSystem.ts
│   │   │   ├── cache/
│   │   │   │   └── query-cache.ts
│   │   │   ├── hooks/
│   │   │   │   ├── examples/
│   │   │   │   ├── index.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── useCleanupManager.ts
│   │   │   │   ├── useCoordinatedState.ts
│   │   │   │   ├── useIntersectionObserver.ts
│   │   │   │   ├── useSafeEffect.ts
│   │   │   │   ├── useSafeState.ts
│   │   │   │   └── useStableCallback.ts
│   │   │   ├── monitoring/
│   │   │   │   ├── bundle-analyzer.ts
│   │   │   │   ├── core-web-vitals.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── operation-tracker.ts
│   │   │   │   ├── query-monitor.ts
│   │   │   │   ├── resource-hints.ts
│   │   │   │   ├── system-health.ts
│   │   │   │   └── usePerformanceMonitoring.ts
│   │   │   ├── payments/
│   │   │   ├── realtime/
│   │   │   │   └── websocket-client.ts
│   │   │   ├── service-worker/
│   │   │   │   └── sw-registration.ts
│   │   │   ├── services/
│   │   │   │   └── image-preload-service.ts
│   │   │   └── utils/
│   │   │       └── image-optimization.ts
│   │   ├── land-verification/
│   │   │   ├── components/
│   │   │   │   ├── CommunityInterviewTemplate.tsx
│   │   │   │   ├── ContextualGuidanceProvider.tsx
│   │   │   │   ├── DecisionSupportTool.tsx
│   │   │   │   ├── ExpertCoordinationInterface.tsx
│   │   │   │   ├── HelpSystem.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── KenyaLandEducation.tsx
│   │   │   │   ├── LandVerificationDashboard.tsx
│   │   │   │   ├── ProfessionalResourcesDirectory.tsx
│   │   │   │   ├── RecommendationEngine.tsx
│   │   │   │   ├── ReportingPortal.tsx
│   │   │   │   ├── RiskAssessmentDisplay.tsx
│   │   │   │   ├── RiskFactorAnalysis.tsx
│   │   │   │   ├── RiskManagementInterface.tsx
│   │   │   │   ├── RiskProfileVisualization.tsx
│   │   │   │   ├── RiskWeightingControls.tsx
│   │   │   │   ├── ScenarioModelingTool.tsx
│   │   │   │   ├── VerificationProgressTracker.tsx
│   │   │   │   └── VerificationWizard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLandVerification.ts
│   │   │   ├── pages/
│   │   │   │   ├── index.ts
│   │   │   │   ├── LandVerificationDashboardPage.tsx
│   │   │   │   ├── LandVerificationPage.tsx
│   │   │   │   └── NewVerificationPage.tsx
│   │   │   ├── services/
│   │   │   │   ├── DocumentIntelligenceIntegration.ts
│   │   │   │   └── HelpDocumentationService.ts
│   │   │   └── index.ts
│   │   ├── local/
│   │   │   ├── components/
│   │   │   │   ├── ai-integration/
│   │   │   │   │   └── PropertyAIEnhancement.tsx
│   │   │   │   ├── b2b/
│   │   │   │   │   ├── B2BCommunityInsightsBanner.tsx
│   │   │   │   │   ├── B2BCommunityInsightsPrompt.tsx
│   │   │   │   │   ├── B2BContextualPrompt.tsx
│   │   │   │   │   ├── B2BEntryPointManager.tsx
│   │   │   │   │   ├── B2BFraudReportBanner.tsx
│   │   │   │   │   ├── B2BFraudReportPrompt.tsx
│   │   │   │   │   ├── B2BLeadCapture.tsx
│   │   │   │   │   ├── B2BNotificationBanner.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── blog/
│   │   │   │   │   ├── BlogPostCard.tsx
│   │   │   │   │   └── BlogPostSkeleton.tsx
│   │   │   │   ├── error-handling/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── examples/
│   │   │   │   │   └── HooksExample.tsx
│   │   │   │   ├── fallbacks/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── MobileNavFallback.tsx
│   │   │   │   │   ├── NavigationFallback.tsx
│   │   │   │   ├── forms/
│   │   │   │   │   ├── FileUpload.tsx
│   │   │   │   │   ├── FileUploadField.tsx
│   │   │   │   │   └── FormField.tsx
│   │   │   │   ├── hero/
│   │   │   │   │   ├── ConversionHero.tsx
│   │   │   │   │   └── Hero.tsx
│   │   │   │   ├── images/
│   │   │   │   │   ├── gallery/
│   │   │   │   │   │   ├── AdvancedGallery.tsx
│   │   │   │   │   │   ├── BatchOperationsToolbar.tsx
│   │   │   │   │   │   ├── constants.ts
│   │   │   │   │   │   ├── ImageCard.tsx
│   │   │   │   │   │   ├── ImageEngine.tsx
│   │   │   │   │   │   ├── ImageGallery.tsx
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── LazyImage.tsx
│   │   │   │   │   │   ├── Lightbox.tsx
│   │   │   │   │   │   ├── SearchInterface.tsx
│   │   │   │   │   │   ├── SimpleGallery.tsx
│   │   │   │   │   │   ├── types.ts
│   │   │   │   │   │   ├── useImageSearch.ts
│   │   │   │   │   │   ├── utils.ts
│   │   │   │   │   │   └── ValidationService.ts
│   │   │   │   │   ├── ImageGallery.module.css
│   │   │   │   │   ├── ImageGallery.tsx
│   │   │   │   │   ├── ImageShowcase.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── PropertyImageVault.tsx
│   │   │   │   ├── monitoring/
│   │   │   │   │   └── ApiClientDashboard.tsx
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── BreadcrumbNavigation.tsx
│   │   │   │   │   ├── ContextualSidebar.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── MobileNav.tsx
│   │   │   │   │   ├── Navigation.tsx
│   │   │   │   │   ├── NavigationErrorBoundary.tsx
│   │   │   │   │   ├── NavigationSearch.tsx
│   │   │   │   │   └── SafeNavigation.tsx
│   │   │   │   ├── property/
│   │   │   │   │   ├── filters/
│   │   │   │   │   │   ├── AllPropertiesFilters.tsx
│   │   │   │   │   │   ├── BasePropertyFilters.tsx
│   │   │   │   │   │   ├── CommercialFilters.tsx
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── LandFilters.tsx
│   │   │   │   │   │   └── ResidentialFilters.tsx
│   │   │   │   │   ├── shared/
│   │   │   │   │   │   ├── examples/
│   │   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   │   └── MinimalPropertyCard.tsx
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── PropertyFeatures.tsx
│   │   │   │   │   │   ├── PropertyImageSection.tsx
│   │   │   │   │   │   └── QuickActionsOverlay.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── PhotoManagementButton.tsx
│   │   │   │   │   ├── PropertyArchitectureComparison.tsx
│   │   │   │   │   ├── PropertyCard.tsx
│   │   │   │   │   ├── PropertyDataGrid.tsx
│   │   │   │   │   ├── PropertyListingPage.tsx
│   │   │   │   │   └── PropertySkeletonGrid.tsx
│   │   │   │   ├── skeletons/
│   │   │   │   │   └── PropertyDetailsSkeleton.tsx
│   │   │   │   ├── ui/
│   │   │   │   │   ├── accordion.tsx
│   │   │   │   │   ├── alert-dialog.tsx
│   │   │   │   │   ├── alert.tsx
│   │   │   │   │   ├── aspect-ratio.tsx
│   │   │   │   │   ├── avatar.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── breadcrumb.tsx
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── calendar.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── carousel.tsx
│   │   │   │   │   ├── chart.tsx
│   │   │   │   │   ├── checkbox.tsx
│   │   │   │   │   ├── collapsible.tsx
│   │   │   │   │   ├── command.tsx
│   │   │   │   │   ├── common-buttons.tsx
│   │   │   │   │   ├── context-menu.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── drawer.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── error-states.tsx
│   │   │   │   │   ├── form.tsx
│   │   │   │   │   ├── hover-card.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── input-otp.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── label.tsx
│   │   │   │   │   ├── loading-skeleton.tsx
│   │   │   │   │   ├── loading-states.tsx
│   │   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   │   ├── logo.tsx
│   │   │   │   │   ├── menubar.tsx
│   │   │   │   │   ├── navigation-menu.tsx
│   │   │   │   │   ├── popover.tsx
│   │   │   │   │   ├── progress.tsx
│   │   │   │   │   ├── radio-group.tsx
│   │   │   │   │   ├── resizable.tsx
│   │   │   │   │   ├── scroll-area.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── separator.tsx
│   │   │   │   │   ├── sheet.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── skeleton.tsx
│   │   │   │   │   ├── slider.tsx
│   │   │   │   │   ├── switch.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── textarea.tsx
│   │   │   │   │   ├── theme-toggle.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   ├── toaster.tsx
│   │   │   │   │   ├── toggle-group.tsx
│   │   │   │   │   ├── toggle.tsx
│   │   │   │   │   ├── tooltip.tsx
│   │   │   │   │   └── wordmark.tsx
│   │   │   │   ├── AfricaCoverageMap.tsx
│   │   │   │   ├── CommunityInsights.tsx
│   │   │   │   ├── DemoLoginHelper.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── ErrorFeedback.tsx
│   │   │   │   ├── GlobalPerformanceTestPanel.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── IntegrationTest.tsx
│   │   │   │   ├── LazyComponents.tsx
│   │   │   │   ├── listing-card.tsx
│   │   │   │   ├── LoadingStates.tsx
│   │   │   │   ├── NewsBlog.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── PaymentGuidance.tsx
│   │   │   │   ├── PricingCTA.tsx
│   │   │   │   ├── QueryErrorBoundary.tsx
│   │   │   │   ├── ROICalculator.tsx
│   │   │   │   ├── ServiceCategories.tsx
│   │   │   │   ├── Testimonials.tsx
│   │   │   │   ├── TrustIndicators.tsx
│   │   │   │   ├── VideoModal.tsx
│   │   │   │   ├── VirtualizedList.tsx
│   │   │   │   └── VirtualizedPropertyList.tsx
│   │   │   ├── config/
│   │   │   │   ├── assets.ts
│   │   │   │   ├── image-components.config.ts
│   │   │   │   ├── image-system.config.ts
│   │   │   │   ├── images.ts
│   │   │   │   ├── propertyTypes.ts
│   │   │   │   └── user-journeys.ts
│   │   │   ├── contexts/
│   │   │   │   └── ThemeContext.tsx
│   │   │   ├── docs/
│   │   │   │   └── memory-optimization-guide.md
│   │   │   ├── error-handling/
│   │   │   │   ├── client/
│   │   │   │   │   └── error-handler.ts
│   │   │   │   ├── constants/
│   │   │   │   │   ├── error-categories.ts
│   │   │   │   │   ├── error-codes.ts
│   │   │   │   │   ├── http-status.ts
│   │   │   │   │   └── postgres-codes.ts
│   │   │   │   ├── errors/
│   │   │   │   │   ├── base-error.ts
│   │   │   │   │   ├── database-error.ts
│   │   │   │   │   └── validation-error.ts
│   │   │   │   ├── server/
│   │   │   │   │   └── express-handler.ts
│   │   │   │   ├── utilities/
│   │   │   │   │   ├── error-factory.ts
│   │   │   │   │   ├── error-metrics.ts
│   │   │   │   │   └── error-utils.ts
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── configs/
│   │   │   │   │   ├── formValidationConfigs.ts
│   │   │   │   │   ├── hookConfigs.ts
│   │   │   │   │   └── propertyQueryConfigs.ts
│   │   │   │   ├── examples/
│   │   │   │   │   └── configurationExamples.ts
│   │   │   │   ├── images/
│   │   │   │   │   └── usePropertyImageUpload.ts
│   │   │   │   ├── migration/
│   │   │   │   │   ├── COMPREHENSIVE_MIGRATION_GUIDE.md
│   │   │   │   │   └── README.md
│   │   │   │   ├── presets/
│   │   │   │   │   └── commonHookPresets.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── deprecation.ts
│   │   │   │   │   ├── init.ts
│   │   │   │   │   └── migration.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── use-mobile.tsx
│   │   │   │   ├── use-toast.ts
│   │   │   │   ├── useAccessibility.tsx
│   │   │   │   ├── useAIIntegration.ts
│   │   │   │   ├── useB2BEntryPoints.ts
│   │   │   │   ├── useB2BMessaging.ts
│   │   │   │   ├── useCMS.ts
│   │   │   │   ├── useCompareError.ts
│   │   │   │   ├── useComponentPerformance.tsx
│   │   │   │   ├── useConfigurableHook.ts
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── useErrorRecovery.ts
│   │   │   │   ├── useFileUpload.ts
│   │   │   │   ├── useFilterState.ts
│   │   │   │   ├── useFormValidation.ts
│   │   │   │   ├── useGeolocation.ts
│   │   │   │   ├── useHealthMonitoring.ts
│   │   │   │   ├── useImageGallery.ts
│   │   │   │   ├── useMemoryOptimization.ts
│   │   │   │   ├── useNavigationSpacing.ts
│   │   │   │   ├── useOperationTracking.ts
│   │   │   │   ├── useOptimisticMutation.ts
│   │   │   │   ├── usePagination.ts
│   │   │   │   ├── usePaymentGuidance.ts
│   │   │   │   ├── usePerformanceOptimization.ts
│   │   │   │   ├── usePolling.ts
│   │   │   │   ├── usePropertyActions.ts
│   │   │   │   ├── usePropertyCardActions.ts
│   │   │   │   ├── usePropertyCardState.ts
│   │   │   │   ├── usePropertyCompareActions.ts
│   │   │   │   ├── usePropertyFormatting.ts
│   │   │   │   ├── useSafeQuery.ts
│   │   │   │   ├── useSecurity.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   ├── pages/
│   │   │   │   ├── solutions/
│   │   │   │   │   ├── LegalExperts.tsx
│   │   │   │   │   ├── PropertyBuyers.tsx
│   │   │   │   │   ├── PropertyDevelopers.tsx
│   │   │   │   │   ├── PropertySellers.tsx
│   │   │   │   │   └── RealEstateAgents.tsx
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── ApiDemo.tsx
│   │   │   │   ├── Blog.tsx
│   │   │   │   ├── BlogPost.tsx
│   │   │   │   ├── BlogTest.tsx
│   │   │   │   ├── ComingSoon.tsx
│   │   │   │   ├── Community.tsx
│   │   │   │   ├── CommunityAndResources.tsx
│   │   │   │   ├── CommunityIntelligence.tsx
│   │   │   │   ├── Contact.tsx
│   │   │   │   ├── ContactSales.tsx
│   │   │   │   ├── Cookies.tsx
│   │   │   │   ├── Demo.tsx
│   │   │   │   ├── DeveloperDashboard.tsx
│   │   │   │   ├── DocumentsPage.tsx
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   ├── ExpertCoordination.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── FindProfessionals.tsx
│   │   │   │   ├── Fraud-resources.tsx
│   │   │   │   ├── GettingStarted.tsx
│   │   │   │   ├── Help.tsx
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── InstitutionalPricing.tsx
│   │   │   │   ├── LocationServices.tsx
│   │   │   │   ├── MVP-Demo.tsx
│   │   │   │   ├── NavigationTest.tsx
│   │   │   │   ├── NotFound.tsx
│   │   │   │   ├── OurStory.tsx
│   │   │   │   ├── Partners.tsx
│   │   │   │   ├── PhysicalVerification.tsx
│   │   │   │   ├── PressMedia.tsx
│   │   │   │   ├── Pricing.tsx
│   │   │   │   ├── Privacy.tsx
│   │   │   │   ├── Properties.tsx
│   │   │   │   ├── Resources.tsx
│   │   │   │   ├── Security.tsx
│   │   │   │   ├── Services.tsx
│   │   │   │   ├── Solutions.tsx
│   │   │   │   ├── SystemMonitoring.tsx
│   │   │   │   └── Terms.tsx
│   │   │   ├── performance/
│   │   │   │   └── index.ts
│   │   │   ├── security/
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── ai-integration/
│   │   │   │   │   ├── monitoring/
│   │   │   │   │   │   ├── ai-health-monitor.ts
│   │   │   │   │   │   ├── ai-metrics-collector.ts
│   │   │   │   │   │   ├── ai-performance-dashboard.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── ai-integration-orchestrator.ts
│   │   │   │   │   ├── ai-performance-monitor.ts
│   │   │   │   │   ├── document-processing-integration.ts
│   │   │   │   │   ├── fraud-detection-integration.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── property-analysis-integration.ts
│   │   │   │   │   └── recommendation-integration.ts
│   │   │   │   ├── archive/
│   │   │   │   │   └── README.md
│   │   │   │   ├── examples/
│   │   │   │   │   └── unified-api-client-examples.ts
│   │   │   │   ├── images/
│   │   │   │   │   ├── core/
│   │   │   │   │   │   └── ImageServiceCore.ts
│   │   │   │   │   ├── ImageMetadataService.ts
│   │   │   │   │   ├── ImageServiceOrchestrator.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── PropertyImageUploadService.ts
│   │   │   │   │   ├── PropertyImageValidationService.ts
│   │   │   │   │   ├── PropertyImageWorkflowManager.ts
│   │   │   │   │   └── USAGE_EXAMPLES.md
│   │   │   │   ├── AlertingService.ts
│   │   │   │   ├── api-client-monitor.ts
│   │   │   │   ├── audit-trail-service.ts
│   │   │   │   ├── AuditLogService.ts
│   │   │   │   ├── AuthTokenService.ts
│   │   │   │   ├── FormService.ts
│   │   │   │   ├── HealthCheckService.ts
│   │   │   │   ├── huggingface-api-client.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── mock-ai-data.ts
│   │   │   │   ├── performance-monitoring-service.ts
│   │   │   │   ├── PerformanceService.ts
│   │   │   │   ├── RateLimitService.ts
│   │   │   │   ├── SearchService.ts
│   │   │   │   ├── security-monitoring-service.ts
│   │   │   │   └── unified-api-client.ts
│   │   │   ├── styles/
│   │   │   │   ├── design-system.css
│   │   │   │   └── globals.css
│   │   │   ├── test-utils/
│   │   │   │   ├── index.ts
│   │   │   │   ├── render.tsx
│   │   │   │   └── setup.ts
│   │   │   ├── testing/
│   │   │   │   ├── ApiTestUtils.ts
│   │   │   │   ├── E2ETestUtils.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── TestUtils.tsx
│   │   │   ├── types/
│   │   │   │   ├── contracts/
│   │   │   │   │   ├── property-contracts.ts
│   │   │   │   │   └── user-contracts.ts
│   │   │   │   ├── images/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── unified.ts
│   │   │   │   ├── api-contracts.ts
│   │   │   │   ├── api.ts
│   │   │   │   ├── compare.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── search.ts
│   │   │   │   └── service-interfaces.ts
│   │   │   ├── utils/
│   │   │   │   ├── images/
│   │   │   │   │   └── unified-utils.ts
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── cn.ts
│   │   │   │   ├── compare-utils.tsx
│   │   │   │   ├── date-utils.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── generic-formatters.ts
│   │   │   │   ├── globalPerformanceMonitor.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── mockPropertyApi.ts
│   │   │   │   ├── navigation.ts
│   │   │   │   ├── property-mapper.ts
│   │   │   │   ├── propertyAdapters.ts
│   │   │   │   ├── safe-navigation.ts
│   │   │   │   ├── test-helpers.tsx
│   │   │   │   └── toast-utils.ts
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   └── schema.ts
│   │   ├── ml/
│   │   │   └── core/
│   │   │       └── feature-engineering.ts
│   │   ├── monitoring/
│   │   │   ├── components/
│   │   │   │   ├── HealthDashboard.tsx
│   │   │   │   └── PerformanceMonitoringProvider.tsx
│   │   │   ├── pages/
│   │   │   │   └── MonitoringPage.tsx
│   │   │   └── index.ts
│   │   ├── property/
│   │   │   ├── components/
│   │   │   │   ├── wizard/
│   │   │   │   │   ├── examples/
│   │   │   │   │   │   └── WizardExamples.tsx
│   │   │   │   │   ├── steps/
│   │   │   │   │   │   ├── AdaptedBasicDetailsStep.tsx
│   │   │   │   │   │   ├── AdaptedFeaturesStep.tsx
│   │   │   │   │   │   ├── AdaptedImagesStep.tsx
│   │   │   │   │   │   ├── AdaptedLocationStep.tsx
│   │   │   │   │   │   ├── AdaptedPreviewStep.tsx
│   │   │   │   │   │   ├── AdaptedPricingStep.tsx
│   │   │   │   │   │   ├── DocumentationStep.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── config.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── types.ts
│   │   │   │   │   └── UnifiedPropertyWizard.tsx
│   │   │   │   ├── CompareBar.tsx
│   │   │   │   ├── CompareModal.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── LandCard.tsx
│   │   │   │   ├── PerformanceTestPanel.tsx
│   │   │   │   ├── PropertyCardShowcase.module.css
│   │   │   │   ├── PropertyCardShowcase.module.css.d.ts
│   │   │   │   ├── PropertyCardShowcase.tsx
│   │   │   │   ├── PropertyListingWizard.tsx
│   │   │   │   ├── PropertyMap.tsx
│   │   │   │   ├── PropertyReviews.tsx
│   │   │   │   └── PropertyTestComponent.tsx
│   │   │   ├── contexts/
│   │   │   │   ├── ARCHITECTURE.md
│   │   │   │   ├── index.ts
│   │   │   │   └── PropertyContext.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   ├── useLandProperty.ts
│   │   │   │   └── useProperty.ts
│   │   │   ├── pages/
│   │   │   │   ├── CommercialProperties.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── LandDetails.tsx
│   │   │   │   ├── LandRedirect.tsx
│   │   │   │   ├── Lands.tsx
│   │   │   │   ├── ListProperty.tsx
│   │   │   │   ├── PropertiesResidential.tsx
│   │   │   │   ├── PropertyCompare.tsx
│   │   │   │   ├── PropertyDetails.tsx
│   │   │   │   ├── PropertyEdit.tsx
│   │   │   │   ├── PropertyOptimize.tsx
│   │   │   │   ├── PropertyPhotos.tsx
│   │   │   │   ├── PropertyVerification.tsx
│   │   │   │   └── PropertyWizard.tsx
│   │   │   ├── services/
│   │   │   │   ├── index.ts
│   │   │   │   ├── mock-land-data.ts
│   │   │   │   ├── property-api.ts
│   │   │   │   ├── property-validation.ts
│   │   │   │   └── PropertyDocumentIntegration.ts
│   │   │   ├── shared/
│   │   │   │   ├── components.tsx
│   │   │   │   ├── LandSections.tsx
│   │   │   │   ├── PropertyGallery.tsx
│   │   │   │   └── utils.ts
│   │   │   ├── styles/
│   │   │   │   ├── comparison.constants.ts
│   │   │   │   └── index.ts
│   │   │   ├── tests/
│   │   │   │   └── performanceTest.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   └── property.types.ts
│   │   │   ├── utils/
│   │   │   │   ├── normalizeLandProperty.ts
│   │   │   │   ├── normalizeProperty.ts
│   │   │   │   └── propertyImages.ts
│   │   │   └── index.ts
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── ConsolidatedSearch.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchFilters.tsx
│   │   │   ├── examples/
│   │   │   │   └── SearchExample.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useSearch.ts
│   │   │   ├── pages/
│   │   │   │   ├── AdvancedSearch.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   └── index.ts
│   │   ├── trust/
│   │   │   ├── components/
│   │   │   │   ├── CaseManagementInterface.tsx
│   │   │   │   ├── DocumentAuthentication.tsx
│   │   │   │   ├── DocumentUploadInterface.tsx
│   │   │   │   ├── DocumentVerificationResults.tsx
│   │   │   │   ├── FraudAlertsList.tsx
│   │   │   │   ├── FraudDetectionDashboard.tsx
│   │   │   │   ├── MLAnalyticsDisplay.tsx
│   │   │   │   ├── NetworkAnalysisVisualization.tsx
│   │   │   │   ├── PropertyRiskAssessment.tsx
│   │   │   │   ├── TrustScore.tsx
│   │   │   │   └── VerificationBadge.tsx
│   │   │   ├── contexts/
│   │   │   │   └── TrustContext.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDocumentAuthentication.ts
│   │   │   │   ├── useFraudDetection.ts
│   │   │   │   └── useTrustScore.ts
│   │   │   ├── pages/
│   │   │   │   ├── Alerts.tsx
│   │   │   │   ├── BasicChecks.tsx
│   │   │   │   ├── DocumentAuth.tsx
│   │   │   │   ├── FraudDetection.tsx
│   │   │   │   ├── FraudProtectionInfo.tsx
│   │   │   │   ├── Karma.tsx
│   │   │   │   ├── ProofVerification.tsx
│   │   │   │   ├── Reports.tsx
│   │   │   │   ├── Reputation.tsx
│   │   │   │   ├── Reviews.tsx
│   │   │   │   ├── TrustPoints.tsx
│   │   │   │   └── VerificationDashboard.tsx
│   │   │   ├── services/
│   │   │   │   ├── DocumentTrustIntegration.ts
│   │   │   │   ├── fraudDetectionApi.ts
│   │   │   │   ├── ImmutableProofService.ts
│   │   │   │   ├── NPLVerificationService.ts
│   │   │   │   ├── RegistryMismatchDetector.ts
│   │   │   │   ├── trust-api.ts
│   │   │   │   └── trust-business-logic.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── npl-verification.types.ts
│   │   │   │   └── trust.types.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── audit.types.ts
│   │   │   ├── css.d.ts
│   │   │   ├── event.types.ts
│   │   │   ├── land-verification.ts
│   │   ├── user/
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   ├── UserNotifications.tsx
│   │   │   │   └── UserProfile.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useUser.ts
│   │   │   ├── pages/
│   │   │   │   ├── Activity.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── Team.tsx
│   │   │   │   ├── Tenants.tsx
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   └── UserSettings.tsx
│   │   │   ├── services/
│   │   │   │   ├── README.md
│   │   │   │   └── user-business-logic.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── bundle-optimizer.ts
│   │   │   └── performance-optimizer.ts
│   │   ├── global.d.ts
│   │   ├── index.ts
│   │   ├── main.tsx
│   │   ├── README.md
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.js
├── docs/
│   ├── adr/
│   │   ├── 001-cache-consolidation.md
│   │   ├── 002-image-gallery-refactoring.md
│   │   ├── 003-service-consolidation.md
│   │   ├── 004-test-infrastructure.md
│   │   ├── 005-database-schema-strategy.md
│   │   ├── 006-navigation-architecture.md
│   │   ├── 007-property-components.md
│   │   ├── 008-business-model.md
│   │   ├── 009-ml-training-strategy.md
│   │   ├── 010-observability-stack.md
│   │   ├── 011-http-client-resilience.md
│   │   ├── 012-authentication-authorization.md
│   │   ├── 013-realtime-communication.md
│   │   ├── 014-schema-validation.md
│   │   ├── 015-rate-limiting.md
│   │   ├── 016-layered-architecture.md
│   │   ├── 017-server-app-module-pattern.md
│   │   ├── 018-logging-architecture.md
│   │   ├── project-structure.md
│   │   └── README.md
│   ├── analysis/
│   │   └── images-redundancy-analysis.md
│   ├── dcs/
│   │   ├── CONSOLIDATION_COMPLETE.md
│   │   ├── migration.log.md
│   │   └── README.md
│   ├── internal/
│   │   ├── PORTFOLIO_DESCRIPTION.md
│   │   ├── triplecheck_development_framework.md
│   │   └── triplecheck_evaluation.md
│   ├── planning/
│   │   ├── communication-consolidation-plan.md
│   │   ├── fraud-detection-test-consolidation-plan.md
│   │   ├── hooks-consolidation-log.md
│   │   └── mobile-nav-improvements.md
│   ├── project-history/
│   │   └── task-completion-report.md
│   ├── standards/
│   │   ├── hooks-quality-standards.md
│   │   └── NAMING_CONVENTIONS.md
│   ├── LOGGING_GUIDE.md
│   ├── project-structure.md
│   ├── PROPERTY_DOMAIN_MAP.md
│   ├── QUICK_REFERENCE.md
│   └── README.md
├── scripts/
│   ├── debug/
│   │   └── test-server-start.ts
│   ├── deployment/
│   │   ├── grafana/
│   │   │   └── dashboards/
│   │   │       ├── business-metrics.json
│   │   │       ├── database-health.json
│   │   │       └── query-performance.json
│   │   ├── deploy-production.ts
│   │   ├── deploy-staging.ts
│   │   ├── deployment-tests.ts
│   │   ├── README.md
│   │   ├── setup-comprehensive-monitoring.ts
│   │   └── validate-deployment.ts
│   ├── migration-helpers/
│   │   ├── cache-migration.ts
│   │   ├── config-migration.ts
│   │   └── middleware-migration.ts
│   ├── performance/
│   │   └── api-performance-test.ts
│   ├── security/
│   │   └── bug-categorization.ts
│   ├── deploy-setup.ts
│   ├── emergency-stop.js
│   ├── execute-optimization.ts
│   ├── fix-imports.sh
│   ├── fix-logger-api.ts
│   ├── fix-logger-imports.ts
│   ├── generate-favicons.js
│   ├── health-check.ts
│   ├── import-resolver.mjs
│   ├── import-tools.sh
│   ├── import-validator.mjs
│   ├── load-data-fixed.ts
│   ├── logger.js
│   ├── memory-benchmark.js
│   ├── migrate-database-structure.ts
│   ├── OptimizedBuildPipeline.ts
│   ├── prepare-deployment.ts
│   ├── quick-recovery.ts
│   ├── README.md
│   ├── restart-dev-server.ts
│   ├── run-accessibility-tests.js
│   ├── run-complete-load-test.cjs
│   ├── run-e2e-tests.js
│   ├── run-migration.ts
│   ├── run-ui-audit.ts
│   ├── run-visual-tests.js
│   ├── self-monitoring-pipeline.ts
│   ├── stop-infinite-queries.ts
│   ├── streaming-json-processor.ts
│   ├── validate-authentication.ts
│   ├── validate-database-paths.ts
│   ├── validate-database-structure.ts
│   ├── validate-migration.ts
│   ├── validate-production.ts
│   ├── verify-breaking-changes.ts
│   └── verify-naming-conventions.sh
├── server/
│   ├── ai/
│   │   ├── middleware/
│   │   │   └── ai-middleware.ts
│   │   ├── services/
│   │   │   ├── ai-service-manager.ts
│   │   │   ├── document-processing-ai.service.ts
│   │   │   ├── fraud-detection-ai.service.ts
│   │   │   ├── huggingface-client.ts
│   │   │   ├── index.ts
│   │   │   ├── property-analysis-ai.service.ts
│   │   │   └── recommendation-ai.service.ts
│   │   ├── ai.controller.ts
│   │   ├── community-trust-ai-root.ts
│   │   ├── community-trust-ai.ts
│   │   ├── ml-business.service.ts
│   │   ├── ml-training-root.ts
│   │   ├── ml-training.ts
│   │   ├── README.md
│   │   └── storage.ts
│   ├── analytics/
│   │   ├── analytics-business.service.ts
│   │   └── analytics.controller.ts
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── authorization.ts
│   │   ├── index.ts
│   │   └── passport-config.ts
│   ├── b2b/
│   │   ├── b2b.controller.ts
│   │   └── index.ts
│   ├── blockchain/
│   │   └── blockchain-service.ts
│   ├── communication/
│   │   ├── communication-business.service.ts
│   │   ├── communication.controller.ts
│   │   ├── index.ts
│   │   ├── notification.service.ts
│   │   ├── notifications.controller.ts
│   │   └── websocket.service.ts
│   ├── community/
│   │   ├── community.controller.ts
│   │   ├── index.ts
│   │   ├── intelligence.service.ts
│   │   └── resources.service.ts
│   ├── config/
│   │   ├── development.ts
│   │   ├── environment-schema.ts
│   │   └── ports.ts
│   ├── document-auth/
│   │   ├── analyzers/
│   │   │   ├── ContentAnalyzer.ts
│   │   │   ├── LandDocumentAnalyzer.ts
│   │   │   ├── MetadataAnalyzer.ts
│   │   │   ├── MLDocumentAnalyzer.ts
│   │   │   ├── SignatureAnalyzer.ts
│   │   │   └── VisualAnalyzer.ts
│   │   ├── core/
│   │   │   └── DocumentAuthEngine.ts
│   │   ├── types/
│   │   │   └── exif-parser.d.ts
│   │   ├── authentication-business.service.ts
│   │   ├── DocumentAuthService.ts
│   │   └── test-document-auth.ts
│   ├── fraud-detection/
│   │   ├── api/
│   │   │   └── FraudDetectionAPI.ts
│   │   ├── core/
│   │   │   └── FraudDetectionEngine.ts
│   │   ├── services/
│   │   │   ├── CaseManagementService.ts
│   │   │   ├── ComplianceReportingService.ts
│   │   │   ├── DatabaseService.ts
│   │   │   ├── DataIntegrationService.ts
│   │   │   └── ExternalAPIService.ts
│   │   ├── tests/
│   │   │   ├── global-setup.ts
│   │   │   ├── global-teardown.ts
│   │   │   ├── results-processor.js
│   │   │   ├── run-tests.ts
│   │   │   └── setup.ts
│   │   ├── utils/
│   │   │   └── Logger.ts
│   │   ├── alerts.controller.ts
│   │   ├── index.ts
│   │   ├── integrate-real-data.ts
│   │   ├── intelligence.service.ts
│   │   ├── jest.config.js
│   │   ├── README.md
│   │   ├── test-system.js
│   │   └── validate-backend.js
│   ├── infrastructure/
│   │   ├── cache/
│   │   │   ├── AnalyticsCache.ts
│   │   │   ├── CacheIntegrationAdapter.ts
│   │   │   ├── CacheIntegrationMigrator.ts
│   │   │   ├── CacheService.ts
│   │   │   ├── CacheWarmingStrategy.ts
│   │   │   ├── index.ts
│   │   │   ├── PropertyCacheService.ts
│   │   │   ├── README.md
│   │   │   └── UnifiedCacheManager.ts
│   │   ├── database/
│   │   │   ├── audit/
│   │   │   │   ├── comprehensive-database-audit.md
│   │   │   │   ├── database-inventory.json
│   │   │   │   ├── database-structure-audit.md
│   │   │   │   └── dependency-map.md
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   └── index.ts
│   │   │   ├── connection/
│   │   │   │   ├── DatabaseCircuitBreaker.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── production-pool.ts
│   │   │   │   └── ProductionConnectionPool.ts
│   │   │   ├── data-generation/
│   │   │   │   ├── cli/
│   │   │   │   │   ├── demo-generator-cli.ts
│   │   │   │   │   ├── demo-scenario-cli.ts
│   │   │   │   │   └── unified-data-generation.ts
│   │   │   │   ├── core/
│   │   │   │   │   ├── checkpoint-manager.ts
│   │   │   │   │   ├── data-validator.ts
│   │   │   │   │   └── UnifiedDataGenerator.ts
│   │   │   │   ├── examples/
│   │   │   │   │   └── demo-generation-example.ts
│   │   │   │   ├── generators/
│   │   │   │   │   ├── python/
│   │   │   │   │   │   └── runner.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── scenarios/
│   │   │   │   │   ├── demo-data-validator.ts
│   │   │   │   │   ├── production-demo-generator.ts
│   │   │   │   │   ├── production-demo-scenarios.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── scenario-generator.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── README.md
│   │   │   ├── deployment/
│   │   │   │   ├── examples/
│   │   │   │   │   └── complete-deployment-example.ts
│   │   │   │   ├── BlueGreenDeploymentManager.ts
│   │   │   │   ├── deployment-cli.ts
│   │   │   │   ├── deployment-utils.ts
│   │   │   │   ├── DeploymentValidator.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── README.md
│   │   │   │   └── ZeroDowntimeMigrationManager.ts
│   │   │   ├── disaster-recovery/
│   │   │   │   ├── scripts/
│   │   │   │   │   ├── activate-replica.sh
│   │   │   │   │   ├── restore-config.sh
│   │   │   │   │   ├── restore-original-db.sh
│   │   │   │   │   └── restore-primary-region.sh
│   │   │   │   ├── BackupManager.ts
│   │   │   │   ├── ComprehensiveDisasterRecovery.ts
│   │   │   │   ├── config.json
│   │   │   │   ├── disaster-recovery-cli.ts
│   │   │   │   ├── DisasterRecoveryManager.ts
│   │   │   │   ├── IMPLEMENTATION_COMPLETE.md
│   │   │   │   ├── index.ts
│   │   │   │   ├── package-scripts.json
│   │   │   │   └── README.md
│   │   │   ├── docs/
│   │   │   │   ├── kenya-land-verification.md
│   │   │   │   ├── operational-excellence-guide.md
│   │   │   │   └── production-deployment-checklist.md
│   │   │   ├── examples/
│   │   │   │   └── production-setup.ts
│   │   │   ├── health/
│   │   │   │   ├── DatabaseHealthMonitor.ts
│   │   │   │   ├── health-monitor.ts
│   │   │   │   └── index.ts
│   │   │   ├── integration/
│   │   │   │   ├── integration-cli.ts
│   │   │   │   ├── integration-test-runner.ts
│   │   │   │   ├── ProductionReadinessAssessment.ts
│   │   │   │   ├── run-production-assessment.ts
│   │   │   │   ├── simple-assessment.cjs
│   │   │   │   └── SystemIntegrationValidator.ts
│   │   │   ├── migrations/
│   │   │   │   ├── communication/
│   │   │   │   │   ├── 001_create_communication_tables.sql
│   │   │   │   │   └── index.ts
│   │   │   │   ├── core/
│   │   │   │   │   ├── files/
│   │   │   │   │   │   └── 001_initial_schema.sql
│   │   │   │   │   ├── meta/
│   │   │   │   │   │   ├── _journal.json
│   │   │   │   │   │   └── 0000_snapshot.json
│   │   │   │   │   ├── 001_create_comprehensive_tables.sql
│   │   │   │   │   └── README.md
│   │   │   │   ├── fraud/
│   │   │   │   │   ├── 001_create_fraud_detection_tables.sql
│   │   │   │   │   └── index.ts
│   │   │   │   ├── performance/
│   │   │   │   │   └── 001_create_performance_indexes.sql
│   │   │   │   ├── trust/
│   │   │   │   │   ├── 001_create_trust_system_tables.sql
│   │   │   │   │   └── index.ts
│   │   │   │   ├── verification/
│   │   │   │   │   ├── 001_create_land_verification_tables.sql
│   │   │   │   │   └── index.ts
│   │   │   │   ├── 0000_daffy_skrulls.sql
│   │   │   │   ├── index.ts
│   │   │   │   ├── migration-cli.ts
│   │   │   │   ├── migration-executor.ts
│   │   │   │   ├── migration-loader.ts
│   │   │   │   ├── migration-manager.ts
│   │   │   │   ├── migration-registry.ts
│   │   │   │   ├── README.md
│   │   │   │   └── update-package-scripts.ts
│   │   │   ├── performance/
│   │   │   │   ├── index.ts
│   │   │   │   ├── LoadTestingFramework.ts
│   │   │   │   ├── performance-cli.ts
│   │   │   │   ├── PerformanceCertificationSystem.ts
│   │   │   │   └── PerformanceMonitoringDashboard.ts
│   │   │   ├── replication/
│   │   │   │   ├── scripts/
│   │   │   │   │   └── 01-setup-replication.sh
│   │   │   │   ├── FailoverManager.ts
│   │   │   │   ├── haproxy.cfg
│   │   │   │   ├── pg_hba.conf
│   │   │   │   ├── postgresql-primary.conf
│   │   │   │   ├── postgresql-replica.conf
│   │   │   │   ├── ReplicationManager.ts
│   │   │   │   └── setup-ha.ts
│   │   │   ├── reporting/
│   │   │   ├── schemas/
│   │   │   │   ├── analytics/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── communication/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── core/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── fraud/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── trust/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── verification/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── consolidated.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── README.md
│   │   │   │   └── validation.ts
│   │   │   ├── scripts/
│   │   │   │   ├── database-setup/
│   │   │   │   │   └── initialize-database.ts
│   │   │   │   ├── cleanup-redundant-files.ts
│   │   │   │   ├── consolidate-database-files.ts
│   │   │   │   ├── consolidate-database-infrastructure.ts
│   │   │   │   ├── consolidate-schemas.ts
│   │   │   │   ├── data-pipeline.ts
│   │   │   │   ├── deploy-land-verification.ts
│   │   │   │   ├── deploy.ts
│   │   │   │   ├── execute-production-deployment.ts
│   │   │   │   ├── load-data.ts
│   │   │   │   ├── remove-empty-dirs.ts
│   │   │   │   ├── reset.ts
│   │   │   │   ├── run-disaster-recovery-test.ts
│   │   │   │   ├── run-performance-certification.ts
│   │   │   │   ├── run-production-readiness-assessment.ts
│   │   │   │   ├── run-security-validation.ts
│   │   │   │   ├── seed-data.ts
│   │   │   │   ├── setup-database.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── test-connection.ts
│   │   │   │   ├── test-migration-system.ts
│   │   │   │   ├── test-schema-management.ts
│   │   │   │   ├── test-setup.ts
│   │   │   │   ├── unified-data-generation.ts
│   │   │   │   ├── validate-consolidation.ts
│   │   │   │   └── validate.ts
│   │   │   ├── security/
│   │   │   │   ├── ComplianceManager.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── security-cli.ts
│   │   │   │   ├── SecurityMonitor.ts
│   │   │   │   ├── SecurityReporting.ts
│   │   │   │   ├── SecuritySystem.ts
│   │   │   │   └── VulnerabilityScanner.ts
│   │   │   ├── seeds/
│   │   │   │   ├── generators/
│   │   │   │   │   ├── checkpoint-manager.ts
│   │   │   │   │   ├── community-insights-generator.py
│   │   │   │   │   ├── fraud_analysis_report.json
│   │   │   │   │   ├── fraud-reports-generator.py
│   │   │   │   │   ├── fraud-simulator.py
│   │   │   │   │   ├── fraudulent_property_dataset.json
│   │   │   │   │   ├── fraudulent_transaction_dataset.json
│   │   │   │   │   ├── fraudulent_user_dataset.json
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── integrate-data.ts
│   │   │   │   │   ├── KenyanDataGenerator.ts
│   │   │   │   │   ├── land-verification-generator.py
│   │   │   │   │   ├── optimized_land_dataset_statistics.json
│   │   │   │   │   ├── optimized_land_dataset.json
│   │   │   │   │   ├── property_dataset.json
│   │   │   │   │   ├── property_statistics.json
│   │   │   │   │   ├── property-generator.py
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── transaction_dataset.json
│   │   │   │   │   ├── user_dataset.json
│   │   │   │   │   ├── user_statistics.json
│   │   │   │   │   └── user-generator.py
│   │   │   │   ├── database-seeder.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── land-verification-seed.ts
│   │   │   │   ├── land-verification-system.ts
│   │   │   │   ├── land-verification.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── sample-ai-data.ts
│   │   │   │   ├── seed-kenya-properties.ts
│   │   │   │   └── UnifiedDataGenerator.ts
│   │   │   ├── types/
│   │   │   │   ├── database.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── analyzers/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── generators/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── unified-generator.ts
│   │   │   │   ├── migration-tools/
│   │   │   │   │   ├── consolidate-schemas.ts
│   │   │   │   │   ├── database-manager.ts
│   │   │   │   │   ├── fix-database.ts
│   │   │   │   │   ├── generate-test-chunks.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── inspect-schema.ts
│   │   │   │   │   ├── migrate-existing-properties.ts
│   │   │   │   │   ├── quality-gates.ts
│   │   │   │   │   ├── reset-and-create.ts
│   │   │   │   │   ├── robust-batch-loader.ts
│   │   │   │   │   ├── rollback-migration.ts
│   │   │   │   │   ├── run-migration.ts
│   │   │   │   │   └── validate-migration.ts
│   │   │   │   ├── validators/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── database-utils.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── init.ts
│   │   │   ├── MIGRATION_SUMMARY.md
│   │   │   ├── migration-plan.md
│   │   │   ├── OPTIMIZED_STRUCTURE.md
│   │   │   ├── PRODUCTION_DEPLOYMENT_GUIDE.md
│   │   │   ├── QueryOptimizer.ts
│   │   │   ├── README.md
│   │   │   ├── scripts-evaluation.md
│   │   │   └── service.ts
│   │   ├── deduplication/
│   │   │   ├── index.ts
│   │   │   └── RequestDeduplicator.ts
│   │   ├── email/
│   │   │   ├── email-config.ts
│   │   │   ├── email-service-init.ts
│   │   │   └── email.service.ts
│   │   ├── events/
│   │   │   └── EventBus.ts
│   │   ├── external-api/
│   │   ├── http/
│   │   │   └── resilient-client.ts
│   │   ├── monitoring/
│   │   │   ├── AlertingSystem.ts
│   │   │   ├── BuildPerformanceMonitor.ts
│   │   │   ├── CachePerformanceMonitor.ts
│   │   │   ├── index.ts
│   │   │   ├── logger.ts
│   │   │   ├── MonitoringDashboard.ts
│   │   │   ├── ObservabilitySystem.ts
│   │   │   ├── PerformanceMonitor.ts
│   │   │   ├── PrometheusMetrics.ts
│   │   │   └── QueryPerformanceMonitor.ts
│   │   ├── observability/
│   │   │   └── telemetry.ts
│   │   ├── rate-limiting/
│   │   │   ├── ApiCallTracker.ts
│   │   │   ├── ApiRateLimiter.ts
│   │   │   ├── CircuitBreaker.ts
│   │   │   └── index.ts
│   │   ├── storage/
│   │   │   └── storage.ts
│   │   ├── testing/
│   │   │   └── TestFramework.ts
│   │   ├── versioning/
│   │   │   ├── ApiDocumentation.ts
│   │   │   ├── ApiVersioning.ts
│   │   │   ├── ApiVersioningMiddleware.ts
│   │   │   ├── ApiVersionManager.ts
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   └── versioning.middleware.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── land-verification/
│   │   ├── audit/
│   │   │   └── AuditLogger.ts
│   │   ├── cache/
│   │   │   └── LandVerificationCache.ts
│   │   ├── error-handling/
│   │   │   ├── examples/
│   │   │   │   └── GovernmentApiIntegration.ts
│   │   │   ├── AuditLogger.ts
│   │   │   ├── ErrorHandlingService.ts
│   │   │   ├── FallbackManager.ts
│   │   │   ├── GracefulDegradationManager.ts
│   │   │   ├── README.md
│   │   │   └── RetryPolicyManager.ts
│   │   ├── errors/
│   │   │   └── LandVerificationErrors.ts
│   │   ├── health/
│   │   │   └── HealthCheckService.ts
│   │   ├── monitoring/
│   │   │   ├── AlertingService.ts
│   │   │   └── MetricsService.ts
│   │   ├── performance/
│   │   │   ├── AsyncProcessor.ts
│   │   │   ├── DatabaseOptimizer.ts
│   │   │   ├── PaginationService.ts
│   │   │   └── PerformanceManager.ts
│   │   ├── resilience/
│   │   │   ├── FallbackMechanisms.ts
│   │   │   ├── GracefulDegradation.ts
│   │   │   └── RetryPolicy.ts
│   │   ├── security/
│   │   │   ├── AccessControlService.ts
│   │   │   ├── AuditLogger.ts
│   │   │   ├── EncryptionService.ts
│   │   │   ├── PrivacyProtectionService.ts
│   │   │   └── SecurityIntegration.ts
│   │   ├── utils/
│   │   │   └── gps-calculations.ts
│   │   ├── AuditLogger.ts
│   │   ├── CommunityIntelligenceService.ts
│   │   ├── DocumentIntegration.ts
│   │   ├── ExpertCoordinationService.ts
│   │   ├── index.ts
│   │   ├── LandVerificationService.ts
│   │   ├── MonitoringService.ts
│   │   ├── PhysicalVerificationService.ts
│   │   ├── README.md
│   │   ├── ReportingService.ts
│   │   ├── RiskAssessmentService.ts
│   │   ├── ServiceFactory.ts
│   │   └── verification-business.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── cache.middleware.ts
│   │   ├── deduplication.middleware.ts
│   │   ├── error.ts
│   │   ├── index.ts
│   │   ├── logging.middleware.ts
│   │   ├── query-limiter.middleware.ts
│   │   ├── rate-limiting.middleware.ts
│   │   ├── README-auth-middleware.md
│   │   ├── README-centralized-error-handler.md
│   │   ├── UnifiedSecurityMiddleware.ts
│   │   └── validation.middleware.ts
│   ├── ml-core/
│   │   ├── deployment/
│   │   │   └── production-deployment-guide.md
│   │   ├── examples/
│   │   │   └── comprehensive-ml-integration.ts
│   │   ├── fraud-detection/
│   │   │   └── AdvancedFraudDetectionEngine.ts
│   │   ├── infrastructure/
│   │   │   └── ModelRegistry.ts
│   │   ├── orchestration/
│   │   │   └── MLOrchestrationService.ts
│   │   ├── property-valuation/
│   │   │   └── AutomatedValuationModel.ts
│   │   ├── training/
│   │   │   └── ContinuousLearningPipeline.ts
│   │   ├── trust-intelligence/
│   │   │   └── CommunityTrustEngine.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── monitoring/
│   │   ├── health.controller.ts
│   │   ├── HealthMonitor.ts
│   │   ├── monitoring.controller.ts
│   │   └── StructuredLogger.ts
│   ├── payments/
│   │   ├── index.ts
│   │   └── mpesa.service.ts
│   ├── professionals/
│   │   ├── index.ts
│   │   ├── professional.service.ts
│   │   └── professionals.controller.ts
│   ├── property/
│   │   ├── enhancements.controller.ts
│   │   ├── property-business.service.ts
│   │   ├── property.controller.ts
│   │   ├── property.repository.ts
│   │   └── property.service.ts
│   ├── reviews/
│   │   ├── index.ts
│   │   └── review.service.ts
│   ├── schemas/
│   │   ├── index.ts
│   │   ├── property.schema.ts
│   │   └── user.schema.ts
│   ├── search/
│   │   ├── search-business.controller.ts
│   │   └── search.controller.ts
│   ├── security/
│   │   └── SecurityHardening.ts
│   ├── shared/
│   │   ├── community-trust-schema.ts
│   │   └── email-types.ts
│   ├── tests/
│   │   ├── API_BUG_FIXES_SUMMARY.md
│   │   ├── api-bug-fixes.ts
│   │   ├── load-test-validation.ts
│   │   ├── load-test.ts
│   │   ├── run-api-tests.ts
│   │   ├── run-compatibility-tests.ts
│   │   ├── run-final-integration-tests.ts
│   │   ├── run-validation-tests.ts
│   │   ├── setup.ts
│   │   ├── simple-api-validation.js
│   │   ├── test-setup.ts
│   │   ├── validate-system-integration.ts
│   │   └── validation-report.md
│   ├── trust/
│   │   ├── community-trust.service.ts
│   │   ├── integration.controller.ts
│   │   ├── integration.service.ts
│   │   ├── trust.controller.ts
│   │   ├── TrustScoringService.ts
│   │   ├── verification.controller.test.ts
│   │   └── verification.controller.ts
│   ├── types/
│   │   ├── auth-constants.ts
│   │   ├── auth-errors.ts
│   │   ├── fraud.types.ts
│   │   ├── index.ts
│   │   ├── property.types.ts
│   │   ├── review.types.ts
│   │   ├── user.types.ts
│   │   └── verification.types.ts
│   ├── user/
│   │   ├── dashboard.controller.ts
│   │   ├── user.controller.ts
│   │   └── user.service.ts
│   ├── utils/
│   │   ├── cleanup-manager.ts
│   │   ├── constants.ts
│   │   ├── index.ts
│   │   ├── README.md
│   │   └── response-helpers.ts
│   ├── app.ts
│   ├── main.ts
│   ├── README.md
│   └── vite.ts
├── shared/
│   ├── types/
│   │   ├── api-contracts.ts
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── index.ts
│   │   ├── messaging.ts
│   │   └── property.ts
│   ├── tsconfig.json
├── tests/
│   ├── e2e/
│   │   ├── config/
│   │   │   └── test-config.ts
│   │   ├── helpers/
│   │   │   └── test-helpers.ts
│   │   └── README.md
│   ├── manual/
│   │   ├── components/
│   │   │   ├── AIModelManager.tsx
│   │   │   ├── PaymentSystemInterface.tsx
│   │   │   ├── race-condition-prevention.tsx
│   │   ├── property-hooks-test.tsx
│   │   ├── test-new-pages.tsx
│   │   └── test-safe-hooks.tsx
│   ├── server/
│   │   ├── test-critical-services.ts
│   │   ├── test-db-connection.ts
│   │   ├── test-email-mock.ts
│   │   ├── test-email-service.ts
│   │   └── test-integration.ts
│   ├── shared/
│   │   └── ConsolidatedTestFramework.tsx
│   ├── visual/
│   │   ├── helpers/
│   │   │   └── visual-test-utils.ts
│   │   ├── README.md
│   │   └── visual.config.ts
│   ├── setup.ts
│   ├── test-app-startup.ts
│   ├── test-db.cjs
│   ├── test-deployment.html
│   ├── test-env.ts
│   ├── test-imports.mjs
│   ├── test-imports.ts
│   ├── test-integration-simple.js
│   ├── test-with-jsdom.ts
│   └── validate-integration.js
├── types/
│   ├── css.d.ts
│   └── PropertyCardShowcase.css.d.ts
├── CLEANUP_REPORT.md
├── CSS_CLEANUP_REPORT.md
├── generate-structure.mjs
├── NEXT_PHASES_PLAN.md
├── package-lock.json
├── package.json
├── PHASE_12_COMPLETION_REPORT.md
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.check.json
├── tsconfig.json
├── tsconfig.server.json
```

## Excluded

The following are excluded from this view:
- Hidden files and directories (starting with `.`)
- `node_modules`
- `dist`
- `build`
- `.git`
- `coverage`
- `.next`
- `out`
- `__tests__`
- `vendor`
- `backup`
- `__pycache__`
- `target`
- `.venv`
- `venv`
- `tmp`
- `temp`

---
*Generated by Project Structure Generator*