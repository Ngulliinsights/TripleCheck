#!/bin/bash

# Naming Convention Verification Script
# Ensures no files violate naming conventions

echo "🔍 Verifying Naming Conventions..."
echo ""

ERRORS=0

# Check for version suffixes
echo "Checking for version suffixes (-v2, -v3, etc.)..."
VERSION_FILES=$(find . -type f \( -name "*-v[0-9]*.*" \) -not -path "./node_modules/*" -not -path "./.git/*")
if [ -n "$VERSION_FILES" ]; then
    echo "❌ Found files with version suffixes:"
    echo "$VERSION_FILES"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No version suffixes found"
fi
echo ""

# Check for temporal suffixes
echo "Checking for temporal suffixes (-new, -old, etc.)..."
TEMPORAL_FILES=$(find . -type f \( -name "*-new.*" -o -name "*-old.*" \) -not -path "./node_modules/*" -not -path "./.git/*")
if [ -n "$TEMPORAL_FILES" ]; then
    echo "❌ Found files with temporal suffixes:"
    echo "$TEMPORAL_FILES"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No temporal suffixes found"
fi
echo ""

# Check for backup files
echo "Checking for backup files..."
BACKUP_FILES=$(find . -type f \( -name "*backup*.*" -o -name "*.bak" -o -name "*~" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./server/infrastructure/database/disaster-recovery/*")
if [ -n "$BACKUP_FILES" ]; then
    echo "❌ Found backup files:"
    echo "$BACKUP_FILES"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No backup files found"
fi
echo ""

# Check for temp files
echo "Checking for temp files..."
TEMP_FILES=$(find . -type f \( -name "*.tmp" -o -name "*temp*.*" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./scripts/*")
if [ -n "$TEMP_FILES" ]; then
    echo "⚠️  Found temp files (may be intentional):"
    echo "$TEMP_FILES"
else
    echo "✅ No temp files found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All naming convention checks passed!"
    echo "   Code is clean and production-ready"
    exit 0
else
    echo "❌ Found $ERRORS naming convention violation(s)"
    echo "   Please fix the issues above"
    exit 1
fi
