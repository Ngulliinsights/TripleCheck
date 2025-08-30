#!/bin/bash
# Quick test to verify jq is working
echo "Testing jq installation..."

if command -v jq &> /dev/null; then
    echo "✅ jq is available"
    echo '{"test": "value", "number": 42}' | jq '.test'
    echo "jq version: $(jq --version)"
else
    echo "❌ jq not found in PATH"
    echo "Please restart your terminal and try again"
fi