#!/bin/bash

# Migration script for optimized components
# Run this script to replace original components with optimized versions

echo "🚀 Migrating to optimized components..."

echo "Migrating PropertiesResidential..."
cp "src/property/pages/PropertiesResidential.tsx" "src/property/pages/PropertiesResidential.tsx.backup"
mv "src/property/pages/PropertiesResidential.optimized.tsx" "src/property/pages/PropertiesResidential.tsx"
echo "✅ PropertiesResidential migrated"

echo "Migrating Dashboard..."
cp "src/user/pages/Dashboard.tsx" "src/user/pages/Dashboard.tsx.backup"
mv "src/user/pages/Dashboard.optimized.tsx" "src/user/pages/Dashboard.tsx"
echo "✅ Dashboard migrated"

echo "🎉 Migration complete!"
echo "Original files backed up with .backup extension"
