/**
 * Database Validation Utilities
 * 
 * Utilities for validating database schemas, data integrity,
 * and constraint compliance.
 */

import postgres from '..\..\..\..\..\scripts\cleanup-redundancies';

export interface DataIntegrityResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tablesChecked: number;
  recordsValidated: number;
}

export class DatabaseValidator {
  /**
   * Performs comprehensive data integrity checks
   */
  static async validateDataIntegrity(sql: postgres.Sql): Promise<DataIntegrityResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let tablesChecked = 0;
    let recordsValidated = 0;

    try {
      console.log('🔍 Performing data integrity validation...');

      // Check foreign key constraints
      const fkResult = await this.validateForeignKeyConstraints(sql);
      errors.push(...fkResult.errors);
      warnings.push(...fkResult.warnings);
      tablesChecked += fkResult.tablesChecked;
      recordsValidated += fkResult.recordsValidated;

      // Check business rule constraints
      const businessResult = await this.validateBusinessRules(sql);
      errors.push(...businessResult.errors);
      warnings.push(...businessResult.warnings);
      recordsValidated += businessResult.recordsValidated;

      // Check data consistency
      const consistencyResult = await this.validateDataConsistency(sql);
      errors.push(...consistencyResult.errors);
      warnings.push(...consistencyResult.warnings);
      recordsValidated += consistencyResult.recordsValidated;

      console.log(`✅ Data integrity validation completed. Checked ${tablesChecked} tables, validated ${recordsValidated} records`);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        tablesChecked,
        recordsValidated
      };
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        tablesChecked,
        recordsValidated
      };
    }
  }

  /**
   * Validates foreign key constraints
   */
  private static async validateForeignKeyConstraints(sql: postgres.Sql): Promise<DataIntegrityResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let tablesChecked = 0;
    let recordsValidated = 0;

    // Check properties -> users relationship
    const orphanedProperties = await sql`
      SELECT COUNT(*) as count FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE u.id IS NULL AND p.owner_id IS NOT NULL
    `;
    
    const orphanedPropertiesCount = Number(orphanedProperties[0]?.count);
    if (orphanedPropertiesCount > 0) {
      errors.push(`Found ${orphanedPropertiesCount} properties with invalid owner_id references`);
    }
    recordsValidated += orphanedPropertiesCount;
    tablesChecked++;

    // Check reviews -> properties relationship
    const orphanedReviewsProperties = await sql`
      SELECT COUNT(*) as count FROM reviews r
      LEFT JOIN properties p ON r.property_id = p.id
      WHERE p.id IS NULL
    `;
    
    const orphanedReviewsPropertiesCount = Number(orphanedReviewsProperties[0]?.count);
    if (orphanedReviewsPropertiesCount > 0) {
      errors.push(`Found ${orphanedReviewsPropertiesCount} reviews with invalid property_id references`);
    }
    recordsValidated += orphanedReviewsPropertiesCount;

    // Check reviews -> users relationship
    const orphanedReviewsUsers = await sql`
      SELECT COUNT(*) as count FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE u.id IS NULL
    `;
    
    const orphanedReviewsUsersCount = Number(orphanedReviewsUsers[0]?.count);
    if (orphanedReviewsUsersCount > 0) {
      errors.push(`Found ${orphanedReviewsUsersCount} reviews with invalid user_id references`);
    }
    recordsValidated += orphanedReviewsUsersCount;
    tablesChecked++;

    // Check favorites relationships
    const orphanedFavorites = await sql`
      SELECT COUNT(*) as count FROM favorites f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN properties p ON f.property_id = p.id
      WHERE u.id IS NULL OR p.id IS NULL
    `;
    
    const orphanedFavoritesCount = Number(orphanedFavorites[0]?.count);
    if (orphanedFavoritesCount > 0) {
      errors.push(`Found ${orphanedFavoritesCount} favorites with invalid references`);
    }
    recordsValidated += orphanedFavoritesCount;
    tablesChecked++;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      tablesChecked,
      recordsValidated
    };
  }

  /**
   * Validates business rule constraints
   */
  private static async validateBusinessRules(sql: postgres.Sql): Promise<Omit<DataIntegrityResult, 'tablesChecked'>> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let recordsValidated = 0;

    // Check review ratings are within valid range
    const invalidRatings = await sql`
      SELECT COUNT(*) as count FROM reviews
      WHERE rating < 1 OR rating > 5
    `;
    
    const invalidRatingsCount = Number(invalidRatings[0]?.count);
    if (invalidRatingsCount > 0) {
      errors.push(`Found ${invalidRatingsCount} reviews with invalid ratings (must be 1-5)`);
    }
    recordsValidated += invalidRatingsCount;

    // Check property prices are positive
    const invalidPrices = await sql`
      SELECT COUNT(*) as count FROM properties
      WHERE price <= 0
    `;
    
    const invalidPricesCount = Number(invalidPrices[0]?.count);
    if (invalidPricesCount > 0) {
      errors.push(`Found ${invalidPricesCount} properties with invalid prices (must be positive)`);
    }
    recordsValidated += invalidPricesCount;

    // Check trust scores are within valid range
    const invalidTrustScores = await sql`
      SELECT COUNT(*) as count FROM users
      WHERE trust_score < 0 OR trust_score > 100
    `;
    
    const invalidTrustScoresCount = Number(invalidTrustScores[0]?.count);
    if (invalidTrustScoresCount > 0) {
      errors.push(`Found ${invalidTrustScoresCount} users with invalid trust scores (must be 0-100)`);
    }
    recordsValidated += invalidTrustScoresCount;

    // Check for duplicate user emails
    const duplicateEmails = await sql`
      SELECT email, COUNT(*) as count FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
    `;
    
    if (duplicateEmails.length > 0) {
      errors.push(`Found ${duplicateEmails.length} duplicate email addresses`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordsValidated
    };
  }

  /**
   * Validates data consistency across tables
   */
  private static async validateDataConsistency(sql: postgres.Sql): Promise<Omit<DataIntegrityResult, 'tablesChecked'>> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let recordsValidated = 0;

    // Check that property view_count matches actual views (if property_views table exists)
    try {
      const viewCountMismatch = await sql`
        SELECT p.id, p.view_count, COALESCE(pv.actual_views, 0) as actual_views
        FROM properties p
        LEFT JOIN (
          SELECT property_id, COUNT(*) as actual_views
          FROM property_views
          GROUP BY property_id
        ) pv ON p.id = pv.property_id
        WHERE p.view_count != COALESCE(pv.actual_views, 0)
      `;
      
      if (viewCountMismatch.length > 0) {
        warnings.push(`Found ${viewCountMismatch.length} properties with inconsistent view counts`);
      }
      recordsValidated += viewCountMismatch.length;
    } catch {
      // property_views table might not exist yet, skip this check
    }

    // Check that property favorite_count matches actual favorites
    const favoriteCountMismatch = await sql`
      SELECT p.id, p.favorite_count, COALESCE(f.actual_favorites, 0) as actual_favorites
      FROM properties p
      LEFT JOIN (
        SELECT property_id, COUNT(*) as actual_favorites
        FROM favorites
        GROUP BY property_id
      ) f ON p.id = f.property_id
      WHERE p.favorite_count != COALESCE(f.actual_favorites, 0)
    `;
    
    if (favoriteCountMismatch.length > 0) {
      warnings.push(`Found ${favoriteCountMismatch.length} properties with inconsistent favorite counts`);
    }
    recordsValidated += favoriteCountMismatch.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordsValidated
    };
  }
}