# Database Directory Migration Plan

## Phase 1: Backup and Preparation

### Create Backup
```bash
# Create timestamped backup
cp -r database/ database_backup_$(date +%Y%m%d_%H%M%S)
cp -r server/infrastructure/database/ server_infrastructure_database_backup_$(date +%Y%m%d_%H%M%S)
```

### Verify Current State
```bash
# Count database references
grep -r "database/" --include="*.ts" --include="*.js" --include="*.json" . | grep -v node_modules | wc -l

# List all database scripts
grep "database/" package.json | wc -l
```

## Phase 2: Directory Structure Migration

### Target Structure
```
server/infrastructure/database/
├── config/
├── connection/
├── data-generation/
├── deployment/
├── disaster-recovery/
├── health/
├── migrations/
├── performance/
├── replication/
├── schemas/
├── scripts/
├── security/
├── seeds/
├── types/
└── utils/
```

### Migration Commands
```bash
# Create target directory structure
mkdir -p server/infrastructure/database/{config,connection,data-generation,deployment,disaster-recovery,health,migrations,performance,replication,schemas,scripts,security,seeds,types,utils}

# Move main database content (preserve existing server/infrastructure/database files)
rsync -av database/ server/infrastructure/database/ --exclude="*.md"

# Handle conflicts by merging
# - Keep existing server/infrastructure/database/connection.ts
# - Merge database/connection/ content into server/infrastructure/database/connection/
# - Update imports accordingly
```

## Phase 3: Configuration Updates

### Files to Update
1. **drizzle.config.ts**
   ```typescript
   export default defineConfig({
     out: "./server/infrastructure/database/migrations",
     schema: "./server/infrastructure/database/schemas/core/index.ts",
     // ... rest of config
   });
   ```

2. **package.json scripts** (64+ scripts to update)
   ```json
   {
     "db:migrate": "tsx server/infrastructure/database/migrations/migration-cli.ts migrate",
     "db:setup": "tsx server/infrastructure/database/scripts/setup-database.ts",
     "db:reset": "tsx server/infrastructure/database/scripts/reset.ts",
     // ... update all database/ references
   }
   ```

3. **Environment and Config Files**
   - Update any hardcoded paths in .env files
   - Update Docker configurations if present
   - Update CI/CD pipeline references

## Phase 4: Code Updates

### Import Statement Updates
```bash
# Find and update import statements
find . -name "*.ts" -o -name "*.js" | xargs grep -l "from.*database/" | while read file; do
    sed -i 's|from "database/|from "server/infrastructure/database/|g' "$file"
    sed -i "s|from 'database/|from 'server/infrastructure/database/|g" "$file"
done

# Update require statements
find . -name "*.ts" -o -name "*.js" | xargs grep -l "require.*database/" | while read file; do
    sed -i 's|require("database/|require("server/infrastructure/database/|g' "$file"
    sed -i "s|require('database/|require('server/infrastructure/database/|g" "$file"
done
```

### TypeScript Path Mapping (if needed)
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@database/*": ["server/infrastructure/database/*"]
    }
  }
}
```

## Phase 5: Validation and Testing

### Validation Script
```bash
#!/bin/bash
echo "=== Database Migration Validation ==="

# Check for broken references
echo "Checking for remaining database/ references..."
grep -r "database/" --include="*.ts" --include="*.js" --include="*.json" . | grep -v node_modules | grep -v server/infrastructure/database

# Test database connection
echo "Testing database connection..."
npm run db:test-connection

# Test migrations
echo "Testing migrations..."
npm run db:status

# Test build process
echo "Testing build..."
npm run build

echo "=== Validation Complete ==="
```

### Post-Migration Checklist
- [ ] All database files moved to new location
- [ ] Package.json scripts updated (64+ scripts)
- [ ] Drizzle config updated
- [ ] Import statements updated
- [ ] Database connection works
- [ ] Migrations run successfully
- [ ] Build process completes
- [ ] Tests pass
- [ ] Documentation updated

## Phase 6: Cleanup

### Remove Old Directory
```bash
# Only after validation passes
rm -rf database/
rm -rf database_backup_*  # Remove backups after confirming everything works
```

### Update Documentation
- Update README.md with new paths
- Update team documentation
- Update deployment guides

## Rollback Plan

### Emergency Rollback
```bash
#!/bin/bash
echo "=== EMERGENCY ROLLBACK ==="

# Stop all processes
npm run emergency-stop

# Restore from backup
if [ -d "database_backup_*" ]; then
    LATEST_BACKUP=$(ls -td database_backup_* | head -1)
    echo "Restoring from $LATEST_BACKUP"
    rm -rf database/
    cp -r "$LATEST_BACKUP" database/
    
    # Restore package.json
    git checkout package.json
    
    echo "Rollback complete. Please restart services."
else
    echo "No backup found! Manual recovery required."
fi
```

## Success Criteria
1. ✅ No broken import/require statements
2. ✅ Database connections functional
3. ✅ All npm scripts work with new paths
4. ✅ Migrations run without errors
5. ✅ Build process completes successfully
6. ✅ All tests pass
7. ✅ Team can run project locally
8. ✅ Deployment pipeline works

## Risk Mitigation
- **Backup Strategy**: Multiple backups before any changes
- **Incremental Migration**: Test each phase before proceeding
- **Validation Gates**: Automated checks at each step
- **Quick Rollback**: Scripted rollback procedure
- **Team Communication**: Coordinate with team before migration