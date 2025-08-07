#!/bin/bash

# Simple version that saves directly to a file
OUTPUT_FILE="docs/project-structure.md"

# Create docs directory if it doesn't exist
mkdir -p docs

# Generate structure and save to file
{
    echo "# Project Structure"
    echo ""
    echo "\`\`\`"
    
    find . -not -path '*/.*' -not -path '*/node_modules*' -not -path '*/dist*' -not -path '*/build*' -not -path '*/.git*' | sort | while read path; do
        clean_path="${path#./}"
        
        if [ "$clean_path" = "." ] || [ -z "$clean_path" ]; then
            continue
        fi
        
        depth=$(echo "$clean_path" | tr -cd '/' | wc -c)
        
        if [ $depth -le 5 ]; then
            indent=""
            for i in $(seq 1 $depth); do
                if [ $i -eq $depth ]; then
                    indent="${indent}├── "
                else
                    indent="${indent}│   "
                fi
            done
            
            if [ -d "$path" ]; then
                dir_name=$(basename "$clean_path")
                echo "${indent}${dir_name}/"
            else
                file_name=$(basename "$clean_path")
                echo "${indent}${file_name}"
            fi
        fi
    done
    
    echo "\`\`\`"
    echo ""
    echo "Generated on: $(date)"
    
} > "$OUTPUT_FILE"

echo "Project structure saved to: $OUTPUT_FILE"