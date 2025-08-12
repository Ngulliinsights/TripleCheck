# Execute Database Migration - Action Plan

## Current State Summary
- ✅ Database connection working
- ⚠️ 121 npm scripts need path updates
- ⚠️ 3 files have old import statements
- ⚠️ Drizzle config needs updating
- ⚠️ Directory duplication exists

## Step-by-Step Execution

### Phase 1: Pre-Migration Safety
```bash
# 1. Create backup
cp -r database/ database_backup_$(date +%Y%m%d_%H%M%S)
cp -r server/infrastructure/database/ server_infrastructure_backup_$(date +%Y%m%d_%H%M%S)
cp package.json package_backup.json
cp drizzle.config.ts drizzle_backup.config.ts

# 2. Commit current state
git add -A
git commit -m "Pre-migration backup: database structure consolidation"
```

### Phase 2: Directory Consolidation
```bash
# 3. Merge database/ into server/infrastructure/database/
# Use rsync to intelligently merge without overwriting existing files
rsync -av database/ server/infrastructure/database/ --ignore-existing

# 4. Handle specific conflicts manually:
# - Keep existing server/infrastructure/database/connection.ts
# - Merge database/connection/ content if needed
# - Preserve server/infrastructure/database/index.ts structure
```

### Phase 3: Configuration Updates
```bash
# 5. Update drizzle.config.ts
sed -i 's|out: "./database/migrations"|out: "./server/infrastructure/database/migrations"|g' drizzle.config.ts
sed -i 's|schema: "./database/schemas/core/index.ts"|schema: "./server/infrastructure/database/schemas/core/index.ts"|g' drizzle.config.ts
```

### Phase 4: Package Scripts Update (121 scripts)
```bash
# 6. Update all package.json scripts
# This will be handled by the migration script automatically
node scripts/migrate-database-structure.cjs --dry-run  # Test first
node scripts/migrate-database-structure.cjs           # Execute
```

### Phase 5: Import Statement Updates (3 files)
```bash
# 7. Update the 3 files with old imports:
# - database/scripts/consolidate-schemas.ts
# - src/shared/schema-compat.ts  
# - server/infrastructure/database/schemas/consolidated

# These will be updated automatically by the migration script
```

### Phase 6: Validation & Testing
```bash
# 8. Validate migration
node scripts/validate-database-structure.cjs

# 9. Test database operations
npm run db:test-connection
npm run db:status
npm run check  # TypeScript compilation

# 10. Test build process
npm run build
```

### Phase 7: Cleanup
```bash
# 11. Remove old database/ directory (only after validation passes)
rm -rf database/

# 12. Update documentation
# Update README.md, team docs, etc.
```

## Automated Migration Command

**Recommended approach:**
```bash
# Dry run first to see what will change
node scripts/migrate-database-structure.cjs --dry-run

# Execute migration
node scripts/migrate-database-structure.cjs

# Validate results
node scripts/validate-database-structure.cjs
```

## Success Criteria Checklist
- [ ] All 121 npm scripts updated to new paths
- [ ] Drizzle config points to server/infrastructure/database/
- [ ] All 3 import statements updated
- [ ] Database connection still works
- [ ] TypeScript compilation passes
- [ ] Build process completes
- [ ] No directory duplication
- [ ] Team can run project locally

## Risk Mitigation
- **Backups Created**: Multiple backup points for rollback
- **Dry Run Available**: Test migration without changes
- **Incremental Validation**: Check each phase before proceeding
- **Quick Rollback**: Restore from backups if needed

## Expected Timeline
- **Preparation**: 5 minutes (backups, git commit)
- **Migration**: 2-3 minutes (automated script)
- **Validation**: 5 minutes (testing, verification)
- **Total**: ~15 minutes

## Post-Migration Benefits
1. ✅ Single source of truth for database operations
2. ✅ Consistent with project architecture patterns
3. ✅ Reduced confusion for team members
4. ✅ Cleaner project structure
5. ✅ Easier maintenance and deployment

## Emergency Rollback
If anything goes wrong:
```bash
# Stop all processes
npm run emergency-stop

# Restore from backups
rm -rf database/ server/infrastructure/database/
cp -r database_backup_* database/
cp -r server_infrastructure_backup_* server/infrastructure/database/
cp package_backup.json package.json
cp drizzle_backup.config.ts drizzle.config.ts

# Restart
npm run dev
```

## Ready to Execute?
The migration is **low-risk** and **well-prepared**. All tools are in place for a smooth transition.

**Recommended next action:**
```bash
node scripts/migrate-database-structure.cjs --dry-run
```