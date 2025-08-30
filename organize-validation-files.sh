#!/bin/bash

# Simple validation file organization script
# Much simpler than the complex migrate-validation.sh

echo "🚀 Organizing validation files..."

# Create target directory
mkdir -p shared/validation

# Create subdirectories
mkdir -p shared/validation/core
mkdir -p shared/validation/forms
mkdir -p shared/validation/services
mkdir -p shared/validation/tests
mkdir -p shared/validation/utils

echo "📁 Created directory structure"

# Move core validation files
echo "📦 Moving core validation files..."

# Main validation utilities
if [ -f "src/shared/utils/validation.ts" ]; then
    cp "src/shared/utils/validation.ts" "shared/validation/core/"
    echo "✅ Copied validation.ts"
fi

if [ -f "src/shared/utils/form-validation.ts" ]; then
    cp "src/shared/utils/form-validation.ts" "shared/validation/forms/"
    echo "✅ Copied form-validation.ts"
fi

# Validation services
if [ -f "src/shared/services/validation-service-enhanced.ts" ]; then
    cp "src/shared/services/validation-service-enhanced.ts" "shared/validation/services/"
    echo "✅ Copied validation-service-enhanced.ts"
fi

# Schema file
if [ -f "src/shared/schema.ts" ]; then
    cp "src/shared/schema.ts" "shared/validation/core/"
    echo "✅ Copied schema.ts"
fi

# Route validator
if [ -f "src/shared/utils/route-validator.ts" ]; then
    cp "src/shared/utils/route-validator.ts" "shared/validation/utils/"
    echo "✅ Copied route-validator.ts"
fi

# Test files
echo "📦 Moving test files..."
if [ -d "src/shared/utils/__tests__" ]; then
    cp src/shared/utils/__tests__/*validation*.ts shared/validation/tests/ 2>/dev/null || true
    echo "✅ Copied validation test files"
fi

# Server validation tests
if [ -d "server/tests" ]; then
    cp server/tests/*validation*.ts shared/validation/tests/ 2>/dev/null || true
    echo "✅ Copied server validation test files"
fi

echo ""
echo "🎉 Organization complete!"
echo "📂 Files organized in: shared/validation/"
echo ""
echo "📋 Directory structure:"
find shared/validation -type f | sort

echo ""
echo "🔍 Next steps:"
echo "1. Review files in shared/validation/"
echo "2. Create index.ts files for each subdirectory"
echo "3. Update imports across the codebase"
echo "4. Remove old validation files after testing"