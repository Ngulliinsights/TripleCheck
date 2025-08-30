#!/bin/bash

echo "🔧 Updating schema imports..."

# Files that import from src/shared/schema
files_to_update=(
    "server/controllers/property-enhancements.controller.ts"
    "server/controllers/user-dashboard.controller.ts"
    "server/controllers/__tests__/property-enhancements.integration.test.ts"
    "server/controllers/__tests__/user-dashboard.controller.test.ts"
    "server/fraud-detection/integrate-real-data.ts"
    "server/infrastructure/database/scripts/data-pipeline.ts"
    "server/infrastructure/database/scripts/database-setup/initialize-database.ts"
    "server/infrastructure/database/scripts/setup-database.ts"
    "server/infrastructure/database/scripts/validate.ts"
    "server/infrastructure/database/seeds/sample-ai-data.ts"
    "server/infrastructure/database/seeds/seed-kenya-properties.ts"
    "server/infrastructure/database/utils/migration-tools/database-manager.ts"
    "server/infrastructure/database/utils/migration-tools/migrate-existing-properties.ts"
    "server/infrastructure/database/utils/migration-tools/robust-batch-loader.ts"
    "server/infrastructure/database/utils/migration-tools/rollback-migration.ts"
    "server/infrastructure/database/utils/migration-tools/validate-migration.ts"
    "server/infrastructure/storage/storage.ts"
    "server/land-verification/CommunityIntelligenceService.ts"
    "server/land-verification/ExpertCoordinationService.ts"
    "server/land-verification/LandVerificationService.ts"
    "server/land-verification/middleware/auth.middleware.ts"
    "server/land-verification/MonitoringService.ts"
    "server/land-verification/RiskAssessmentService.ts"
    "server/land-verification/security/AccessControlService.ts"
    "server/land-verification/__tests__/MonitoringService.test.ts"
    "server/middleware/data-validation.ts"
    "server/routes/seed.ts"
    "server/services/CommunicationService.ts"
    "server/services/CommunityResourcesService.ts"
    "server/services/PropertyService.ts"
    "server/services/ReviewService.ts"
    "server/services/TrustIntegrationService.ts"
    "server/services/__tests__/AuthService.test.ts"
    "server/services/__tests__/ProfessionalService.integration.test.ts"
    "server/services/__tests__/ProfessionalService.test.ts"
    "server/services/__tests__/PropertyService.test.ts"
    "server/services/__tests__/ReviewService.test.ts"
    "server/services/__tests__/UserService.test.ts"
)

updated_count=0

for file in "${files_to_update[@]}"; do
    if [ -f "$file" ]; then
        # Update the import path
        if sed -i.bak 's|from.*src/shared/schema|from "shared/validation/core"|g' "$file" 2>/dev/null; then
            echo "✅ Updated: $file"
            ((updated_count++))
            # Remove backup file
            rm -f "${file}.bak" 2>/dev/null
        else
            echo "⚠️  Could not update: $file"
        fi
    else
        echo "❌ File not found: $file"
    fi
done

echo ""
echo "🎉 Updated $updated_count files"
echo ""
echo "📋 Summary of changes:"
echo "- Changed 'from \"../../src/shared/schema\"' to 'from \"shared/validation/core\"'"
echo "- Changed 'from \"../../../src/shared/schema\"' to 'from \"shared/validation/core\"'"
echo "- Changed 'from \"../../../../src/shared/schema\"' to 'from \"shared/validation/core\"'"
echo ""
echo "🔍 Next steps:"
echo "1. Test the application to ensure imports work correctly"
echo "2. Update any remaining relative path imports"
echo "3. Consider creating a path mapping in tsconfig.json for cleaner imports"