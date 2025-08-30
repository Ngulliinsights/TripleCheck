#!/bin/bash

# Enhanced Validation Migration Script v2.0
# Consolidates all validation files with comprehensive discovery and reporting
# Features: Dynamic discovery, safe file handling, detailed reporting, error recovery

set -euo pipefail

# Color codes for enhanced output readability
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Configuration variables for flexible operation
readonly SCRIPT_VERSION="2.0"
readonly MIGRATION_DIR="shared/validation-migration"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly BACKUP_DIR="${MIGRATION_DIR}/backup_${TIMESTAMP}"
readonly LOG_FILE="${MIGRATION_DIR}/migration_${TIMESTAMP}.log"

# Global counters for comprehensive tracking
TOTAL_FILES=0
COPIED_FILES=0
MISSING_FILES=0
DUPLICATE_FILES=0
ERROR_FILES=0

# Function to display script header with version info
display_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          🚀 Enhanced Validation Migration Script v${SCRIPT_VERSION}       ║${NC}"
    echo -e "${BLUE}║          Comprehensive validation file consolidation          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}📅 Started:${NC} $(date)"
    echo -e "${CYAN}📂 Target:${NC} ${BACKUP_DIR}"
    echo -e "${CYAN}📝 Log:${NC} ${LOG_FILE}"
    echo
}

# Enhanced logging function with different levels
log() {
    local level="$1"
    local message="$2"
    local timestamp="[$(date '+%H:%M:%S')]"
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}${timestamp}${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}${timestamp} [WARNING]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}${timestamp} [ERROR]${NC} $message" | tee -a "$LOG_FILE" >&2
            ;;
        "SUCCESS")
            echo -e "${GREEN}${timestamp} [SUCCESS]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "PROGRESS")
            echo -e "${PURPLE}${timestamp}${NC} $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Create comprehensive directory structure
setup_migration_structure() {
    log "INFO" "🏗️  Setting up migration directory structure..."
    
    # Create all necessary directories with proper organization
    local directories=(
        "${BACKUP_DIR}/frontend/components"
        "${BACKUP_DIR}/frontend/hooks"
        "${BACKUP_DIR}/frontend/utils"
        "${BACKUP_DIR}/frontend/services"
        "${BACKUP_DIR}/backend/middleware"
        "${BACKUP_DIR}/backend/controllers"
        "${BACKUP_DIR}/backend/services"
        "${BACKUP_DIR}/backend/validators"
        "${BACKUP_DIR}/backend/routes"
        "${BACKUP_DIR}/config/environment"
        "${BACKUP_DIR}/config/database"
        "${BACKUP_DIR}/config/validation"
        "${BACKUP_DIR}/tests/unit"
        "${BACKUP_DIR}/tests/integration"
        "${BACKUP_DIR}/tests/helpers"
        "${BACKUP_DIR}/shared/types"
        "${BACKUP_DIR}/shared/constants"
        "${BACKUP_DIR}/shared/interfaces"
        "${BACKUP_DIR}/discovered/patterns"
        "${BACKUP_DIR}/discovered/misc"
        "${MIGRATION_DIR}/consolidated/core"
        "${MIGRATION_DIR}/consolidated/schemas"
        "${MIGRATION_DIR}/consolidated/rules"
        "${MIGRATION_DIR}/consolidated/adapters"
        "${MIGRATION_DIR}/consolidated/tests"
        "${MIGRATION_DIR}/consolidated/types"
        "${MIGRATION_DIR}/reports"
        "${MIGRATION_DIR}/logs"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir" || {
            log "ERROR" "Failed to create directory: $dir"
            return 1
        }
    done
    
    # Create log file directory and initialize it
    touch "$LOG_FILE"
    log "SUCCESS" "Migration structure created successfully"
}

# Enhanced file copy function with comprehensive error handling
copy_file_enhanced() {
    local source="$1"
    local dest_dir="$2"
    local category="$3"
    local subcategory="${4:-}"
    
    ((TOTAL_FILES++))
    
    # Validate source file exists and is readable
    if [[ ! -f "$source" ]]; then
        log "ERROR" "Source file not found: $source"
        ((MISSING_FILES++))
        return 1
    fi
    
    if [[ ! -r "$source" ]]; then
        log "ERROR" "Source file not readable: $source"
        ((ERROR_FILES++))
        return 1
    fi
    
    local filename=$(basename "$source")
    local dest_path="${dest_dir}/${filename}"
    
    # Handle subcategory organization
    if [[ -n "$subcategory" ]]; then
        local subdir="${dest_dir}/${subcategory}"
        mkdir -p "$subdir"
        dest_path="${subdir}/${filename}"
    fi
    
    # Handle duplicate filenames intelligently
    if [[ -f "$dest_path" ]]; then
        local name="${filename%.*}"
        local ext="${filename##*.}"
        local counter=1
        
        # Check if files are actually different
        if cmp -s "$source" "$dest_path"; then
            log "WARN" "Identical file already exists, skipping: $filename"
            ((DUPLICATE_FILES++))
            return 0
        fi
        
        # Find unique filename
        while [[ -f "${dest_dir}/${subcategory:+${subcategory}/}${name}_${counter}.${ext}" ]]; do
            ((counter++))
        done
        
        dest_path="${dest_dir}/${subcategory:+${subcategory}/}${name}_${counter}.${ext}"
        log "WARN" "Duplicate filename resolved: ${filename} → $(basename "$dest_path")"
    fi
    
    # Perform the copy with error handling
    if cp "$source" "$dest_path" 2>/dev/null; then
        log "SUCCESS" "✅ ${category}${subcategory:+ ($subcategory)}: $(basename "$source")"
        ((COPIED_FILES++))
        
        # Verify the copy was successful
        if [[ ! -f "$dest_path" ]] || [[ ! -s "$dest_path" ]]; then
            log "ERROR" "Copy verification failed: $dest_path"
            ((ERROR_FILES++))
            return 1
        fi
        
        return 0
    else
        log "ERROR" "Failed to copy: $source → $dest_path"
        ((ERROR_FILES++))
        return 1
    fi
}

# Comprehensive file discovery with multiple search strategies
discover_validation_files() {
    local search_dir="$1"
    local category="$2"
    
    log "PROGRESS" "🔍 Discovering validation files in $search_dir..."
    
    # Strategy 1: Pattern-based filename search
    local filename_patterns=(
        "*valid*"
        "*schema*"
        "*constraint*"
        "*check*"
        "*rule*"
        "*form*validation*"
        "*input*validation*"
        "*data*validation*"
    )
    
    # Strategy 2: Content-based search for validation keywords
    local content_keywords=(
        "validate"
        "validation"
        "validator"
        "schema"
        "constraint"
        "isValid"
        "validateForm"
        "checkConstraint"
        "validateInput"
    )
    
    # Strategy 3: File extension filtering
    local file_extensions=("*.ts" "*.js" "*.json" "*.sql" "*.d.ts")
    
    # Combine all search strategies
    for pattern in "${filename_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            [[ -n "$file" && -f "$file" ]] && {
                local subcategory=""
                case "$file" in
                    *hook*) subcategory="hooks" ;;
                    *component*) subcategory="components" ;;
                    *service*) subcategory="services" ;;
                    *util*) subcategory="utils" ;;
                    *middleware*) subcategory="middleware" ;;
                    *controller*) subcategory="controllers" ;;
                    *test*) subcategory="tests" ;;
                    *type*) subcategory="types" ;;
                esac
                
                copy_file_enhanced "$file" "${BACKUP_DIR}/${category}" "$category" "$subcategory"
            }
        done < <(find "$search_dir" -type f -name "$pattern" \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.sql" \) 2>/dev/null | \
                 grep -v node_modules | grep -v dist | grep -v build | grep -v .git | tr '\n' '\0')
    done
    
    # Content-based discovery for files that might not match naming patterns
    log "PROGRESS" "🔍 Performing content-based discovery in $search_dir..."
    for keyword in "${content_keywords[@]}"; do
        while IFS= read -r -d '' file; do
            [[ -n "$file" && -f "$file" ]] && {
                # Skip if already processed based on filename
                local basename_file=$(basename "$file")
                local already_processed=false
                
                for processed_file in "${BACKUP_DIR}/${category}"/**/*; do
                    [[ "$(basename "$processed_file")" == "$basename_file" ]] && {
                        already_processed=true
                        break
                    }
                done
                
                [[ "$already_processed" == false ]] && {
                    copy_file_enhanced "$file" "${BACKUP_DIR}/discovered" "Discovered-Content" "patterns"
                }
            }
        done < <(grep -r -l "$keyword" --include="*.ts" --include="*.js" --include="*.json" --include="*.sql" "$search_dir" 2>/dev/null | \
                 grep -v node_modules | grep -v dist | grep -v build | grep -v .git | tr '\n' '\0')
    done
}

# Process predefined file lists with enhanced organization
process_predefined_files() {
    log "INFO" "📋 Processing predefined validation files..."
    
    # Comprehensive frontend files with categorization
    local -A frontend_files=(
        # Core validation utilities
        ["src/utils/validation.ts"]="utils"
        ["src/utils/validators.ts"]="utils"
        ["src/utils/form-validation.ts"]="utils"
        ["src/shared/utils/validation.ts"]="utils"
        
        # React hooks for validation
        ["src/shared/hooks/useFormValidation.ts"]="hooks"
        ["src/shared/hooks/useFormValidation.test.ts"]="hooks"
        ["src/property/hooks/property-validation.ts"]="hooks"
        
        # Component validation
        ["src/components/forms/validation.ts"]="components"
        ["src/components/ui/form.tsx"]="components"
        ["src/components/forms/FormField.tsx"]="components"
        
        # Services
        ["src/services/ValidationService.ts"]="services"
        ["src/services/validation-service-enhanced.ts"]="services"
        
        # Domain-specific validation
        ["src/property/utils/property-validation.ts"]="domain"
        ["src/auth/validation/auth-validation.ts"]="domain"
        ["src/auth/utils/auth-validator.ts"]="domain"
        ["src/communication/validation/message-validation.ts"]="domain"
    )
    
    # Comprehensive backend files with categorization
    local -A backend_files=(
        # Middleware
        ["server/middleware/validation.middleware.ts"]="middleware"
        ["server/utils/validators/validation-middleware.ts"]="middleware"
        
        # Services
        ["server/services/ValidationService.ts"]="services"
        
        # Validators
        ["server/utils/validators/index.ts"]="validators"
        ["server/utils/validators/schema-validator.ts"]="validators"
        ["server/utils/validators/data-validator.ts"]="validators"
        ["server/utils/validators/business-rules-validator.ts"]="validators"
        
        # Controllers and routes
        ["server/controllers/validation.handlers.ts"]="controllers"
        ["server/routes/validation.routes.ts"]="routes"
        
        # API validation
        ["server/api/validation/request-validator.ts"]="api"
        ["server/api/validation/response-validator.ts"]="api"
        ["server/api/validation/schema-validator.ts"]="api"
        
        # Database validation
        ["server/infrastructure/database/schemas/validation.ts"]="database"
        ["server/infrastructure/database/schemas/constraints.ts"]="database"
        
        # Domain-specific backend validation
        ["server/property/validation/property-validation.ts"]="domain"
        ["server/property/validation/property-validator.ts"]="domain"
        ["server/property/validation/validation-rules.ts"]="domain"
        ["server/auth/validation/auth-validation.ts"]="domain"
        ["server/auth/validation/user-validation.ts"]="domain"
        ["server/auth/validation/permission-validation.ts"]="domain"
        ["server/communication/validation/message-validation.ts"]="domain"
    )
    
    # Configuration files
    local -A config_files=(
        ["config/validation.config.ts"]="validation"
        ["drizzle/migrations/validation-triggers.sql"]="database"
        ["drizzle/migrations/constraints.sql"]="database"
        ["drizzle/migrations/check-constraints.sql"]="database"
        ["server/infrastructure/database/validation/constraints.sql"]="database"
        ["scripts/validate-config.ts"]="validation"
        [".env.validation"]="environment"
    )
    
    # Test files
    local -A test_files=(
        ["tests/unit/validation/validation.test.ts"]="unit"
        ["tests/unit/validation/schema-validation.test.ts"]="unit"
        ["tests/unit/validation/business-rules.test.ts"]="unit"
        ["tests/integration/validation/api-validation.test.ts"]="integration"
        ["tests/integration/validation/database-validation.test.ts"]="integration"
        ["tests/integration/validation/end-to-end-validation.test.ts"]="integration"
        ["src/test-utils/validation-helpers.ts"]="helpers"
        ["tests/helpers/validation-test-helpers.ts"]="helpers"
    )
    
    # Type definition files
    local -A type_files=(
        ["types/validation.types.ts"]="types"
        ["src/types/validation.ts"]="types"
        ["server/types/validation.types.ts"]="types"
        ["shared/types/validation.d.ts"]="types"
        ["src/validation/validation.types.ts"]="types"
    )
    
    # Process each category
    log "PROGRESS" "Processing frontend files..."
    for file in "${!frontend_files[@]}"; do
        copy_file_enhanced "$file" "${BACKUP_DIR}/frontend" "Frontend" "${frontend_files[$file]}"
    done
    
    log "PROGRESS" "Processing backend files..."
    for file in "${!backend_files[@]}"; do
        copy_file_enhanced "$file" "${BACKUP_DIR}/backend" "Backend" "${backend_files[$file]}"
    done
    
    log "PROGRESS" "Processing configuration files..."
    for file in "${!config_files[@]}"; do
        copy_file_enhanced "$file" "${BACKUP_DIR}/config" "Config" "${config_files[$file]}"
    done
    
    log "PROGRESS" "Processing test files..."
    for file in "${!test_files[@]}"; do
        copy_file_enhanced "$file" "${BACKUP_DIR}/tests" "Test" "${test_files[$file]}"
    done
    
    log "PROGRESS" "Processing type definition files..."
    for file in "${!type_files[@]}"; do
        copy_file_enhanced "$file" "${BACKUP_DIR}/shared" "Types" "${type_files[$file]}"
    done
}

# Generate comprehensive HTML report with enhanced styling
generate_html_report() {
    local report_file="${MIGRATION_DIR}/reports/migration_report_${TIMESTAMP}.html"
    
    log "INFO" "📊 Generating comprehensive HTML report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Migration Report - ${TIMESTAMP}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 5px solid #667eea;
        }
        .stat-number { font-size: 3em; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 1.1em; color: #666; margin-top: 10px; }
        
        .success-rate {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            border-left-color: #11998e;
        }
        .success-rate .stat-number { color: white; }
        .success-rate .stat-label { color: rgba(255,255,255,0.9); }
        
        .section {
            background: white;
            margin-bottom: 20px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-header {
            background: #667eea;
            color: white;
            padding: 20px;
            font-size: 1.3em;
            font-weight: bold;
        }
        .section-content { padding: 30px; }
        
        .file-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .file-category {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            overflow: hidden;
        }
        .file-category-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #e1e5e9;
            font-weight: bold;
            color: #495057;
        }
        .file-list {
            max-height: 300px;
            overflow-y: auto;
            background: #fff;
        }
        .file-item {
            padding: 8px 15px;
            border-bottom: 1px solid #f1f3f4;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
        }
        .file-item:hover { background: #f8f9fa; }
        
        .next-steps {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-radius: 10px;
            padding: 30px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #8b4513;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        .step {
            background: rgba(255,255,255,0.8);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #ff6b6b;
        }
        .step-number {
            background: #ff6b6b;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-weight: bold;
        }
        
        .commands {
            background: #1e1e1e;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Monaco', 'Consolas', monospace;
            overflow-x: auto;
            margin: 20px 0;
        }
        .commands pre { color: #f8f8f2; }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #666;
            background: white;
            border-radius: 10px;
            margin-top: 30px;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .stats-grid { grid-template-columns: 1fr; }
            .file-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Validation Migration Report</h1>
            <p><strong>Generated:</strong> $(date)</p>
            <p><strong>Script Version:</strong> ${SCRIPT_VERSION}</p>
            <p><strong>Migration Directory:</strong> ${BACKUP_DIR}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${TOTAL_FILES}</div>
                <div class="stat-label">Total Files Scanned</div>
            </div>
            <div class="stat-card success-rate">
                <div class="stat-number">${COPIED_FILES}</div>
                <div class="stat-label">Successfully Copied</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${MISSING_FILES}</div>
                <div class="stat-label">Missing Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${DUPLICATE_FILES}</div>
                <div class="stat-label">Duplicates Handled</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">📁 Migration File Structure</div>
            <div class="section-content">
                <div class="file-grid">
                    <div class="file-category">
                        <div class="file-category-header">Frontend Files</div>
                        <div class="file-list">
$(find "${BACKUP_DIR}/frontend" -type f 2>/dev/null | head -20 | while read file; do
    echo "                            <div class=\"file-item\">$(basename "$file")</div>"
done)
$([ $(find "${BACKUP_DIR}/frontend" -type f 2>/dev/null | wc -l) -gt 20 ] && echo "                            <div class=\"file-item\">... and $(($(find "${BACKUP_DIR}/frontend" -type f 2>/dev/null | wc -l) - 20)) more files</div>")
                        </div>
                    </div>
                    
                    <div class="file-category">
                        <div class="file-category-header">Backend Files</div>
                        <div class="file-list">
$(find "${BACKUP_DIR}/backend" -type f 2>/dev/null | head -20 | while read file; do
    echo "                            <div class=\"file-item\">$(basename "$file")</div>"
done)
$([ $(find "${BACKUP_DIR}/backend" -type f 2>/dev/null | wc -l) -gt 20 ] && echo "                            <div class=\"file-item\">... and $(($(find "${BACKUP_DIR}/backend" -type f 2>/dev/null | wc -l) - 20)) more files</div>")
                        </div>
                    </div>
                    
                    <div class="file-category">
                        <div class="file-category-header">Configuration Files</div>
                        <div class="file-list">
$(find "${BACKUP_DIR}/config" -type f 2>/dev/null | while read file; do
    echo "                            <div class=\"file-item\">$(basename "$file")</div>"
done)
                        </div>
                    </div>
                    
                    <div class="file-category">
                        <div class="file-category-header">Test Files</div>
                        <div class="file-list">
$(find "${BACKUP_DIR}/tests" -type f 2>/dev/null | while read file; do
    echo "                            <div class=\"file-item\">$(basename "$file")</div>"
done)
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="next-steps">
            <h3>🎯 Next Steps for Consolidation</h3>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Review and Analyze:</strong> Examine all migrated files to understand current validation patterns and identify commonalities.
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Design Unified Schema:</strong> Create a comprehensive validation schema that consolidates all validation rules.
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Implement Core Library:</strong> Build a centralized validation library in shared/validation/.
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Update References:</strong> Systematically update all imports to use the new centralized validation system.
            </div>
            <div class="step">
                <span class="step-number">5</span>
                <strong>Test Migration:</strong> Run comprehensive tests to ensure all validation functionality works correctly.
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">🔧 Quick Analysis Commands</div>
            <div class="section-content">
                <div class="commands">
<pre># Count files by category
echo "Frontend: \$(find ${BACKUP_DIR}/frontend -type f | wc -l) files"
echo "Backend: \$(find ${BACKUP_DIR}/backend -type f | wc -l) files"
echo "Config: \$(find ${BACKUP_DIR}/config -type f | wc -l) files"
echo "Tests: \$(find ${BACKUP_DIR}/tests -type f | wc -l) files"

# Search for validation patterns
grep -r "validate\|schema\|constraint" ${BACKUP_DIR}/ | head -20

# Find TypeScript validation interfaces
find ${BACKUP_DIR} -name "*.ts" -exec grep -l "interface.*Valid\|type.*Valid" {} \;

# Identify validation libraries used
grep -r "import.*valid\|require.*valid" ${BACKUP_DIR}/ | cut -d: -f2 | sort | uniq</pre>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Migration completed successfully! 🎉</p>
            <p>For detailed logs, check: ${LOG_FILE}</p>
        </div>
    </div>
</body>
</html>
EOF
    
    log "SUCCESS" "HTML report generated: $report_file"
}

# Generate detailed text summary
generate_text_summary() {
    local summary_file="${MIGRATION_DIR}/MIGRATION_SUMMARY_${TIMESTAMP}.txt"
    
    cat > "$summary_file" << EOF
COMPREHENSIVE VALIDATION MIGRATION SUMMARY
==========================================
Script Version: ${SCRIPT_VERSION}
Date: $(date)
Migration Directory: ${BACKUP_DIR}

MIGRATION STATISTICS:
====================
Total Files Scanned:    ${TOTAL_FILES}
Successfully Copied:    ${COPIED_FILES}
Missing Files:          ${MISSING_FILES}
Duplicate Files:        ${DUPLICATE_FILES}
Error Files:            ${ERROR_FILES}

Success Rate: $(( COPIED_FILES * 100 / (TOTAL_FILES == 0 ? 1 : TOTAL_FILES) ))%

FILE DISTRIBUTION:
==================
Frontend Files:     $(find "${BACKUP_DIR}/frontend" -type f 2>/dev/null | wc -l)
Backend Files:      $(find "${BACKUP_DIR}/backend" -type f 2>/dev/null | wc -l)
Configuration:      $(find "${BACKUP_DIR}/config" -type f 2>/dev/null | wc -l)
Test Files:         $(find "${BACKUP_DIR}/tests" -type f 2>/dev/null | wc -l)
Type Definitions:   $(find "${BACKUP_DIR}/shared" -type f 2>/dev/null | wc -l)
Discovered Files:   $(find "${BACKUP_DIR}/discovered" -type f 2>/dev/null | wc -l)

DIRECTORY STRUCTURE:
===================
$(find "${BACKUP_DIR}" -type d | sort | sed 's|[^/]*/|  |g')

FILE ANALYSIS:
==============
TypeScript Files:   $(find "${BACKUP_DIR}" -name "*.ts" | wc -l)
JavaScript Files:   $(find "${BACKUP_DIR}" -name "*.js" | wc -l)
JSON Files:         $(find "${BACKUP_DIR}" -name "*.json" | wc -l)
SQL Files:          $(find "${BACKUP_DIR}" -name "*.sql" | wc -l)

VALIDATION PATTERNS FOUND:
==========================
$(grep -r "validate\|validation\|schema\|constraint" "${BACKUP_DIR}/" 2>/dev/null | cut -d: -f1 | sort | uniq -c | head -10)

NEXT STEPS:
===========
1. Review migrated files in: ${BACKUP_DIR}
2. Open HTML report: ${MIGRATION_DIR}/reports/migration_report_${TIMESTAMP}.html
3. Analyze validation patterns
4. Design unified validation schema
5. Implement consolidated validation system
6. Update all imports and references
7. Run comprehensive tests

QUICK COMMANDS:
===============
# Open migration directory
cd ${BACKUP_DIR}

# Search for specific validation patterns
grep -r "Joi\|Yup\|Zod\|Ajv" ${BACKUP_DIR}/

# Find all validation interfaces
find ${BACKUP_DIR} -name "*.ts" -exec grep -l "interface.*Valid\|type.*Valid" {} \;

# Count validation functions
grep -r "function.*valid\|const.*valid" ${BACKUP_DIR}/ | wc -l

# Analyze validation dependencies
grep -r "import.*from.*valid\|require.*valid" ${BACKUP_DIR}/ | sort | uniq

CONTACT INFO:
=============
For issues or questions about this migration:
- Check the log file: ${LOG_FILE}
- Review the HTML report for detailed analysis
- Use the quick commands above for further investigation

Migration completed at: $(date)
EOF
    
    log "SUCCESS" "Text summary generated: $summary_file"
}

# Create consolidation roadmap
create_consolidation_roadmap() {
    local roadmap_file="${MIGRATION_DIR}/CONSOLIDATION_ROADMAP.md"
    
    log "INFO" "🗺️  Creating consolidation roadmap..."
    
    cat > "$roadmap_file" << EOF
# 🚀 Validation System Consolidation Roadmap

Generated: $(date)
Migration Directory: \`${BACKUP_DIR}\`

## 📋 Phase 1: Analysis and Planning (Week 1)

### 1.1 File Analysis
- [ ] Review all migrated files in each category
- [ ] Document current validation patterns and approaches
- [ ] Identify validation libraries in use (Joi, Yup, Zod, custom, etc.)
- [ ] Map validation rules to business domains
- [ ] Identify redundant or conflicting validation logic

### 1.2 Dependency Mapping
- [ ] List all validation-related dependencies
- [ ] Identify version conflicts
- [ ] Document external validation services
- [ ] Map validation to database constraints

### 1.3 Architecture Design
- [ ] Design unified validation schema structure
- [ ] Plan validation rule hierarchy
- [ ] Design error handling strategy
- [ ] Plan backwards compatibility approach

## 🏗️ Phase 2: Core Implementation (Week 2-3)

### 2.1 Core Validation Library
- [ ] Create \`shared/validation/core/\` structure
- [ ] Implement base validation engine
- [ ] Create schema definition system
- [ ] Implement rule composition system
- [ ] Add error aggregation and reporting

### 2.2 Schema Consolidation
- [ ] Migrate all schemas to unified format
- [ ] Create domain-specific schema modules
- [ ] Implement schema inheritance and composition
- [ ] Add schema versioning support

### 2.3 Rule Engine
- [ ] Implement business rule validation
- [ ] Create custom validator registration system
- [ ] Add async validation support
- [ ] Implement conditional validation logic

## 🔧 Phase 3: Integration and Migration (Week 4)

### 3.1 Adapter Creation
- [ ] Create adapters for existing validation libraries
- [ ] Implement migration utilities
- [ ] Create import/export tools for validation rules
- [ ] Build compatibility layers

### 3.2 Frontend Integration
- [ ] Update React hooks to use new validation system
- [ ] Migrate form validation components
- [ ] Update validation error handling
- [ ] Test all form validation workflows

### 3.3 Backend Integration
- [ ] Update Express middleware
- [ ] Migrate API validation
- [ ] Update database validation triggers
- [ ] Test all API endpoints

## 🧪 Phase 4: Testing and Validation (Week 5)

### 4.1 Test Migration
- [ ] Migrate all existing validation tests
- [ ] Create integration tests for new system
- [ ] Add performance benchmarks
- [ ] Create migration verification tests

### 4.2 Quality Assurance
- [ ] Run full test suite
- [ ] Perform load testing on validation system
- [ ] Test error handling and edge cases
- [ ] Validate performance impact

### 4.3 Documentation
- [ ] Create API documentation
- [ ] Write migration guide
- [ ] Create best practices guide
- [ ] Document troubleshooting procedures

## 📊 Success Metrics

- [ ] All existing validation functionality preserved
- [ ] Improved validation performance (target: 20% faster)
- [ ] Reduced code duplication (target: 50% reduction)
- [ ] Simplified validation rule management
- [ ] Comprehensive error reporting
- [ ] Zero breaking changes for end users

## 🚨 Risk Mitigation

### High Priority Risks
1. **Breaking Changes**: Maintain backwards compatibility during transition
2. **Performance Impact**: Monitor validation performance closely
3. **Data Integrity**: Ensure no validation rules are lost during migration
4. **User Experience**: Maintain consistent error messages and behaviors

### Mitigation Strategies
- Implement feature flags for gradual rollout
- Maintain parallel validation systems during transition
- Create comprehensive rollback procedures
- Implement monitoring and alerting for validation failures

## 🔍 Quick Analysis Commands

\`\`\`bash
# Analyze validation patterns
grep -r "validate\|validation" ${BACKUP_DIR}/ | cut -d: -f1 | sort | uniq -c | sort -nr

# Find validation libraries
grep -r "joi\|yup\|zod\|ajv" ${BACKUP_DIR}/ | cut -d: -f1 | sort | uniq

# Count validation functions by type
echo "Sync validators: \$(grep -r "function.*validate\|const.*validate" ${BACKUP_DIR}/ | grep -v async | wc -l)"
echo "Async validators: \$(grep -r "async.*validate\|validate.*async" ${BACKUP_DIR}/ | wc -l)"

# Identify validation schemas
find ${BACKUP_DIR} -name "*.ts" -exec grep -l "schema\|Schema" {} \; | wc -l
\`\`\`

## 📅 Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Analysis | 1 week | Documentation, architecture design |
| Implementation | 2 weeks | Core validation system, unified schemas |
| Integration | 1 week | Frontend/backend integration, adapters |
| Testing | 1 week | Complete test suite, performance validation |

**Total Estimated Time: 5 weeks**

---

*This roadmap should be customized based on your specific project requirements and constraints.*
EOF
    
    log "SUCCESS" "Consolidation roadmap created: $roadmap_file"
}

# Cleanup function for graceful error handling
cleanup_on_error() {
    log "ERROR" "Script interrupted. Performing cleanup..."
    
    # Create error report
    cat > "${MIGRATION_DIR}/ERROR_REPORT_${TIMESTAMP}.txt" << EOF
MIGRATION ERROR REPORT
=====================
Date: $(date)
Script Version: ${SCRIPT_VERSION}

STATISTICS AT TIME OF ERROR:
Total Files Scanned: ${TOTAL_FILES}
Successfully Copied: ${COPIED_FILES}
Missing Files: ${MISSING_FILES}
Error Files: ${ERROR_FILES}

PARTIAL BACKUP LOCATION:
${BACKUP_DIR}

RECOVERY SUGGESTIONS:
1. Check log file: ${LOG_FILE}
2. Review partial backup: ${BACKUP_DIR}
3. Re-run script after fixing issues
4. Use --continue flag if available
EOF
    
    log "INFO" "Error report saved. Check ${MIGRATION_DIR}/ERROR_REPORT_${TIMESTAMP}.txt"
    exit 1
}

# Set up error handling
trap cleanup_on_error ERR INT TERM

# Progress indicator function
show_progress() {
    local current=$1
    local total=$2
    local category=$3
    
    local percent=$((current * 100 / (total == 0 ? 1 : total)))
    local bar_length=40
    local filled_length=$((percent * bar_length / 100))
    
    local bar=""
    for ((i=0; i<filled_length; i++)); do bar+="█"; done
    for ((i=filled_length; i<bar_length; i++)); do bar+="░"; done
    
    printf "\r${PURPLE}%s: [%s] %d%% (%d/%d)${NC}" "$category" "$bar" "$percent" "$current" "$total"
}

# Main execution function
main() {
    display_header
    
    # Setup
    setup_migration_structure
    
    log "INFO" "🔍 Starting comprehensive validation file discovery..."
    
    # Process predefined files first
    process_predefined_files
    
    # Dynamic discovery for additional files
    log "INFO" "🔍 Performing dynamic file discovery..."
    
    # Search in common directories
    local search_dirs=("src" "server" "tests" "config" "scripts" "types")
    for dir in "${search_dirs[@]}"; do
        [[ -d "$dir" ]] && discover_validation_files "$dir" "$(basename "$dir")"
    done
    
    # Generate comprehensive reports
    log "INFO" "📊 Generating comprehensive reports..."
    mkdir -p "${MIGRATION_DIR}/reports"
    mkdir -p "${MIGRATION_DIR}/logs"
    
    generate_html_report
    generate_text_summary
    create_consolidation_roadmap
    
    # Move log file to logs directory
    cp "$LOG_FILE" "${MIGRATION_DIR}/logs/"
    
    # Final summary
    echo
    log "SUCCESS" "╔══════════════════════════════════════════════════════════════╗"
    log "SUCCESS" "║                    🎉 MIGRATION COMPLETE! 🎉                 ║"
    log "SUCCESS" "╚══════════════════════════════════════════════════════════════╝"
    echo
    echo -e "${GREEN}📊 Final Statistics:${NC}"
    echo -e "   • Total Files Processed: ${TOTAL_FILES}"
    echo -e "   • Successfully Copied: ${COPIED_FILES}"
    echo -e "   • Missing Files: ${MISSING_FILES}"
    echo -e "   • Duplicates Handled: ${DUPLICATE_FILES}"
    echo -e "   • Success Rate: $(( COPIED_FILES * 100 / (TOTAL_FILES == 0 ? 1 : TOTAL_FILES) ))%"
    echo
    echo -e "${CYAN}📂 Generated Resources:${NC}"
    echo -e "   • Backup Directory: ${BACKUP_DIR}"
    echo -e "   • HTML Report: ${MIGRATION_DIR}/reports/migration_report_${TIMESTAMP}.html"
    echo -e "   • Text Summary: ${MIGRATION_DIR}/MIGRATION_SUMMARY_${TIMESTAMP}.txt"
    echo -e "   • Consolidation Roadmap: ${MIGRATION_DIR}/CONSOLIDATION_ROADMAP.md"
    echo -e "   • Detailed Log: ${MIGRATION_DIR}/logs/migration_${TIMESTAMP}.log"
    echo
    echo -e "${YELLOW}🎯 Next Steps:${NC}"
    echo -e "   1. Open HTML report for detailed analysis"
    echo -e "   2. Review consolidation roadmap"
    echo -e "   3. Begin Phase 1: Analysis and Planning"
    echo
    
    # Try to open the HTML report automatically
    if command -v open &> /dev/null; then
        open "${MIGRATION_DIR}/reports/migration_report_${TIMESTAMP}.html"
        log "INFO" "Opening HTML report automatically..."
    elif command -v xdg-open &> /dev/null; then
        xdg-open "${MIGRATION_DIR}/reports/migration_report_${TIMESTAMP}.html"
        log "INFO" "Opening HTML report automatically..."
    else
        log "INFO" "Open the HTML report manually: ${MIGRATION_DIR}/reports/migration_report_${TIMESTAMP}.html"
    fi
}

# Script execution
main "$@"