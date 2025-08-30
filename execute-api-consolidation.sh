#!/bin/bash

echo "🔄 Executing API Client Consolidation..."

# Update all shared/api imports to use consolidated unified-api-client
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    if [ -f "$file" ]; then
        # Calculate relative path to unified-api-client based on file location
        dir_depth=$(echo "$file" | grep -o "/" | wc -l)
        
        case $dir_depth in
            1) # src/file.ts
                relative_path="./shared/services/unified-api-client"
                ;;
            2) # src/folder/file.ts  
                relative_path="../shared/services/unified-api-client"
                ;;
            3) # src/folder/subfolder/file.ts
                relative_path="../../shared/services/unified-api-client"
                ;;
            4) # src/folder/subfolder/subsubfolder/file.ts
                relative_path="../../../shared/services/unified-api-client"
                ;;
            *) # Default fallback
                relative_path="../../shared/services/unified-api-client"
                ;;
        esac
        
        # Update shared/api imports
        sed -i.bak "s|from \"shared/api\"|from \"$relative_path\"|g" "$file"
        sed -i.bak "s|from 'shared/api'|from '$relative_path'|g" "$file"
        
        # Remove backup files
        rm -f "$file.bak"
    fi
done

# Update src/shared/utils/index.ts to export from unified-api-client
if [ -f "src/shared/utils/index.ts" ]; then
    sed -i.bak 's|export \* from "shared/api"|export * from "../services/unified-api-client"|g' "src/shared/utils/index.ts"
    rm -f "src/shared/utils/index.ts.bak"
fi

# Update src/shared/performance/index.ts 
if [ -f "src/shared/performance/index.ts" ]; then
    sed -i.bak 's|export { default as cacheService } from "shared/cache"|export { cacheService } from "../services/CacheService"|g' "src/shared/performance/index.ts"
    sed -i.bak 's|} from "shared/cache"|} from "../services/CacheService"|g' "src/shared/performance/index.ts"
    rm -f "src/shared/performance/index.ts.bak"
fi

echo "✅ API import consolidation complete"

# Clean up any remaining shared references in utils
echo "🧹 Final cleanup of shared references..."

# Update any remaining shared references in src/shared/utils/index.ts
if [ -f "src/shared/utils/index.ts" ]; then
    # Remove any remaining shared/cache references
    sed -i.bak 's|export \* from "shared/cache"|// Cache exports moved to CacheService|g' "src/shared/utils/index.ts"
    rm -f "src/shared/utils/index.ts.bak"
fi

echo "✅ Final cleanup complete"

echo ""
echo "📊 API Consolidation Summary:"
echo "- ✅ Updated all shared/api imports to use unified-api-client"
echo "- ✅ Fixed relative import paths based on file location"
echo "- ✅ Updated utility exports"
echo "- ✅ Single API client: src/shared/services/unified-api-client.ts"
echo ""
echo "🎯 Benefits:"
echo "- Single source of truth for API calls"
echo "- Consistent error handling and caching"
echo "- Reduced bundle size from duplicate API clients"
echo "- Cleaner import paths"