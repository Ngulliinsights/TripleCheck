#!/bin/bash

# Project Structure Generator for Documentation
# This script creates a clean, readable project structure suitable for README files or documentation

# Output file (optional - comment out if you just want terminal output)
OUTPUT_FILE="docs/project-structure.md"

# Color codes for better readability (optional)
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to output to both terminal and file
output() {
    echo "$1"
    if [ ! -z "$OUTPUT_FILE" ]; then
        echo "$1" >> "$OUTPUT_FILE"
    fi
}

# Clear the output file if it exists
if [ ! -z "$OUTPUT_FILE" ]; then
    > "$OUTPUT_FILE"
    mkdir -p "$(dirname "$OUTPUT_FILE")"
fi

output "# Project Structure"
output ""
output "\`\`\`"

find . -not -path '*/.*' -not -path '*/node_modules*' -not -path '*/dist*' -not -path '*/build*' -not -path '*/.git*' | sort | while read path; do
  # Remove the leading ./ from paths for cleaner output
  clean_path="${path#./}"
  
  # Skip the root directory entry
  if [ "$clean_path" = "." ] || [ -z "$clean_path" ]; then
    continue
  fi
  
  # Count directory depth by counting forward slashes
  depth=$(echo "$clean_path" | tr -cd '/' | wc -c)
  
  # Only show files/directories up to depth 5 to keep structure manageable
  if [ $depth -le 5 ]; then
    # Create indentation: 2 spaces per depth level, plus tree characters
    indent=""
    for i in $(seq 1 $depth); do
      if [ $i -eq $depth ]; then
        indent="${indent}├── "
      else
        indent="${indent}│   "
      fi
    done
    
    # Handle files vs directories differently
    if [ -d "$path" ]; then
      # Directory: show with trailing slash and bold formatting
      dir_name=$(basename "$clean_path")
      output "${indent}${dir_name}/"
    else
      # File: show just the filename
      file_name=$(basename "$clean_path")
      output "${indent}${file_name}"
    fi
  fi
done

output "\`\`\`"
output ""
output "## Structure Notes"
output ""
output "- \`node_modules/\`, \`dist/\`, \`build/\`, and hidden directories (starting with \`.\`) are excluded"
output "- Directory structure is limited to 5 levels deep for readability"
output "- Directories are marked with a trailing \`/\`"
output ""
output "## Key Directories"
output ""
output "- **src/**: Frontend React application with domain-driven architecture"
output "- **server/**: Backend API services with comprehensive land verification"
output "- **scripts/**: Data generation, migration, and deployment automation"
output "- **tests/**: E2E, integration, and performance testing suites"
output "- **docs/**: Documentation and deployment guides"
output ""
output "Generated on: $(date)"

if [ ! -z "$OUTPUT_FILE" ]; then
    echo "Structure saved to: $OUTPUT_FILE"
fi