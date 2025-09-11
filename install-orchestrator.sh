#!/bin/bash

# Orchestrator Installation Script
# Installs orchestrator as a portable tool in any project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCHESTRATOR_SOURCE="$SCRIPT_DIR/orchestrator"
ORCH_AGENT_SOURCE="$SCRIPT_DIR/.claude/agents/orch.md"

# Target project root - use absolute path of where script is run from
if [ -n "$1" ]; then
    # If argument provided, use it as target
    TARGET_DIR="$(cd "$1" && pwd)"
else
    # Use current working directory (where user runs the script)
    TARGET_DIR="$(pwd)"
fi

echo -e "${BLUE}🎯 Orchestrator Installation Script${NC}"
echo "=================================="
echo "Source: $SCRIPT_DIR"
echo "Target: $TARGET_DIR"
echo ""

# Validate source exists
if [ ! -d "$ORCHESTRATOR_SOURCE" ]; then
    echo -e "${RED}❌ Error: orchestrator source directory not found at $ORCHESTRATOR_SOURCE${NC}"
    exit 1
fi

if [ ! -f "$ORCH_AGENT_SOURCE" ]; then
    echo -e "${RED}❌ Error: orch agent source not found at $ORCH_AGENT_SOURCE${NC}"
    exit 1
fi

# Check Node.js availability
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"

# Installation targets
ORCHESTRATOR_TARGET="$TARGET_DIR/.orchestrator"
CLAUDE_AGENTS_TARGET="$TARGET_DIR/.claude/agents"

echo ""
echo -e "${YELLOW}📦 Installing orchestrator...${NC}"

# Create .orchestrator directory
if [ -d "$ORCHESTRATOR_TARGET" ]; then
    echo -e "${YELLOW}⚠️  Existing .orchestrator found. Updating...${NC}"
    # Backup any existing state files
    if [ -d "$ORCHESTRATOR_TARGET/orchestrator-states" ]; then
        echo "   Backing up existing state files..."
        cp -r "$ORCHESTRATOR_TARGET/orchestrator-states" "$ORCHESTRATOR_TARGET/orchestrator-states.backup.$(date +%Y%m%d-%H%M%S)"
    fi
else
    echo "   Creating .orchestrator directory..."
fi

# Copy orchestrator core (always replace tool files)
echo "   Copying orchestrator core..."
cp -r "$ORCHESTRATOR_SOURCE" "$ORCHESTRATOR_TARGET"

# Install npm dependencies if package.json exists
if [ -f "$ORCHESTRATOR_TARGET/package.json" ]; then
    echo "   Installing dependencies..."
    cd "$ORCHESTRATOR_TARGET"
    npm install --silent
    cd "$TARGET_DIR"
fi

echo -e "${GREEN}✅ Orchestrator installed at .orchestrator/${NC}"

echo ""
echo -e "${YELLOW}🤖 Installing orch subagent...${NC}"

# Create .claude/agents directory if it doesn't exist
mkdir -p "$CLAUDE_AGENTS_TARGET"

# Copy orch agent
cp "$ORCH_AGENT_SOURCE" "$CLAUDE_AGENTS_TARGET/"

echo -e "${GREEN}✅ Orch subagent installed at .claude/agents/orch.md${NC}"

# Create convenience wrapper script
WRAPPER_SCRIPT="$TARGET_DIR/orch"
cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
# Orchestrator convenience wrapper
cd "$(dirname "$0")/.orchestrator" && node cli.js "$@"
EOF

chmod +x "$WRAPPER_SCRIPT"

echo -e "${GREEN}✅ Convenience wrapper created: ./orch${NC}"

echo ""
echo -e "${BLUE}🎉 Installation Complete!${NC}"
echo ""
echo -e "${GREEN}Usage:${NC}"
echo "  ${YELLOW}Via wrapper:${NC}      ./orch <command> <phase>"
echo "  ${YELLOW}Direct:${NC}          cd .orchestrator && node cli.js <command> <phase>"
echo "  ${YELLOW}Claude Code:${NC}     /orch <command> <phase>"
echo ""
echo -e "${GREEN}Examples:${NC}"
echo "  ./orch spec st01-authentication"
echo "  ./orch research st01-authentication"
echo "  ./orch status st01-authentication"
echo ""
echo -e "${GREEN}Help:${NC}"
echo "  ./orch --help"
echo ""

# Test installation
echo -e "${YELLOW}🧪 Testing installation...${NC}"
if cd "$ORCHESTRATOR_TARGET" && node cli.js --help >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Installation test passed${NC}"
else
    echo -e "${RED}❌ Installation test failed${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Orchestrator is ready to use!${NC}"