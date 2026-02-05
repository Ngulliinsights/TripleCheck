#!/bin/bash

# Convenience wrapper for import management tools
# Usage: ./import-tools.sh <command> [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    cat << EOF
${BLUE}Import Management Tools${NC}

${YELLOW}Commands:${NC}
  validate              Validate all imports (no changes)
  fix                   Preview import fixes (dry run)
  apply                 Apply import fixes (live mode)
  
${YELLOW}Options:${NC}
  --verbose, -v         Enable verbose output
  --help, -h            Show this help message

${YELLOW}Examples:${NC}
  ./import-tools.sh validate              # Check all imports
  ./import-tools.sh fix                   # Preview fixes
  ./import-tools.sh apply                 # Apply fixes
  ./import-tools.sh apply -v              # Apply with verbose output

${YELLOW}Files:${NC}
  import-validator.mjs     Validation script
  import-resolver.mjs      Resolution/fixing script
  docs/                    Generated reports

${YELLOW}Environment Variables:${NC}
  DRY_RUN=true|false      Control whether fixes are applied (default: true)
  VERBOSE=true|false      Enable verbose output (default: false)

${YELLOW}More Info:${NC}
  See README.md for detailed documentation

EOF
}

check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is required but not found${NC}"
        echo "Please install Node.js 14 or higher"
        exit 1
    fi
    
    local version=$(node --version | sed 's/v//' | cut -d'.' -f1)
    if [ "$version" -lt 14 ]; then
        echo -e "${RED}Error: Node.js 14 or higher is required (found v$version)${NC}"
        exit 1
    fi
}

validate_imports() {
    echo -e "${BLUE}Running import validation...${NC}\n"
    node "$SCRIPT_DIR/import-validator.mjs"
}

fix_imports() {
    echo -e "${BLUE}Previewing import fixes (dry run)...${NC}\n"
    DRY_RUN=true node "$SCRIPT_DIR/import-resolver.mjs"
}

apply_fixes() {
    echo -e "${YELLOW}Applying import fixes...${NC}\n"
    DRY_RUN=false node "$SCRIPT_DIR/import-resolver.mjs"
}

main() {
    check_node
    
    local VERBOSE_FLAG=""
    local COMMAND=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            validate)
                COMMAND="validate"
                shift
                ;;
            fix)
                COMMAND="fix"
                shift
                ;;
            apply)
                COMMAND="apply"
                shift
                ;;
            -v|--verbose)
                VERBOSE_FLAG="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option: $1${NC}\n"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set verbose mode
    [ -n "$VERBOSE_FLAG" ] && export VERBOSE=true
    
    # Execute command
    case "$COMMAND" in
        validate)
            validate_imports
            ;;
        fix)
            fix_imports
            ;;
        apply)
            apply_fixes
            ;;
        *)
            echo -e "${RED}Error: No command specified${NC}\n"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
