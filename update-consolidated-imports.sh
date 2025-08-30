#!/bin/bash

echo "🔧 Updating imports to use consolidated implementations..."

# Function to update imports in a file
update_imports() {
    local file="$1"
    local updated=false
    
    if [ -f "$file" ]; then
        # Cache imports
        if grep -q "from.*CacheService\|from.*enhanced-cache-manager\|from.*cache.*service" "$file"; then
            sed -i.bak 's|from.*CacheService.*|from "shared/cache"|g' "$file"
            sed -i.bak 's|from.*enhanced-cache-manager.*|from "shared/cache"|g' "$file"
            sed -i.bak 's|from.*cache.*service.*|from "shared/cache"|g' "$file"
            updated=true
        fi
        
        # API client imports
        if grep -q "from.*api-client\|from.*unified-api-client\|from.*enhanced-api-client" "$file"; then
            sed -i.bak 's|from.*api-client.*|from "shared/api"|g' "$file"
            sed -i.bak 's|from.*unified-api-client.*|from "shared/api"|g' "$file"
            sed -i.bak 's|from.*enhanced-api-client.*|from "shared/api"|g' "$file"
            updated=true
        fi
        
        # Validation imports (already done but ensure consistency)
        if grep -q "from.*src/shared/utils/validation\|from.*src/shared/services/validation" "$file"; then
            sed -i.bak 's|from.*src/shared/utils/validation.*|from "shared/validation"|g' "$file"
            sed -i.bak 's|from.*src/shared/services/validation.*|from "shared/validation"|g' "$file"
            updated=true
        fi
        
        if [ "$updated" = true ]; then
            echo "✅ Updated: $file"
            # Remove backup file
            rm -f "${file}.bak" 2>/dev/null
        fi
    fi
}

# Find and update TypeScript and JavaScript files
echo "🔍 Scanning for files to update..."

# Update frontend files
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    update_imports "$file"
done

# Update server files
find server -name "*.ts" -o -name "*.js" | while read file; do
    update_imports "$file"
done

# Update shared files
find shared -name "*.ts" -o -name "*.js" | while read file; do
    update_imports "$file"
done

# Update test files
find . -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" | while read file; do
    update_imports "$file"
done

echo ""
echo "🎉 Import updates complete!"
echo ""
echo "📋 Summary of changes:"
echo "- Cache imports → 'shared/cache'"
echo "- API client imports → 'shared/api'"
echo "- Validation imports → 'shared/validation'"
echo ""
echo "🔍 Next steps:"
echo "1. Test the application to ensure imports work"
echo "2. Fix any remaining import issues manually"
echo "3. Remove old implementation files after verification"