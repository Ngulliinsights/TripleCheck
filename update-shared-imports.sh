#!/bin/bash

# Update all shared/ imports to point to server/infrastructure/shared/
echo "🔄 Updating shared imports to server/infrastructure/shared/..."

# Find all TypeScript/JavaScript files and update imports
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  grep -v node_modules | \
  grep -v .git | \
  while read file; do
    if [ -f "$file" ]; then
      # Update shared/api imports
      sed -i.bak 's|from "shared/api"|from "../../server/infrastructure/shared/api"|g' "$file"
      sed -i.bak 's|from '\''shared/api'\''|from '\''../../server/infrastructure/shared/api'\''|g' "$file"
      
      # Update shared/cache imports  
      sed -i.bak 's|from "shared/cache"|from "../../server/infrastructure/shared/cache"|g' "$file"
      sed -i.bak 's|from '\''shared/cache'\''|from '\''../../server/infrastructure/shared/cache'\''|g' "$file"
      
      # Update shared/validation imports
      sed -i.bak 's|from "shared/validation"|from "../../server/infrastructure/shared/validation"|g' "$file"
      sed -i.bak 's|from '\''shared/validation'\''|from '\''../../server/infrastructure/shared/validation'\''|g' "$file"
      
      # Remove backup files
      rm -f "$file.bak"
    fi
  done

echo "✅ Import paths updated"