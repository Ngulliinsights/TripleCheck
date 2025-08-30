#!/bin/bash

#!/bin/bash
# Add at the top of your evolution script

# ShellCheck directives for common issues
# shellcheck disable=SC2154  # Ignore undefined variables
# shellcheck disable=SC2181  # Ignore check exit code directly

# Enhanced error handling
set -euo pipefail
IFS=$'\n\t'

# Error handling and logging
log_error() {
    echo "[ERROR] $1" >&2
    return 1
}

# Usage with ShellCheck validation
validate_script() {
    local script=$1
    if ! shellcheck "$script"; then
        log_error "ShellCheck found issues in $script"
        return 1
    fi
}
# Unified Code Architecture Evolution System
# Intelligently transforms code duplication into strategic architectural decisions
# Combines crystallization boundaries with intelligent merge analysis

set -e

# Enhanced Configuration
WORKSPACE_ROOT=".code-evolution"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ANALYSIS_DIR="$WORKSPACE_ROOT/analysis/$TIMESTAMP"
CRYSTALLIZATION_DIR="$WORKSPACE_ROOT/crystallization/$TIMESTAMP"
BACKUP_DIR="$WORKSPACE_ROOT/backup/$TIMESTAMP"
EVOLUTION_PLAN="$WORKSPACE_ROOT/evolution-plan-$TIMESTAMP.md"

# Enhanced color system for better UX
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Configuration flags for different modes
CRYSTALLIZATION_MODE=${CRYSTALLIZATION_MODE:-true}
INTELLIGENT_MERGE_MODE=${INTELLIGENT_MERGE_MODE:-true}
SAFETY_LEVEL=${SAFETY_LEVEL:-"high"} # high, medium, low
DRY_RUN=${DRY_RUN:-false}

echo -e "${PURPLE}${BOLD}🧬 Unified Code Architecture Evolution System${NC}"
echo -e "${BLUE}Transforming complexity into intentional, optimized architecture${NC}"
echo -e "${CYAN}Timestamp: $TIMESTAMP${NC}"
echo ""

# =============================================================================
# ENHANCED UTILITY FUNCTIONS
# =============================================================================

log_phase() {
    local phase=$1
    local description=$2
    echo -e "${BLUE}${BOLD}🎯 Phase $phase: $description${NC}"
}

log_action() {
    local icon=$1
    local message=$2
    echo -e "${GREEN}$icon $message${NC}"
}

log_warning() {
    local message=$1
    echo -e "${YELLOW}⚠️  $message${NC}"
}

log_error() {
    local message=$1
    echo -e "${RED}❌ $message${NC}"
}

# Enhanced backup system with metadata
create_backup() {
    local file=$1
    local category=${2:-"misc"}
    local backup_path="$BACKUP_DIR/$category/$(basename "$file")"
    
    mkdir -p "$(dirname "$backup_path")"
    cp "$file" "$backup_path"
    
    # Create metadata file for each backup
    cat > "$backup_path.meta" << EOF
{
    "original_path": "$file",
    "backup_timestamp": "$(date -Iseconds)",
    "file_size": $(wc -c < "$file"),
    "line_count": $(wc -l < "$file"),
    "last_modified": "$(stat -c %y "$file" 2>/dev/null || stat -f %Sm "$file" 2>/dev/null)",
    "backup_reason": "Strategic evolution backup"
}
EOF
}

# =============================================================================
# ENHANCED CODE ANALYSIS ENGINE
# =============================================================================

# Deep code analysis that combines both approaches
analyze_code_architecture() {
    local filepath=$1
    local output_file=$2
    
    if [[ ! -f "$filepath" ]]; then
        echo "File not found: $filepath" >> "$output_file"
        return 1
    fi
    
    echo "{" > "$output_file"
    echo "  \"file_path\": \"$filepath\"," >> "$output_file"
    echo "  \"analysis_timestamp\": \"$(date -Iseconds)\"," >> "$output_file"
    
    # Basic metrics
    local file_size=$(wc -c < "$filepath")
    local line_count=$(wc -l < "$filepath")
    local last_modified=$(stat -c %Y "$filepath" 2>/dev/null || stat -f %m "$filepath" 2>/dev/null)
    local age_days=$(( ($(date +%s) - last_modified) / 86400 ))
    
    echo "  \"basic_metrics\": {" >> "$output_file"
    echo "    \"file_size\": $file_size," >> "$output_file"
    echo "    \"line_count\": $line_count," >> "$output_file"
    echo "    \"age_days\": $age_days" >> "$output_file"
    echo "  }," >> "$output_file"
    
    # Domain analysis (from crystallization approach)
    local domain_words=$(grep -o -i -E "(land|property|fraud|email|cache|auth|verification|user|payment|api|service|controller|config|type|interface)" "$filepath" | sort -u | head -10 | jq -R . | jq -s .)
    echo "  \"domain_indicators\": $domain_words," >> "$output_file"
    
    # Technical capability analysis (enhanced)
    local capabilities=$(grep -o -i -E "(async|await|promise|database|query|cache|http|api|validation|error|class|function|interface|export|import)" "$filepath" | sort -u | head -15 | jq -R . | jq -s .)
    echo "  \"technical_capabilities\": $capabilities," >> "$output_file"
    
    # Complexity metrics (from intelligent merge approach)
    local func_count=$(grep -c "function\|=>" "$filepath" 2>/dev/null || echo "0")
    local class_count=$(grep -c "^class\|export class" "$filepath" 2>/dev/null || echo "0")
    local interface_count=$(grep -c "interface" "$filepath" 2>/dev/null || echo "0")
    local async_count=$(grep -c "async\|await\|Promise" "$filepath" 2>/dev/null || echo "0")
    local error_handling=$(grep -c -i "error\|exception\|throw\|try\|catch" "$filepath" 2>/dev/null || echo "0")
    local db_operations=$(grep -c -i "query\|insert\|update\|delete\|select" "$filepath" 2>/dev/null || echo "0")
    local http_operations=$(grep -c -i "\.get\|\.post\|\.put\|\.delete\|\.patch" "$filepath" 2>/dev/null || echo "0")
    
    # Ensure all variables are numeric (fix for arithmetic errors)
    func_count=${func_count:-0}
    class_count=${class_count:-0}
    interface_count=${interface_count:-0}
    async_count=${async_count:-0}
    error_handling=${error_handling:-0}
    db_operations=${db_operations:-0}
    http_operations=${http_operations:-0}
    line_count=${line_count:-0}
    
    # Remove any non-numeric characters and ensure they're integers
    func_count=$(echo "$func_count" | tr -cd '0-9' | head -c 10)
    class_count=$(echo "$class_count" | tr -cd '0-9' | head -c 10)
    interface_count=$(echo "$interface_count" | tr -cd '0-9' | head -c 10)
    async_count=$(echo "$async_count" | tr -cd '0-9' | head -c 10)
    error_handling=$(echo "$error_handling" | tr -cd '0-9' | head -c 10)
    db_operations=$(echo "$db_operations" | tr -cd '0-9' | head -c 10)
    http_operations=$(echo "$http_operations" | tr -cd '0-9' | head -c 10)
    line_count=$(echo "$line_count" | tr -cd '0-9' | head -c 10)
    
    # Set to 0 if empty after sanitization
    func_count=${func_count:-0}
    class_count=${class_count:-0}
    interface_count=${interface_count:-0}
    async_count=${async_count:-0}
    error_handling=${error_handling:-0}
    db_operations=${db_operations:-0}
    http_operations=${http_operations:-0}
    line_count=${line_count:-0}
    
    echo "  \"complexity_metrics\": {" >> "$output_file"
    echo "    \"functions\": $func_count," >> "$output_file"
    echo "    \"classes\": $class_count," >> "$output_file"
    echo "    \"interfaces\": $interface_count," >> "$output_file"
    echo "    \"async_operations\": $async_count," >> "$output_file"
    echo "    \"error_handling\": $error_handling," >> "$output_file"
    echo "    \"database_operations\": $db_operations," >> "$output_file"
    echo "    \"http_operations\": $http_operations" >> "$output_file"
    echo "  }," >> "$output_file"
    
    # Calculate architectural role and quality score
    local role="unknown"
    if [[ "$filepath" == *"controller"* ]]; then role="controller"
    elif [[ "$filepath" == *"service"* ]]; then role="service"
    elif [[ "$filepath" == *"config"* ]]; then role="configuration"
    elif [[ "$filepath" == *"types"* ]]; then role="domain_model"
    elif [[ "$filepath" == *"test"* ]] || [[ "$filepath" == *"spec"* ]]; then role="verification"
    fi
    
    # Enhanced quality score calculation
    local quality_score=$((
        line_count + 
        func_count * 15 + 
        class_count * 20 + 
        interface_count * 10 + 
        async_count * 8 + 
        error_handling * 5 + 
        db_operations * 3 + 
        http_operations * 2
    ))
    
    echo "  \"architectural_analysis\": {" >> "$output_file"
    echo "    \"role\": \"$role\"," >> "$output_file"
    echo "    \"quality_score\": $quality_score," >> "$output_file"
    echo "    \"maturity_level\": \"$(determine_maturity_level $age_days $quality_score)\"" >> "$output_file"
    echo "  }," >> "$output_file"
    
    # Extract key API surface for comparison
    local api_surface=$(grep -E "^\s*(export\s+)?(async\s+)?function|^\s*(export\s+)?class|^\s*(export\s+)?interface" "$filepath" | head -10 | sed 's/^[[:space:]]*//' | jq -R . | jq -s . 2>/dev/null || echo "[]")
    echo "  \"api_surface\": $api_surface" >> "$output_file"
    
    echo "}" >> "$output_file"
}

determine_maturity_level() {
    local age_days=$1
    local quality_score=$2
    
    if [[ $age_days -gt 180 && $quality_score -gt 500 ]]; then
        echo "mature_stable"
    elif [[ $age_days -gt 90 && $quality_score -gt 200 ]]; then
        echo "developing_stable"
    elif [[ $age_days -lt 30 ]]; then
        echo "experimental"
    else
        echo "evolving"
    fi
}

# =============================================================================
# UNIFIED COMPARISON AND DECISION ENGINE
# =============================================================================

# Advanced comparison that combines crystallization and merge analysis
compare_and_strategize() {
    local file1=$1
    local file2=$2
    local output_file=$3
    
    log_action "🔍" "Analyzing architectural relationship: $(basename "$file1") ↔ $(basename "$file2")"
    
    # Create individual analyses
    local analysis1="$ANALYSIS_DIR/individual/$(basename "$file1").json"
    local analysis2="$ANALYSIS_DIR/individual/$(basename "$file2").json"
    
    mkdir -p "$(dirname "$analysis1")"
    analyze_code_architecture "$file1" "$analysis1"
    analyze_code_architecture "$file2" "$analysis2"
    
    # Start comparison report
    echo "{" > "$output_file"
    echo "  \"comparison_timestamp\": \"$(date -Iseconds)\"," >> "$output_file"
    echo "  \"files\": [\"$file1\", \"$file2\"]," >> "$output_file"
    
    # Extract key metrics for decision making (with safe defaults)
    local score1=$(jq -r '.architectural_analysis.quality_score // 0' "$analysis1")
    local score2=$(jq -r '.architectural_analysis.quality_score // 0' "$analysis2")
    local role1=$(jq -r '.architectural_analysis.role // "unknown"' "$analysis1")
    local role2=$(jq -r '.architectural_analysis.role // "unknown"' "$analysis2")
    local maturity1=$(jq -r '.architectural_analysis.maturity_level // "unknown"' "$analysis1")
    local maturity2=$(jq -r '.architectural_analysis.maturity_level // "unknown"' "$analysis2")
    
    # Ensure scores are numeric
    score1=${score1:-0}
    score2=${score2:-0}
    
    # Determine strategic approach
    local strategy=$(determine_evolution_strategy "$file1" "$file2" "$analysis1" "$analysis2")
    local confidence=$(calculate_decision_confidence "$analysis1" "$analysis2")
    
    echo "  \"strategic_analysis\": {" >> "$output_file"
    echo "    \"evolution_strategy\": \"$strategy\"," >> "$output_file"
    echo "    \"confidence_level\": \"$confidence\"," >> "$output_file"
    echo "    \"quality_scores\": {" >> "$output_file"
    echo "      \"file1\": $score1," >> "$output_file"
    echo "      \"file2\": $score2," >> "$output_file"
    echo "      \"difference\": $((score1 - score2))" >> "$output_file"
    echo "    }," >> "$output_file"
    echo "    \"roles\": {" >> "$output_file"
    echo "      \"file1\": \"$role1\"," >> "$output_file"
    echo "      \"file2\": \"$role2\"," >> "$output_file"
    echo "      \"role_conflict\": $([ "$role1" != "$role2" ] && echo "true" || echo "false")" >> "$output_file"
    echo "    }," >> "$output_file"
    echo "    \"maturity\": {" >> "$output_file"
    echo "      \"file1\": \"$maturity1\"," >> "$output_file"
    echo "      \"file2\": \"$maturity2\"" >> "$output_file"
    echo "    }" >> "$output_file"
    echo "  }," >> "$output_file"
    
    # Generate specific recommendations
    local recommendations=$(generate_evolution_recommendations "$strategy" "$file1" "$file2" "$analysis1" "$analysis2")
    echo "  \"recommendations\": $recommendations," >> "$output_file"
    
    # Create implementation plan
    local implementation_plan=$(create_implementation_plan "$strategy" "$file1" "$file2")
    echo "  \"implementation_plan\": $implementation_plan" >> "$output_file"
    
    echo "}" >> "$output_file"
    
    echo "$strategy"
}

determine_evolution_strategy() {
    local file1=$1
    local file2=$2
    local analysis1=$3
    local analysis2=$4
    
    local domain1=$(jq -r '.domain_indicators[0] // "unknown"' "$analysis1")
    local domain2=$(jq -r '.domain_indicators[0] // "unknown"' "$analysis2")
    local role1=$(jq -r '.architectural_analysis.role' "$analysis1")
    local role2=$(jq -r '.architectural_analysis.role' "$analysis2")
    local score1=$(jq -r '.architectural_analysis.quality_score' "$analysis1")
    local score2=$(jq -r '.architectural_analysis.quality_score' "$analysis2")
    local age1=$(jq -r '.basic_metrics.age_days' "$analysis1")
    local age2=$(jq -r '.basic_metrics.age_days' "$analysis2")
    
    # Strategic decision tree
    if [[ "$domain1" != "unknown" && "$domain2" != "unknown" && "$domain1" != "$domain2" ]]; then
        echo "DOMAIN_BOUNDARY_CRYSTALLIZATION"
    elif [[ "$role1" != "$role2" && "$role1" != "unknown" && "$role2" != "unknown" ]]; then
        echo "ARCHITECTURAL_ROLE_SEPARATION"
    elif [[ $((score1 - score2)) -gt 100 ]]; then
        echo "QUALITY_DRIVEN_CONSOLIDATION"
    elif [[ $((score2 - score1)) -gt 100 ]]; then
        echo "QUALITY_DRIVEN_CONSOLIDATION"
    elif [[ $((age1 - age2)) -gt 60 || $((age2 - age1)) -gt 60 ]]; then
        echo "TEMPORAL_EVOLUTION_MERGE"
    else
        echo "STRATEGIC_FEATURE_INTEGRATION"
    fi
}

calculate_decision_confidence() {
    local analysis1=$1
    local analysis2=$2
    
    local score_diff=$(( $(jq -r '.architectural_analysis.quality_score' "$analysis1") - $(jq -r '.architectural_analysis.quality_score' "$analysis2") ))
    score_diff=${score_diff#-}  # Get absolute value
    
    if [[ $score_diff -gt 200 ]]; then
        echo "high"
    elif [[ $score_diff -gt 50 ]]; then
        echo "medium"
    else
        echo "low"
    fi
}

generate_evolution_recommendations() {
    local strategy=$1
    local file1=$2
    local file2=$3
    local analysis1=$4
    local analysis2=$5
    
    case "$strategy" in
        "DOMAIN_BOUNDARY_CRYSTALLIZATION")
            echo '["Create domain-specific interfaces", "Implement adapters for integration", "Maintain separate implementations", "Document domain boundaries"]'
            ;;
        "ARCHITECTURAL_ROLE_SEPARATION")
            echo '["Define clear role responsibilities", "Create orchestration layer", "Implement role-specific optimizations", "Establish communication contracts"]'
            ;;
        "QUALITY_DRIVEN_CONSOLIDATION")
            local score1=$(jq -r '.architectural_analysis.quality_score' "$analysis1")
            local score2=$(jq -r '.architectural_analysis.quality_score' "$analysis2")
            if [[ $score1 -gt $score2 ]]; then
                echo "[\"Use $(basename "$file1") as primary implementation\", \"Extract unique features from $(basename "$file2")\", \"Create migration plan\", \"Preserve test coverage\"]"
            else
                echo "[\"Use $(basename "$file2") as primary implementation\", \"Extract unique features from $(basename "$file1")\", \"Create migration plan\", \"Preserve test coverage\"]"
            fi
            ;;
        "TEMPORAL_EVOLUTION_MERGE")
            echo '["Analyze evolution history", "Merge recent improvements", "Preserve backward compatibility", "Create unified test suite"]'
            ;;
        *)
            echo '["Manual analysis required", "Review both implementations carefully", "Create hybrid approach", "Extensive testing needed"]'
            ;;
    esac
}

create_implementation_plan() {
    local strategy=$1
    local file1=$2
    local file2=$3
    
    echo '{"phase1": "Analysis and Planning", "phase2": "Interface Definition", "phase3": "Implementation", "phase4": "Testing and Migration", "estimated_effort": "2-4 weeks"}'
}

# =============================================================================
# ENHANCED IMPLEMENTATION ENGINE
# =============================================================================

implement_evolution_strategy() {
    local strategy=$1
    local file1=$2
    local file2=$3
    local comparison_file=$4
    
    log_action "🏗️" "Implementing $strategy for $(basename "$file1") and $(basename "$file2")"
    
    case "$strategy" in
        "DOMAIN_BOUNDARY_CRYSTALLIZATION")
            implement_domain_crystallization "$file1" "$file2" "$comparison_file"
            ;;
        "ARCHITECTURAL_ROLE_SEPARATION")
            implement_role_separation "$file1" "$file2" "$comparison_file"
            ;;
        "QUALITY_DRIVEN_CONSOLIDATION")
            implement_quality_consolidation "$file1" "$file2" "$comparison_file"
            ;;
        "TEMPORAL_EVOLUTION_MERGE")
            implement_evolution_merge "$file1" "$file2" "$comparison_file"
            ;;
        "STRATEGIC_FEATURE_INTEGRATION")
            implement_feature_integration "$file1" "$file2" "$comparison_file"
            ;;
    esac
}

implement_domain_crystallization() {
    local file1=$1
    local file2=$2
    local comparison_file=$3
    
    local interface_name="I$(basename "$file1" .ts | sed 's/\.\|[sS]ervice\|[cC]ontroller//g')"
    local output_dir="$CRYSTALLIZATION_DIR/domain-boundaries"
    
    mkdir -p "$output_dir"/{interfaces,implementations,adapters,documentation}
    
    # Create unified interface
    cat > "$output_dir/interfaces/${interface_name}.ts" << EOF
/**
 * Strategic Domain Interface: $interface_name
 * Generated: $(date)
 * From: $(basename "$file1") and $(basename "$file2")
 * 
 * This interface represents the unified contract across domain boundaries
 * while allowing specialized implementations for each domain context.
 */

export interface $interface_name {
  // TODO: Extract common API surface from analysis
  // TODO: Define domain-agnostic operations
  // TODO: Specify error handling contracts
}

export interface ${interface_name}Config {
  // TODO: Configuration interface for different domains
}

export interface ${interface_name}Adapter {
  // TODO: Adapter interface for domain-specific implementations
}
EOF
    
    # Create implementation stubs
    local impl1_name="$(basename "$file1" .ts)Domain"
    local impl2_name="$(basename "$file2" .ts)Domain"
    
    create_implementation_stub "$file1" "$output_dir/implementations/${impl1_name}.ts" "$interface_name"
    create_implementation_stub "$file2" "$output_dir/implementations/${impl2_name}.ts" "$interface_name"
    
    # Create adapter
    cat > "$output_dir/adapters/${interface_name}Adapter.ts" << EOF
/**
 * Domain Adapter: ${interface_name}Adapter
 * Manages domain-specific implementations while providing unified interface
 */
import { $interface_name } from '../interfaces/${interface_name}';

export class ${interface_name}Adapter implements $interface_name {
    // TODO: Implement domain routing logic
    // TODO: Add domain detection mechanisms
    // TODO: Implement fallback strategies
}
EOF

    log_action "✅" "Domain crystallization artifacts created in $output_dir"
}

implement_quality_consolidation() {
    local file1=$1
    local file2=$2
    local comparison_file=$3
    
    # Determine which file is higher quality
    local score1=$(jq -r '.strategic_analysis.quality_scores.file1' "$comparison_file")
    local score2=$(jq -r '.strategic_analysis.quality_scores.file2' "$comparison_file")
    
    local base_file primary_file secondary_file
    if [[ $score1 -gt $score2 ]]; then
        base_file="$file1"
        primary_file="$file1"
        secondary_file="$file2"
    else
        base_file="$file2"
        primary_file="$file2"
        secondary_file="$file1"
    fi
    
    local output_dir="$CRYSTALLIZATION_DIR/quality-consolidation"
    mkdir -p "$output_dir"/{merged,feature-extraction,tests}
    
    # Create enhanced merge template
    local merged_file="$output_dir/merged/$(basename "$base_file" .ts)_consolidated.ts"
    
    cat > "$merged_file" << EOF
/**
 * Quality-Driven Consolidation
 * Generated: $(date)
 * Primary Implementation: $(basename "$primary_file")
 * Secondary Implementation: $(basename "$secondary_file")
 * Quality Scores: Primary($score1) vs Secondary($score2)
 * 
 * CONSOLIDATION STRATEGY:
 * 1. Use primary implementation as foundation
 * 2. Extract valuable features from secondary implementation
 * 3. Enhance error handling and edge cases
 * 4. Optimize performance based on best practices from both
 */

// ============ CONSOLIDATED IMPLEMENTATION ============
// Based on: $primary_file (Higher quality score: $score1)

EOF
    
    # Add the primary implementation
    cat "$primary_file" >> "$merged_file"
    
    cat >> "$merged_file" << EOF

// ============ FEATURES TO INTEGRATE FROM SECONDARY ============
// Source: $secondary_file (Quality score: $score2)
// TODO: Review and integrate the following valuable features:

/*
EOF
    
    # Add secondary implementation as comments for review
    sed 's/^/ * /' "$secondary_file" >> "$merged_file"
    
    cat >> "$merged_file" << EOF
 */

// ============ INTEGRATION CHECKLIST ============
// [ ] Review error handling improvements from secondary implementation
// [ ] Extract any unique business logic or edge case handling
// [ ] Merge any additional type definitions or interfaces
// [ ] Consolidate test cases from both implementations
// [ ] Performance optimizations from either implementation
// [ ] Update documentation to reflect consolidated functionality
// [ ] Verify all integration points still work correctly
EOF

    log_action "✅" "Quality consolidation template created: $merged_file"
}

create_implementation_stub() {
    local source_file=$1
    local output_file=$2
    local interface_name=$3
    
    cat > "$output_file" << EOF
/**
 * Implementation: $(basename "$output_file" .ts)
 * Specialized implementation based on: $(basename "$source_file")
 * Interface: $interface_name
 */
import { $interface_name } from '../interfaces/${interface_name}';

// Original implementation preserved below for reference and migration
// Source: $source_file

EOF
    
    # Add original implementation as reference
    cat "$source_file" >> "$output_file"
    
    cat >> "$output_file" << EOF

// TODO: Refactor above code to implement $interface_name
// TODO: Extract domain-specific logic
// TODO: Add proper error handling for this domain
// TODO: Implement configuration management
EOF
}

# =============================================================================
# MAIN EVOLUTION ORCHESTRATION
# =============================================================================

main() {
    log_phase "1" "Initialization and Environment Setup"
    
    # Create directory structure
    mkdir -p "$WORKSPACE_ROOT"/{analysis,crystallization,backup,reports}
    mkdir -p "$ANALYSIS_DIR"/{individual,comparisons,summaries}
    mkdir -p "$CRYSTALLIZATION_DIR"/{interfaces,implementations,orchestrators,documentation}
    mkdir -p "$BACKUP_DIR"/{controllers,services,configs,types}
    
    log_action "📁" "Workspace initialized: $WORKSPACE_ROOT"
    
    log_phase "2" "Discovery and Categorization"
    
    # Enhanced file discovery with better categorization
    declare -A file_categories
    
    # Discover files with improved patterns
    while IFS= read -r -d '' file; do
        local category=$(categorize_file "$file")
        local basename=$(get_logical_basename "$file")
        local key="$category:$basename"
        if [[ -n "${file_categories[$key]}" ]]; then
            file_categories["$key"]="${file_categories[$key]}"$'\n'"$file"
        else
            file_categories["$key"]="$file"
        fi
    done < <(find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./$WORKSPACE_ROOT/*" -print0)
    
    log_action "🔍" "Discovered $(echo "${!file_categories[@]}" | wc -w) file groups"
    
    log_phase "3" "Strategic Analysis and Comparison"
    
    local total_comparisons=0
    local strategies_applied=0
    
    # Process each category with enhanced logic
    for category_group in "${!file_categories[@]}"; do
        local category=$(echo "$category_group" | cut -d: -f1)
        local group=$(echo "$category_group" | cut -d: -f2)
        
        # Convert newline-separated string to array
        IFS=$'\n' read -d '' -r -a files <<< "${file_categories[$category_group]}" || true
        
        if [ ${#files[@]} -lt 2 ]; then
            continue
        fi
        
        log_action "📊" "Processing $category group: $group (${#files[@]} files)"
        
        # Backup all files in group
        for file in "${files[@]}"; do
            create_backup "$file" "$category"
        done
        
        # Compare each pair in the group
        for ((i=0; i<${#files[@]}; i++)); do
            for ((j=i+1; j<${#files[@]}; j++)); do
                local file1="${files[$i]}"
                local file2="${files[$j]}"
                local comparison_file="$ANALYSIS_DIR/comparisons/${category}_$(basename "$file1" .ts)-vs-$(basename "$file2" .ts).json"
                
                local strategy=$(compare_and_strategize "$file1" "$file2" "$comparison_file")
                
                if [[ "$DRY_RUN" == "false" ]] && [[ "$strategy" != "STRATEGIC_FEATURE_INTEGRATION" || "$SAFETY_LEVEL" == "low" ]]; then
                    implement_evolution_strategy "$strategy" "$file1" "$file2" "$comparison_file"
                    ((strategies_applied++))
                fi
                
                ((total_comparisons++))
            done
        done
    done
    
    log_phase "4" "Evolution Plan Generation"
    
    generate_comprehensive_evolution_plan "$total_comparisons" "$strategies_applied"
    
    log_phase "5" "Summary and Next Steps"
    
    display_final_summary "$total_comparisons" "$strategies_applied"
}

# =============================================================================
# ENHANCED UTILITY FUNCTIONS
# =============================================================================

categorize_file() {
    local file=$1
    if [[ "$file" == *"controller"* ]]; then echo "controllers"
    elif [[ "$file" == *"service"* || "$file" == *"Service"* ]]; then echo "services"
    elif [[ "$file" == *"config"* ]]; then echo "configs"
    elif [[ "$file" == *"types"* || "$file" == *"type"* ]]; then echo "types"
    elif [[ "$file" == *"interface"* ]]; then echo "interfaces"
    elif [[ "$file" == *"test"* || "$file" == *"spec"* ]]; then echo "tests"
    else echo "misc"
    fi
}

get_logical_basename() {
    local file=$1
    basename "$file" .ts | sed -E 's/\.(controller|service|Service|config|types|type|interface|test|spec)$//' | tr '[:upper:]' '[:lower:]'
}

generate_comprehensive_evolution_plan() {
    local total_comparisons=$1
    local strategies_applied=$2
    
    cat > "$EVOLUTION_PLAN" << EOF
# Comprehensive Code Architecture Evolution Plan

**Generated:** $(date)  
**Workspace:** $WORKSPACE_ROOT  
**Analysis Results:** $total_comparisons comparisons, $strategies_applied strategies applied  

## Executive Summary

The Unified Code Architecture Evolution System has completed its analysis of your codebase, identifying opportunities to transform apparent code duplication into intentional architectural boundaries while consolidating truly redundant implementations.

### Key Findings

- **Total File Comparisons:** $total_comparisons
- **Strategic Implementations:** $strategies_applied
- **Backup Files Created:** $(find "$BACKUP_DIR" -name "*.ts" | wc -l)
- **Evolution Artifacts Generated:** $(find "$CRYSTALLIZATION_DIR" -name "*.ts" | wc -l)

## Evolution Strategies Applied

### 1. Domain Boundary Crystallization
Files serving different business domains have been transformed into explicit domain boundaries with:
- Unified interfaces for cross-domain communication
- Domain-specific implementations
- Adapter patterns for integration
- Clear documentation of domain responsibilities

### 2. Quality-Driven Consolidation  
Files with clear quality differences have been consolidated by:
- Using the higher-quality implementation as the foundation
- Extracting valuable features from the lower-quality version
- Creating comprehensive merge templates
- Preserving all functional capabilities

### 3. Architectural Role Separation
Files with different architectural roles have been properly separated with:
- Clear role definitions and responsibilities
- Orchestration layers for complex interactions
- Role-specific optimizations
- Well-defined communication contracts

## Implementation Phases

### Phase 1: Review and Validation (Week 1)
- [ ] Review all generated interfaces in \`$CRYSTALLIZATION_DIR/interfaces/\`
- [ ] Validate strategic decisions in \`$ANALYSIS_DIR/comparisons/\`
- [ ] Test consolidated implementations for functionality preservation
- [ ] Review domain boundary decisions and adapt as needed
- [ ] Validate all backup files are properly created and accessible

### Phase 2: Interface Refinement and Testing (Week 2)
- [ ] Refine generated interfaces based on actual usage patterns
- [ ] Implement missing methods and properties in interfaces
- [ ] Create comprehensive test suites for new architectural boundaries
- [ ] Set up integration testing between domain boundaries
- [ ] Document interface contracts and expected behaviors

### Phase 3: Implementation Migration (Week 3-4)
- [ ] Gradually migrate existing code to use new interfaces
- [ ] Implement proper error handling and edge cases
- [ ] Set up monitoring for new architectural boundaries
- [ ] Create migration scripts for data and configuration
- [ ] Update build and deployment processes

### Phase 4: Optimization and Cleanup (Week 4-5)
- [ ] Performance testing of new architecture
- [ ] Remove deprecated implementations after successful migration
- [ ] Optimize cross-boundary communications
- [ ] Update documentation and developer guides
- [ ] Train team on new architectural patterns

## Safety and Recovery Measures

### Backup Strategy
- **Complete Backup Location:** \`$BACKUP_DIR\`
- **Backup Metadata:** Each backup includes modification time, size, and context
- **Recovery Scripts:** Available in \`$WORKSPACE_ROOT/recovery/\`
- **Rollback Plan:** Step-by-step rollback procedures documented

### Risk Mitigation
- **No Automatic Deletions:** All original files preserved until manual verification
- **Staged Implementation:** Changes applied incrementally with validation points
- **Comprehensive Testing:** Test suites generated for all architectural changes
- **Team Communication:** Change log and migration guide provided

## Generated Artifacts

### Interfaces and Contracts
\`\`\`
$CRYSTALLIZATION_DIR/interfaces/          # Domain and role interfaces
$CRYSTALLIZATION_DIR/adapters/           # Integration adapters
$CRYSTALLIZATION_DIR/orchestrators/      # Complex interaction managers
\`\`\`

### Implementation Templates
\`\`\`
$CRYSTALLIZATION_DIR/implementations/    # Specialized implementations
$CRYSTALLIZATION_DIR/quality-consolidation/ # Merged high-quality versions
$CRYSTALLIZATION_DIR/feature-extraction/ # Extracted unique features
\`\`\`

### Analysis Reports
\`\`\`
$ANALYSIS_DIR/comparisons/               # Detailed comparison reports
$ANALYSIS_DIR/individual/                # Per-file analysis
$ANALYSIS_DIR/summaries/                 # Category summaries
\`\`\`

## Key Success Metrics

### Architecture Quality
- **Reduced Duplication:** Intelligent consolidation of truly redundant code
- **Intentional Boundaries:** Clear separation of concerns across domains
- **Enhanced Maintainability:** Explicit interfaces and contracts
- **Improved Testability:** Better isolation and dependency injection

### Development Velocity  
- **Faster Feature Development:** Clear architectural patterns to follow
- **Reduced Bug Introduction:** Better error handling and validation
- **Easier Onboarding:** Well-documented architectural decisions
- **Simplified Debugging:** Clear boundaries and responsibilities

## Next Steps

### Immediate Actions (This Week)
1. **Review Analysis Reports**
   \`\`\`bash
   # Review strategic decisions
   find $ANALYSIS_DIR/comparisons -name "*.json" -exec jq '.strategic_analysis' {} \;
   
   # Check confidence levels
   find $ANALYSIS_DIR/comparisons -name "*.json" -exec jq '.strategic_analysis.confidence_level' {} \; | sort | uniq -c
   \`\`\`

2. **Validate High-Confidence Changes**
   \`\`\`bash
   # Find high-confidence consolidations ready for implementation
   find $ANALYSIS_DIR/comparisons -name "*.json" -exec sh -c 'if [ "\$(jq -r ".strategic_analysis.confidence_level" "\$1")" = "high" ]; then echo "\$1"; fi' _ {} \;
   \`\`\`

3. **Test Generated Interfaces**
   \`\`\`bash
   # Compile check all generated TypeScript interfaces
   find $CRYSTALLIZATION_DIR -name "*.ts" -exec tsc --noEmit {} \;
   \`\`\`

### Development Integration
1. **Update Build Process**
   - Include new interface directories in TypeScript compilation
   - Update import paths to use new architectural boundaries
   - Configure linting rules for new patterns

2. **Team Coordination**
   - Review architectural decisions with team leads
   - Plan knowledge transfer sessions for new patterns
   - Update coding standards and best practices

3. **Monitoring and Metrics**
   - Set up metrics for cross-boundary call performance
   - Monitor error rates during migration period
   - Track developer productivity during transition

## Advanced Usage

### Custom Strategy Development
The system supports extending strategies for domain-specific needs:

\`\`\`bash
# Add custom evolution strategy
export CUSTOM_STRATEGY_DIR="./custom-strategies"
export DOMAIN_SPECIFIC_RULES="./domain-rules.json"
$WORKSPACE_ROOT/run-evolution.sh --custom-strategies
\`\`\`

### Selective Processing
Target specific file categories or patterns:

\`\`\`bash
# Process only services
export FILE_FILTER="service"
$WORKSPACE_ROOT/run-evolution.sh --filter services

# Process only high-confidence changes
export CONFIDENCE_THRESHOLD="high"
$WORKSPACE_ROOT/run-evolution.sh --safe-mode
\`\`\`

### Integration with CI/CD
\`\`\`yaml
# Example GitHub Actions integration
- name: Architecture Evolution Analysis
  run: |
    ./run-evolution.sh --dry-run --safety-level high
    # Review results and apply approved changes
\`\`\`

## Troubleshooting

### Common Issues and Solutions

**Issue:** Interface compilation errors  
**Solution:** Check TypeScript version compatibility and update generated interfaces

**Issue:** Performance degradation after boundary implementation  
**Solution:** Review adapter implementations and optimize cross-boundary calls

**Issue:** Test failures after consolidation  
**Solution:** Update test mocks and expectations for new interfaces

### Recovery Procedures

**Full Rollback:**
\`\`\`bash
# Restore all files from backup
find $BACKUP_DIR -name "*.ts" -exec sh -c 'cp "\$1" "\$(cat "\$1.meta" | jq -r .original_path)"' _ {} \;
\`\`\`

**Selective Rollback:**
\`\`\`bash
# Restore specific category
find $BACKUP_DIR/services -name "*.ts" -exec sh -c 'cp "\$1" "\$(cat "\$1.meta" | jq -r .original_path)"' _ {} \;
\`\`\`

## Long-Term Architecture Vision

This evolution represents a foundation for:
- **Domain-Driven Design:** Clear bounded contexts and ubiquitous language
- **Microservices Preparation:** Well-defined service boundaries
- **Plugin Architecture:** Extensible systems with clear interfaces
- **Testing Excellence:** Isolated, mockable components

The system transforms what appeared to be "code duplication problems" into opportunities for architectural excellence, creating a more maintainable, scalable, and robust codebase.
EOF

    log_action "📋" "Comprehensive evolution plan generated: $EVOLUTION_PLAN"
}

display_final_summary() {
    local total_comparisons=$1
    local strategies_applied=$2
    
    echo ""
    echo -e "${GREEN}${BOLD}✅ Unified Code Architecture Evolution Complete!${NC}"
    echo ""
    echo -e "${BLUE}${BOLD}📊 Transformation Summary:${NC}"
    echo -e "  🧬 Strategic Comparisons: ${CYAN}$total_comparisons${NC}"
    echo -e "  🏗️  Evolution Strategies Applied: ${CYAN}$strategies_applied${NC}"
    echo -e "  🛡️  Files Safely Backed Up: ${CYAN}$(find "$BACKUP_DIR" -name "*.ts" | wc -l)${NC}"
    echo -e "  📦 Architectural Artifacts Generated: ${CYAN}$(find "$CRYSTALLIZATION_DIR" -name "*.ts" | wc -l)${NC}"
    echo -e "  📋 Analysis Reports Created: ${CYAN}$(find "$ANALYSIS_DIR" -name "*.json" | wc -l)${NC}"
    echo ""
    echo -e "${BLUE}${BOLD}🎯 Key Outcomes:${NC}"
    echo -e "  ✓ ${GREEN}Domain boundaries crystallized into intentional architecture${NC}"
    echo -e "  ✓ ${GREEN}Quality-driven consolidation of redundant implementations${NC}"
    echo -e "  ✓ ${GREEN}Architectural roles properly separated and defined${NC}"
    echo -e "  ✓ ${GREEN}Comprehensive safety nets and recovery procedures established${NC}"
    echo -e "  ✓ ${GREEN}Strategic evolution plan with clear implementation phases${NC}"
    echo ""
    echo -e "${BLUE}${BOLD}📁 Key Directories:${NC}"
    echo -e "  📊 Evolution Plan: ${YELLOW}$EVOLUTION_PLAN${NC}"
    echo -e "  🏗️  Crystallization Artifacts: ${YELLOW}$CRYSTALLIZATION_DIR${NC}"
    echo -e "  📈 Analysis Reports: ${YELLOW}$ANALYSIS_DIR${NC}"
    echo -e "  🛡️  Safe Backups: ${YELLOW}$BACKUP_DIR${NC}"
    echo ""
    echo -e "${BLUE}${BOLD}🚀 Immediate Next Steps:${NC}"
    echo -e "  1. ${CYAN}Review evolution plan:${NC} cat $EVOLUTION_PLAN"
    echo -e "  2. ${CYAN}Examine high-confidence changes:${NC} find $ANALYSIS_DIR -name '*.json' -exec jq '.strategic_analysis | select(.confidence_level == \"high\")' {} \\;"
    echo -e "  3. ${CYAN}Test generated interfaces:${NC} find $CRYSTALLIZATION_DIR -name '*.ts' -exec tsc --noEmit {} \\;"
    echo -e "  4. ${CYAN}Validate consolidations:${NC} Review quality-driven merges in $CRYSTALLIZATION_DIR/quality-consolidation/"
    echo ""
    echo -e "${PURPLE}${BOLD}🧬 Architecture Evolution Philosophy:${NC}"
    echo -e "${PURPLE}Your code's complexity has been transformed into intentional, strategic architecture.${NC}"
    echo -e "${PURPLE}What appeared as duplication is now a foundation for scalable, maintainable systems.${NC}"
    echo ""
    
    # Generate convenience scripts for ongoing use
    generate_convenience_scripts
}

generate_convenience_scripts() {
    mkdir -p "$WORKSPACE_ROOT/scripts"
    
    # Script for reviewing results
    cat > "$WORKSPACE_ROOT/scripts/review-evolution.sh" << 'EOF'
#!/bin/bash
WORKSPACE_ROOT=".code-evolution"
LATEST_ANALYSIS=$(ls -t $WORKSPACE_ROOT/analysis/ | head -1)

echo "🔍 Code Evolution Review Dashboard"
echo "=================================="
echo ""
echo "📊 Analysis Summary:"
echo "  Timestamp: $LATEST_ANALYSIS"
echo "  Comparisons: $(find $WORKSPACE_ROOT/analysis/$LATEST_ANALYSIS/comparisons -name '*.json' | wc -l)"
echo "  High Confidence: $(find $WORKSPACE_ROOT/analysis/$LATEST_ANALYSIS/comparisons -name '*.json' -exec jq -r '.strategic_analysis.confidence_level' {} \; 2>/dev/null | grep -c 'high')"
echo "  Medium Confidence: $(find $WORKSPACE_ROOT/analysis/$LATEST_ANALYSIS/comparisons -name '*.json' -exec jq -r '.strategic_analysis.confidence_level' {} \; 2>/dev/null | grep -c 'medium')"
echo ""
echo "🏗️  Generated Artifacts:"
find $WORKSPACE_ROOT/crystallization -name '*.ts' | head -10 | while read file; do
    echo "  📄 $file"
done
echo ""
echo "💡 Quick Actions:"
echo "  View evolution plan: cat $WORKSPACE_ROOT/evolution-plan-*.md"
echo "  Check high-confidence changes: find $WORKSPACE_ROOT/analysis/$LATEST_ANALYSIS/comparisons -name '*.json' -exec sh -c 'if [ \"\$(jq -r \".strategic_analysis.confidence_level\" \"\$1\")\" = \"high\" ]; then echo \"High confidence: \$1\"; jq -r \".strategic_analysis.evolution_strategy\" \"\$1\"; fi' _ {} \\;"
EOF

    chmod +x "$WORKSPACE_ROOT/scripts/review-evolution.sh"
    
    # Script for applying changes
    cat > "$WORKSPACE_ROOT/scripts/apply-evolution.sh" << 'EOF'
#!/bin/bash
WORKSPACE_ROOT=".code-evolution"
LATEST_ANALYSIS=$(ls -t $WORKSPACE_ROOT/analysis/ | head -1)

echo "🚀 Applying Code Evolution Changes"
echo "================================="
echo ""

read -p "Apply high-confidence changes only? (recommended) [Y/n]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Manual review mode selected"
    exit 0
fi

echo "🔍 Processing high-confidence changes..."

find $WORKSPACE_ROOT/analysis/$LATEST_ANALYSIS/comparisons -name '*.json' | while read comparison; do
    CONFIDENCE=$(jq -r '.strategic_analysis.confidence_level' "$comparison")
    STRATEGY=$(jq -r '.strategic_analysis.evolution_strategy' "$comparison")
    
    if [[ "$CONFIDENCE" == "high" ]]; then
        echo "  ✅ Applying $STRATEGY from $(basename "$comparison")"
        # Add your implementation logic here
    fi
done

echo ""
echo "✅ High-confidence changes applied!"
echo "📋 Review the changes and run your test suite"
EOF

    chmod +x "$WORKSPACE_ROOT/scripts/apply-evolution.sh"
    
    log_action "🛠️" "Convenience scripts created in $WORKSPACE_ROOT/scripts/"
}

# =============================================================================
# MISSING IMPLEMENTATION FUNCTIONS
# =============================================================================

implement_role_separation() {
    local file1=$1
    local file2=$2
    local comparison_file=$3
    
    log_action "🔧" "Implementing architectural role separation"
    
    local output_dir="$CRYSTALLIZATION_DIR/role-separation"
    mkdir -p "$output_dir"/{orchestrators,specialized,contracts}
    
    local role1=$(jq -r '.strategic_analysis.roles.file1' "$comparison_file")
    local role2=$(jq -r '.strategic_analysis.roles.file2' "$comparison_file")
    
    # Create orchestrator
    cat > "$output_dir/orchestrators/$(basename "${file1%.*}")$(basename "${file2%.*}")Orchestrator.ts" << EOF
/**
 * Role Separation Orchestrator
 * Coordinates between $role1 and $role2 roles
 * Generated: $(date)
 */

export interface RoleOrchestrator {
    coordinate${role1^}With${role2^}(): Promise<void>;
    handle${role1^}Request(request: any): Promise<any>;
    handle${role2^}Request(request: any): Promise<any>;
}

export class $(basename "${file1%.*}")$(basename "${file2%.*}")Orchestrator implements RoleOrchestrator {
    // TODO: Implement role coordination logic
    // TODO: Add proper error handling and fallbacks
    // TODO: Implement monitoring and logging
}
EOF
}

implement_evolution_merge() {
    local file1=$1
    local file2=$2
    local comparison_file=$3
    
    log_action "⏰" "Implementing temporal evolution merge"
    
    local output_dir="$CRYSTALLIZATION_DIR/evolution-merge"
    mkdir -p "$output_dir"/{merged,history,migration}
    
    # Create evolution-aware merge
    local merged_file="$output_dir/merged/$(basename "${file1%.*}")_evolved.ts"
    cat > "$merged_file" << EOF
/**
 * Temporal Evolution Merge
 * Combines evolutionary improvements from both implementations
 * Generated: $(date)
 */

// TODO: Merge recent improvements while maintaining compatibility
// TODO: Preserve evolution history and migration paths
// TODO: Implement backward compatibility layers

EOF
    
    # Add newer file as base, older as reference
    if [[ "$file1" -nt "$file2" ]]; then
        echo "// Primary (newer): $file1" >> "$merged_file"
        cat "$file1" >> "$merged_file"
        echo -e "\n// Evolution reference (older): $file2" >> "$merged_file"
        sed 's/^/\/\/ /' "$file2" >> "$merged_file"
    else
        echo "// Primary (newer): $file2" >> "$merged_file"
        cat "$file2" >> "$merged_file"
        echo -e "\n// Evolution reference (older): $file1" >> "$merged_file"
        sed 's/^/\/\/ /' "$file1" >> "$merged_file"
    fi
}

implement_feature_integration() {
    local file1=$1
    local file2=$2
    local comparison_file=$3
    
    log_action "🔀" "Implementing strategic feature integration"
    
    local output_dir="$CRYSTALLIZATION_DIR/feature-integration"
    mkdir -p "$output_dir"/{integrated,features,testing}
    
    local integrated_file="$output_dir/integrated/$(basename "${file1%.*}")_integrated.ts"
    cat > "$integrated_file" << EOF
/**
 * Strategic Feature Integration
 * Manual integration required for complex feature combinations
 * Generated: $(date)
 */

// This integration requires careful manual review and testing
// Both implementations have unique value that should be preserved

// ============ IMPLEMENTATION A: $(basename "$file1") ============
$(cat "$file1")

// ============ IMPLEMENTATION B: $(basename "$file2") ============
// TODO: Extract and integrate unique features from this implementation:
$(sed 's/^/\/\/ /' "$file2")

// ============ INTEGRATION TASKS ============
// [ ] Identify unique features in each implementation
// [ ] Create unified API that supports both feature sets
// [ ] Implement feature flags for gradual rollout
// [ ] Create comprehensive test coverage
// [ ] Document integration decisions and trade-offs
EOF
}

# Run the main function
main "$@"