#!/usr/bin/env bash
# Test script for agent creation

set -euo pipefail

echo "Testing Dify Agent Creation Scripts"
echo "=================================="

# Test parameter validation
echo "Testing parameter validation..."

# Test with invalid agent type
echo "Testing invalid agent type..."
if ./create_dify_agent.sh "Test Agent" "Invalid Type" 2>&1 | grep -q "Invalid agent type"; then
    echo "✓ Invalid agent type validation works"
else
    echo "✗ Invalid agent type validation failed"
    exit 1
fi

# Test with missing parameters
echo "Testing missing parameters..."
if ./create_dify_agent.sh 2>&1 | grep -q "Error"; then
    echo "✓ Missing parameters validation works"
else
    echo "✗ Missing parameters validation failed"
    exit 1
fi

echo ""
echo "Parameter validation tests passed!"
echo ""

# Test YAML generation (without actually creating agents)
echo "Testing YAML generation..."

# Test Knowledge Agent YAML
echo "Testing Knowledge Agent YAML generation..."
KNOWLEDGE_YAML=$(AGENT_NAME="Test Knowledge Agent" AGENT_TYPE="Knowledge Agent (RAG)" bash -c '
source ./create_dify_agent.sh
echo "$DSL_A"
' 2>/dev/null || true)

if echo "$KNOWLEDGE_YAML" | grep -q "mode: \"chat\"" && echo "$KNOWLEDGE_YAML" | grep -q "Knowledge Agent (RAG)"; then
    echo "✓ Knowledge Agent YAML generation works"
else
    echo "✗ Knowledge Agent YAML generation failed"
    echo "Generated YAML:"
    echo "$KNOWLEDGE_YAML"
    exit 1
fi

# Test Action Agent YAML
echo "Testing Action Agent YAML generation..."
ACTION_YAML=$(AGENT_NAME="Test Action Agent" AGENT_TYPE="Action Agent (AI Employee)" bash -c '
source ./create_dify_agent.sh
echo "$DSL_A"
' 2>/dev/null || true)

if echo "$ACTION_YAML" | grep -q "mode: \"agent-chat\"" && echo "$ACTION_YAML" | grep -q "Action Agent (AI Employee)"; then
    echo "✓ Action Agent YAML generation works"
else
    echo "✗ Action Agent YAML generation failed"
    echo "Generated YAML:"
    echo "$ACTION_YAML"
    exit 1
fi

echo ""
echo "YAML generation tests passed!"
echo ""

echo "All tests passed! ✅"
echo ""
echo "To create actual agents, ensure environment variables are set and run:"
echo "  ./create_dify_agent.sh \"Agent Name\" \"Knowledge Agent (RAG)\""
echo "  ./create_dify_agent.sh \"Agent Name\" \"Action Agent (AI Employee)\""
