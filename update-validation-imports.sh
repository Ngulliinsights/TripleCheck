#!/bin/bash

echo "🔍 Finding files that import validation modules..."

# Find files that import from the old validation paths
echo "Files importing from src/shared/utils/validation:"
grep -r "from.*src/shared/utils/validation" src/ server/ --include="*.ts" --include="*.tsx" || echo "None found"

echo ""
echo "Files importing from src/shared/utils/form-validation:"
grep -r "from.*src/shared/utils/form-validation" src/ server/ --include="*.ts" --include="*.tsx" || echo "None found"

echo ""
echo "Files importing from src/shared/services/validation-service-enhanced:"
grep -r "from.*src/shared/services/validation-service-enhanced" src/ server/ --include="*.ts" --include="*.tsx" || echo "None found"

echo ""
echo "Files importing from src/shared/utils/route-validator:"
grep -r "from.*src/shared/utils/route-validator" src/ server/ --include="*.ts" --include="*.tsx" || echo "None found"

echo ""
echo "Files importing from src/shared/schema:"
grep -r "from.*src/shared/schema" src/ server/ --include="*.ts" --include="*.tsx" || echo "None found"

echo ""
echo "📝 To update imports, you can now use:"
echo "1. Replace 'src/shared/utils/validation' with 'shared/validation/core'"
echo "2. Replace 'src/shared/utils/form-validation' with 'shared/validation/forms'"
echo "3. Replace 'src/shared/services/validation-service-enhanced' with 'shared/validation/services'"
echo "4. Replace 'src/shared/utils/route-validator' with 'shared/validation/utils'"
echo "5. Replace 'src/shared/schema' with 'shared/validation/core'"