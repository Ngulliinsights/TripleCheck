#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import path from 'path'

import { glob } from 'glob'

interface TestFile {
  currentPath: string
  suggestedPath: string
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
  domain: string
}

const MIGRATION_PLAN: TestFile[] = [
  // Frontend test files embedded in production code
  
  // App domain tests
  {
    currentPath: 'src/app/__tests__/lazy-loading.test.tsx',
    suggestedPath: 'tests/unit/app/lazy-loading.test.tsx',
    type: 'unit',
    domain: 'app'
  },
  {
    currentPath: 'src/app/__tests__/lazy-routes.test.tsx',
    suggestedPath: 'tests/unit/app/lazy-routes.test.tsx',
    type: 'unit',
    domain: 'app'
  },
  {
    currentPath: 'src/app/__tests__/navigation-routing.test.tsx',
    suggestedPath: 'tests/unit/app/navigation-routing.test.tsx',
    type: 'unit',
    domain: 'app'
  },
  {
    currentPath: 'src/app/__tests__/router.test.tsx',
    suggestedPath: 'tests/unit/app/router.test.tsx',
    type: 'unit',
    domain: 'app'
  },

  // Auth domain tests
  {
    currentPath: 'src/auth/__tests__/auth-integration.test.tsx',
    suggestedPath: 'tests/integration/auth/auth-integration.test.tsx',
    type: 'integration',
    domain: 'auth'
  },
  {
    currentPath: 'src/auth/components/__tests__',
    suggestedPath: 'tests/unit/auth/components',
    type: 'unit',
    domain: 'auth'
  },
  {
    currentPath: 'src/auth/hooks/__tests__',
    suggestedPath: 'tests/unit/auth/hooks',
    type: 'unit',
    domain: 'auth'
  },
  {
    currentPath: 'src/auth/pages/__tests__',
    suggestedPath: 'tests/unit/auth/pages',
    type: 'unit',
    domain: 'auth'
  },

  // Infrastructure tests
  {
    currentPath: 'src/infrastructure/hooks/__tests__',
    suggestedPath: 'tests/unit/infrastructure/hooks',
    type: 'unit',
    domain: 'infrastructure'
  },
  {
    currentPath: 'src/infrastructure/routing/__tests__',
    suggestedPath: 'tests/unit/infrastructure/routing',
    type: 'unit',
    domain: 'infrastructure'
  },
  {
    currentPath: 'src/infrastructure/utils/__tests__',
    suggestedPath: 'tests/unit/infrastructure/utils',
    type: 'unit',
    domain: 'infrastructure'
  },

  // Land verification tests
  {
    currentPath: 'src/land-verification/components/__tests__',
    suggestedPath: 'tests/unit/land-verification/components',
    type: 'unit',
    domain: 'land-verification'
  },
  {
    currentPath: 'src/land-verification/services/__tests__',
    suggestedPath: 'tests/unit/land-verification/services',
    type: 'unit',
    domain: 'land-verification'
  },

  // Property tests
  {
    currentPath: 'src/property/components/__tests__',
    suggestedPath: 'tests/unit/property/components',
    type: 'unit',
    domain: 'property'
  },
  {
    currentPath: 'src/property/pages/__tests__',
    suggestedPath: 'tests/unit/property/pages',
    type: 'unit',
    domain: 'property'
  },
  {
    currentPath: 'src/property/tests/performanceTest.ts',
    suggestedPath: 'tests/performance/property/performance.test.ts',
    type: 'performance',
    domain: 'property'
  },
  {
    currentPath: 'src/property/tests/property-land-verification.test.ts',
    suggestedPath: 'tests/integration/property/land-verification.test.ts',
    type: 'integration',
    domain: 'property'
  },

  // Search tests
  {
    currentPath: 'src/search/components/__tests__',
    suggestedPath: 'tests/unit/search/components',
    type: 'unit',
    domain: 'search'
  },

  // Shared tests
  {
    currentPath: 'src/shared/components/__tests__',
    suggestedPath: 'tests/unit/shared/components',
    type: 'unit',
    domain: 'shared'
  },
  {
    currentPath: 'src/shared/hooks/__tests__',
    suggestedPath: 'tests/unit/shared/hooks',
    type: 'unit',
    domain: 'shared'
  },
  {
    currentPath: 'src/shared/pages/__tests__',
    suggestedPath: 'tests/unit/shared/pages',
    type: 'unit',
    domain: 'shared'
  },
  {
    currentPath: 'src/shared/services/__tests__',
    suggestedPath: 'tests/unit/shared/services',
    type: 'unit',
    domain: 'shared'
  },
  {
    currentPath: 'src/shared/test-utils/__tests__',
    suggestedPath: 'tests/unit/shared/test-utils',
    type: 'unit',
    domain: 'shared'
  },
  {
    currentPath: 'src/shared/utils/__tests__',
    suggestedPath: 'tests/unit/shared/utils',
    type: 'unit',
    domain: 'shared'
  },

  // Trust tests
  {
    currentPath: 'src/trust/pages/__tests__',
    suggestedPath: 'tests/unit/trust/pages',
    type: 'unit',
    domain: 'trust'
  },

  // Backend test files embedded in production code

  // AI tests
  {
    currentPath: 'server/ai/ml-training.test.ts',
    suggestedPath: 'tests/unit/server/ai/ml-training.test.ts',
    type: 'unit',
    domain: 'ai'
  },

  // Document auth tests
  {
    currentPath: 'server/document-auth/DocumentAuthService.land.test.ts',
    suggestedPath: 'tests/unit/server/document-auth/DocumentAuthService.land.test.ts',
    type: 'unit',
    domain: 'document-auth'
  },
  {
    currentPath: 'server/document-auth/analyzers/LandDocumentAnalyzer.test.ts',
    suggestedPath: 'tests/unit/server/document-auth/analyzers/LandDocumentAnalyzer.test.ts',
    type: 'unit',
    domain: 'document-auth'
  },

  // Land verification tests (keep some in domain, move others)
  {
    currentPath: 'server/land-verification/CommunityIntelligenceIntegration.test.ts',
    suggestedPath: 'tests/integration/server/land-verification/CommunityIntelligenceIntegration.test.ts',
    type: 'integration',
    domain: 'land-verification'
  },
  {
    currentPath: 'server/land-verification/CommunityIntelligenceService.test.ts',
    suggestedPath: 'tests/unit/server/land-verification/CommunityIntelligenceService.test.ts',
    type: 'unit',
    domain: 'land-verification'
  },
  {
    currentPath: 'server/land-verification/ExpertCoordinationService.test.ts',
    suggestedPath: 'tests/unit/server/land-verification/ExpertCoordinationService.test.ts',
    type: 'unit',
    domain: 'land-verification'
  },
  {
    currentPath: 'server/land-verification/integration.test.ts',
    suggestedPath: 'tests/integration/server/land-verification/integration.test.ts',
    type: 'integration',
    domain: 'land-verification'
  },
  {
    currentPath: 'server/land-verification/LandVerificationService.test.ts',
    suggestedPath: 'tests/unit/server/land-verification/LandVerificationService.test.ts',
    type: 'unit',
    domain: 'land-verification'
  },
  {
    currentPath: 'server/land-verification/RiskAssessmentService.test.ts',
    suggestedPath: 'tests/unit/server/land-verification/RiskAssessmentService.test.ts',
    type: 'unit',
    domain: 'land-verification'
  },

  // Middleware tests
  {
    currentPath: 'server/middleware/__tests__',
    suggestedPath: 'tests/unit/server/middleware',
    type: 'unit',
    domain: 'middleware'
  },

  // Property tests
  {
    currentPath: 'server/property/property-controller-integration.test.ts',
    suggestedPath: 'tests/integration/server/property/property-controller.test.ts',
    type: 'integration',
    domain: 'property'
  },
  {
    currentPath: 'server/property/property-e2e-integration.test.ts',
    suggestedPath: 'tests/e2e/server/property/property-e2e.test.ts',
    type: 'e2e',
    domain: 'property'
  },
  {
    currentPath: 'server/property/property-land-verification.test.ts',
    suggestedPath: 'tests/integration/server/property/land-verification.test.ts',
    type: 'integration',
    domain: 'property'
  },
  {
    currentPath: 'server/property/property-repository-integration.test.ts',
    suggestedPath: 'tests/integration/server/property/property-repository.test.ts',
    type: 'integration',
    domain: 'property'
  },

  // Routes tests
  {
    currentPath: 'server/routes/__tests__',
    suggestedPath: 'tests/unit/server/routes',
    type: 'unit',
    domain: 'routes'
  },

  // Services tests
  {
    currentPath: 'server/services/__tests__',
    suggestedPath: 'tests/unit/server/services',
    type: 'unit',
    domain: 'services'
  }
]

async function createDirectoryIfNotExists(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
    console.log(`📁 Created directory: ${dirPath}`)
  }
}

async function moveFile(from: string, to: string) {
  try {
    // Check if source exists
    await fs.access(from)
    
    // Create destination directory
    await createDirectoryIfNotExists(path.dirname(to))
    
    // Move the file
    await fs.rename(from, to)
    console.log(`✅ Moved: ${from} → ${to}`)
    
    return true
  } catch (error) {
    console.log(`⚠️  Could not move ${from}: ${error.message}`)
    return false
  }
}

async function moveDirectory(from: string, to: string) {
  try {
    // Check if source exists
    await fs.access(from)
    
    // Create destination directory
    await createDirectoryIfNotExists(path.dirname(to))
    
    // Move the directory
    await fs.rename(from, to)
    console.log(`✅ Moved directory: ${from} → ${to}`)
    
    return true
  } catch (error) {
    console.log(`⚠️  Could not move directory ${from}: ${error.message}`)
    return false
  }
}

async function updateImportPaths(filePath: string, oldPath: string, newPath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Update relative imports that might be broken
    const updatedContent = content
      .replace(/from ['"]\.\.\/\.\.\//g, 'from "../../../src/')
      .replace(/from ['"]\.\.\/\.\.\//g, 'from "../../../server/')
      .replace(/import ['"]\.\.\/\.\.\//g, 'import "../../../src/')
      .replace(/import ['"]\.\.\/\.\.\//g, 'import "../../../server/')
    
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent)
      console.log(`🔧 Updated imports in: ${filePath}`)
    }
  } catch (error) {
    console.log(`⚠️  Could not update imports in ${filePath}: ${error.message}`)
  }
}

async function migrateEmbeddedTests() {
  console.log('🚀 Starting migration of embedded test files...\n')
  
  let movedCount = 0
  let failedCount = 0
  
  // Create base test directories
  const testDirs = [
    'tests/unit',
    'tests/integration', 
    'tests/e2e',
    'tests/performance',
    'tests/security'
  ]
  
  for (const dir of testDirs) {
    await createDirectoryIfNotExists(dir)
  }
  
  // Process each migration
  for (const migration of MIGRATION_PLAN) {
    console.log(`\n📦 Processing ${migration.domain} (${migration.type}):`)
    
    try {
      // Check if it's a directory or file
      const stats = await fs.stat(migration.currentPath)
      
      if (stats.isDirectory()) {
        const success = await moveDirectory(migration.currentPath, migration.suggestedPath)
        if (success) {
          movedCount++
          
          // Update imports in moved files
          const files = await glob(`${migration.suggestedPath}/**/*.{ts,tsx,js,jsx}`)
          for (const file of files) {
            await updateImportPaths(file, migration.currentPath, migration.suggestedPath)
          }
        } else {
          failedCount++
        }
      } else {
        const success = await moveFile(migration.currentPath, migration.suggestedPath)
        if (success) {
          movedCount++
          await updateImportPaths(migration.suggestedPath, migration.currentPath, migration.suggestedPath)
        } else {
          failedCount++
        }
      }
    } catch (error) {
      console.log(`⚠️  ${migration.currentPath} does not exist or is inaccessible`)
      failedCount++
    }
  }
  
  // Clean up empty __tests__ directories
  console.log('\n🧹 Cleaning up empty __tests__ directories...')
  const emptyDirs = await glob('src/**/__tests__', { onlyDirectories: true })
  const serverEmptyDirs = await glob('server/**/__tests__', { onlyDirectories: true })
  
  for (const dir of [...emptyDirs, ...serverEmptyDirs]) {
    try {
      const files = await fs.readdir(dir)
      if (files.length === 0) {
        await fs.rmdir(dir)
        console.log(`🗑️  Removed empty directory: ${dir}`)
      }
    } catch (error) {
      // Directory might not be empty or might not exist
    }
  }
  
  // Generate summary
  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Successfully moved: ${movedCount} items`)
  console.log(`   ❌ Failed to move: ${failedCount} items`)
  console.log(`   📁 Total test directories created: ${testDirs.length}`)
  
  // Generate updated test commands
  console.log('\n🔧 Recommended package.json script updates:')
  console.log(`   "test:unit": "vitest run tests/unit"`)
  console.log(`   "test:integration": "vitest run tests/integration"`)
  console.log(`   "test:e2e": "vitest run tests/e2e"`)
  console.log(`   "test:performance": "vitest run tests/performance"`)
  console.log(`   "test:security": "vitest run tests/security"`)
  console.log(`   "test:domain:property": "vitest run tests/**/property"`)
  console.log(`   "test:domain:auth": "vitest run tests/**/auth"`)
  console.log(`   "test:domain:land-verification": "vitest run tests/**/land-verification"`)
  
  console.log('\n✨ Migration completed!')
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEmbeddedTests().catch(console.error)
}

export { migrateEmbeddedTests }