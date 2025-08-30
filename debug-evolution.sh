#!/bin/bash
# Debug version to identify the issue

set -e

echo "🔍 Debugging the evolution script..."

# Test jq
echo "Testing jq..."
echo '{"test": "value"}' | jq '.test' || echo "❌ jq failed"

# Test file discovery
echo "Testing file discovery..."
file_count=$(find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.code-evolution/*" | wc -l)
echo "Found $file_count TypeScript files"

# Test a single file analysis
echo "Testing single file analysis..."
test_file=$(find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.code-evolution/*" | head -1)
echo "Test file: $test_file"

if [[ -f "$test_file" ]]; then
    echo "File exists, testing basic operations..."
    
    # Test basic file operations
    file_size=$(wc -c < "$test_file")
    line_count=$(wc -l < "$test_file")
    echo "File size: $file_size, Lines: $line_count"
    
    # Test grep operations
    func_count=$(grep -c "function\|=>" "$test_file" 2>/dev/null || echo "0")
    echo "Functions found: $func_count"
    
    # Test domain analysis
    domain_words=$(grep -o -i -E "(land|property|fraud|email|cache|auth|verification|user|payment|api|service|controller|config|type|interface)" "$test_file" | sort -u | head -5)
    echo "Domain words found:"
    echo "$domain_words"
    
    # Test jq with domain words
    echo "Testing jq with domain words..."
    echo "$domain_words" | jq -R . | jq -s . || echo "❌ jq failed with domain words"
    
else
    echo "❌ No test file found"
fi

echo "✅ Debug complete"