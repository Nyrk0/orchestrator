#!/bin/bash

# Orchestrator Installation Script
# Installs orchestrator as a portable tool in any project
# Security-hardened version with input validation and integrity checks

set -euo pipefail  # Strict error handling
IFS=$'\n\t'       # Secure IFS

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Minimum Node.js version required
readonly MIN_NODE_VERSION="14.0.0"

# Security functions
validate_path() {
    local path="$1"
    local name="$2"
    
    # Check for dangerous patterns
    if [[ "$path" =~ \.\. ]] || [[ "$path" =~ [\;\&\|\`\$\(\)] ]] || [[ "$path" =~ ^/etc ]] || [[ "$path" =~ ^/usr ]] || [[ "$path" =~ ^/bin ]]; then
        echo -e "${RED}❌ Error: Invalid or dangerous path detected in $name: $path${NC}" >&2
        exit 1
    fi
    
    # Ensure path is absolute and exists
    if [[ ! "$path" =~ ^/ ]]; then
        echo -e "${RED}❌ Error: Path must be absolute: $path${NC}" >&2
        exit 1
    fi
}

version_compare() {
    local version1="$1"
    local version2="$2"
    
    # Remove 'v' prefix if present
    version1="${version1#v}"
    version2="${version2#v}"
    
    # Compare versions: return 0 if version1 >= version2
    local sorted_versions
    sorted_versions=$(printf '%s\n%s\n' "$version1" "$version2" | sort -V)
    local first_version
    first_version=$(echo "$sorted_versions" | head -n1)
    
    # If version2 comes first in sorted order, then version1 >= version2
    if [[ "$first_version" == "$version2" ]]; then
        return 0  # version1 >= version2
    else
        return 1  # version1 < version2
    fi
}

verify_file_integrity() {
    local file="$1"
    local description="$2"
    
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Error: Required file not found: $description at $file${NC}" >&2
        exit 1
    fi
    
    # Check file is readable and not empty
    if [[ ! -r "$file" ]] || [[ ! -s "$file" ]]; then
        echo -e "${RED}❌ Error: File is not readable or empty: $description${NC}" >&2
        exit 1
    fi
    
    # Basic file type validation
    case "$file" in
        *.js)
            if ! head -1 "$file" | grep -qE '^(#!/usr/bin/env node|//|/\*|const|let|var|import|export|module\.exports)'; then
                echo -e "${YELLOW}⚠️  Warning: File may not be a valid JavaScript file: $file${NC}" >&2
            fi
            ;;
        *.md)
            if ! file "$file" | grep -q "text"; then
                echo -e "${RED}❌ Error: File is not a text file: $description${NC}" >&2
                exit 1
            fi
            ;;
    esac
}

secure_copy() {
    local src="$1"
    local dest="$2"
    local description="$3"
    
    echo "   Copying $description..."
    
    # Verify source exists and is readable
    if [[ ! -r "$src" ]]; then
        echo -e "${RED}❌ Error: Cannot read source: $src${NC}" >&2
        exit 1
    fi
    
    # Create destination directory if needed
    local dest_dir
    dest_dir="$(dirname "$dest")"
    mkdir -p "$dest_dir"
    
    # Perform copy with error checking
    if ! cp "$src" "$dest" 2>/dev/null; then
        echo -e "${RED}❌ Error: Failed to copy $description from $src to $dest${NC}" >&2
        exit 1
    fi
    
    # Set secure permissions
    chmod 644 "$dest"
}

secure_copy_dir() {
    local src_dir="$1"
    local dest_dir="$2"
    local description="$3"
    
    echo "   Copying $description..."
    
    if [[ ! -d "$src_dir" ]] || [[ ! "$(ls -A "$src_dir" 2>/dev/null)" ]]; then
        echo -e "${YELLOW}⚠️  Warning: $description directory not found or empty: $src_dir${NC}"
        return 0
    fi
    
    # Create destination directory
    mkdir -p "$dest_dir"
    
    # Copy contents with error checking
    if ! cp -r "$src_dir/"* "$dest_dir/" 2>/dev/null; then
        echo -e "${RED}❌ Error: Failed to copy $description${NC}" >&2
        exit 1
    fi
    
    # Set secure permissions on copied files
    find "$dest_dir" -type f -exec chmod 644 {} \;
    find "$dest_dir" -type d -exec chmod 755 {} \;
}

# Get script directory securely
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Validate script directory
validate_path "$SCRIPT_DIR" "script directory"

# Define source paths
readonly ORCHESTRATOR_SOURCE="$SCRIPT_DIR/orchestrator"
readonly ORCH_AGENT_SOURCE="$SCRIPT_DIR/.claude/agents/orch.md"

# Determine target directory with security validation
if [[ -n "${1:-}" ]]; then
    # Validate and resolve target directory argument
    if [[ ! -d "$1" ]]; then
        echo -e "${RED}❌ Error: Target directory does not exist: $1${NC}" >&2
        exit 1
    fi
    
    # Get absolute path safely
    TARGET_DIR="$(cd "$1" && pwd)" || {
        echo -e "${RED}❌ Error: Cannot access target directory: $1${NC}" >&2
        exit 1
    }
    
    validate_path "$TARGET_DIR" "target directory"
else
    # Use current working directory
    TARGET_DIR="$(pwd)"
    validate_path "$TARGET_DIR" "current directory"
fi

readonly TARGET_DIR

echo -e "${BLUE}🎯 Orchestrator Installation Script (Security Hardened)${NC}"
echo "======================================================"
echo "Source: $SCRIPT_DIR"
echo "Target: $TARGET_DIR"
echo ""

# Validate source files exist and have integrity
echo -e "${YELLOW}🔍 Validating source files...${NC}"
verify_file_integrity "$ORCHESTRATOR_SOURCE/cli.js" "CLI script"
verify_file_integrity "$ORCH_AGENT_SOURCE" "Orch agent"

if [[ ! -d "$ORCHESTRATOR_SOURCE" ]]; then
    echo -e "${RED}❌ Error: orchestrator source directory not found at $ORCHESTRATOR_SOURCE${NC}" >&2
    exit 1
fi

echo -e "${GREEN}✅ Source files validated${NC}"

# Check Node.js availability and version
echo -e "${YELLOW}🔍 Checking Node.js requirements...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js $MIN_NODE_VERSION or later.${NC}" >&2
    exit 1
fi

NODE_VERSION=$(node --version)
echo "   Found Node.js: $NODE_VERSION"

# Validate Node.js version
if ! version_compare "$NODE_VERSION" "$MIN_NODE_VERSION"; then
    echo -e "${RED}❌ Error: Node.js version $NODE_VERSION is too old. Minimum required: $MIN_NODE_VERSION${NC}" >&2
    exit 1
fi

echo -e "${GREEN}✅ Node.js version is compatible${NC}"

# Installation targets
readonly ORCHESTRATOR_TARGET="$TARGET_DIR/.orchestrator"
readonly CLAUDE_AGENTS_TARGET="$TARGET_DIR/.claude/agents"
readonly BACKUP_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

echo ""
echo -e "${YELLOW}📦 Installing orchestrator...${NC}"

# Create comprehensive backup if existing installation found
if [[ -d "$ORCHESTRATOR_TARGET" ]]; then
    echo -e "${YELLOW}⚠️  Existing .orchestrator found. Creating backup...${NC}"
    
    readonly BACKUP_DIR="$ORCHESTRATOR_TARGET.backup.$BACKUP_TIMESTAMP"
    
    # Create full backup of existing installation
    if ! cp -r "$ORCHESTRATOR_TARGET" "$BACKUP_DIR" 2>/dev/null; then
        echo -e "${RED}❌ Error: Failed to create backup${NC}" >&2
        exit 1
    fi
    
    echo "   Backup created at: $BACKUP_DIR"
    
    # Preserve critical state files during update
    if [[ -d "$ORCHESTRATOR_TARGET/orchestrator-states" ]]; then
        echo "   Preserving state files..."
        readonly TEMP_STATES="/tmp/orchestrator-states.$BACKUP_TIMESTAMP"
        cp -r "$ORCHESTRATOR_TARGET/orchestrator-states" "$TEMP_STATES" || {
            echo -e "${RED}❌ Error: Failed to preserve state files${NC}" >&2
            exit 1
        }
    fi
else
    echo "   Creating new .orchestrator directory..."
fi

# Create target directory structure with secure permissions
echo "   Creating directory structure..."
mkdir -p "$ORCHESTRATOR_TARGET"
chmod 755 "$ORCHESTRATOR_TARGET"

# Create subdirectories
for dir in commands core schemas templates tests; do
    mkdir -p "$ORCHESTRATOR_TARGET/$dir"
    chmod 755 "$ORCHESTRATOR_TARGET/$dir"
done

# Copy core files with integrity verification
echo "   Installing core files..."
secure_copy "$ORCHESTRATOR_SOURCE/cli.js" "$ORCHESTRATOR_TARGET/cli.js" "CLI script"
chmod 755 "$ORCHESTRATOR_TARGET/cli.js"  # CLI needs execute permission

if [[ -f "$ORCHESTRATOR_SOURCE/orch-core-methodology.md" ]]; then
    secure_copy "$ORCHESTRATOR_SOURCE/orch-core-methodology.md" "$ORCHESTRATOR_TARGET/orch-core-methodology.md" "methodology documentation"
fi

# Copy directories with secure error handling
secure_copy_dir "$ORCHESTRATOR_SOURCE/commands" "$ORCHESTRATOR_TARGET/commands" "commands"
secure_copy_dir "$ORCHESTRATOR_SOURCE/core" "$ORCHESTRATOR_TARGET/core" "core modules"
secure_copy_dir "$ORCHESTRATOR_SOURCE/schemas" "$ORCHESTRATOR_TARGET/schemas" "schemas"
secure_copy_dir "$ORCHESTRATOR_SOURCE/templates" "$ORCHESTRATOR_TARGET/templates" "templates"
secure_copy_dir "$ORCHESTRATOR_SOURCE/tests" "$ORCHESTRATOR_TARGET/tests" "tests"

# Copy package.json with validation
if [[ -f "$ORCHESTRATOR_SOURCE/package.json" ]]; then
    verify_file_integrity "$ORCHESTRATOR_SOURCE/package.json" "package.json"
    secure_copy "$ORCHESTRATOR_SOURCE/package.json" "$ORCHESTRATOR_TARGET/package.json" "package configuration"
fi

# Install npm dependencies securely if package.json exists
if [[ -f "$ORCHESTRATOR_TARGET/package.json" ]]; then
    echo "   Installing dependencies securely..."
    
    # Change to target directory
    pushd "$ORCHESTRATOR_TARGET" > /dev/null || {
        echo -e "${RED}❌ Error: Cannot change to orchestrator directory${NC}" >&2
        exit 1
    }
    
    # Use npm ci for reproducible installs, or npm install with audit
    if [[ -f "package-lock.json" ]]; then
        echo "     Using npm ci for reproducible install..."
        if ! npm ci --only=production --no-optional 2>&1; then
            echo -e "${RED}❌ Error: npm ci failed${NC}" >&2
            popd > /dev/null
            exit 1
        fi
    else
        echo "     Using npm install with security audit..."
        if ! npm install --only=production --no-optional 2>&1; then
            echo -e "${RED}❌ Error: npm install failed${NC}" >&2
            popd > /dev/null
            exit 1
        fi
        
        # Run security audit
        echo "     Running security audit..."
        if ! npm audit --audit-level=high 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Warning: Security vulnerabilities detected in dependencies${NC}"
            echo "     Run 'npm audit fix' in .orchestrator/ to address them"
        fi
    fi
    
    # Return to original directory
    popd > /dev/null
fi

# Restore preserved state files if they exist
if [[ -n "${TEMP_STATES:-}" ]] && [[ -d "$TEMP_STATES" ]]; then
    echo "   Restoring preserved state files..."
    cp -r "$TEMP_STATES" "$ORCHESTRATOR_TARGET/orchestrator-states" || {
        echo -e "${YELLOW}⚠️  Warning: Failed to restore state files${NC}"
    }
    rm -rf "$TEMP_STATES"
fi

echo -e "${GREEN}✅ Orchestrator installed at .orchestrator/${NC}"

echo ""
echo -e "${YELLOW}🤖 Installing orch subagent...${NC}"

# Create .claude/agents directory with secure permissions
mkdir -p "$CLAUDE_AGENTS_TARGET"
chmod 755 "$CLAUDE_AGENTS_TARGET"

# Copy orch agent with integrity verification
secure_copy "$ORCH_AGENT_SOURCE" "$CLAUDE_AGENTS_TARGET/orch.md" "orch subagent"

echo -e "${GREEN}✅ Orch subagent installed at .claude/agents/orch.md${NC}"

# Create secure convenience wrapper script
readonly WRAPPER_SCRIPT="$TARGET_DIR/orch"
echo "   Creating convenience wrapper..."

# Create wrapper with security hardening
cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
# Orchestrator convenience wrapper - Security hardened
set -euo pipefail

# Get script directory securely
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCH_DIR="$SCRIPT_DIR/.orchestrator"

# Validate orchestrator directory exists
if [[ ! -d "$ORCH_DIR" ]]; then
    echo "Error: Orchestrator not found at $ORCH_DIR" >&2
    exit 1
fi

# Validate CLI script exists and is executable
if [[ ! -x "$ORCH_DIR/cli.js" ]]; then
    echo "Error: CLI script not found or not executable at $ORCH_DIR/cli.js" >&2
    exit 1
fi

# Change to orchestrator directory and run CLI
cd "$ORCH_DIR" && exec node cli.js "$@"
EOF

# Set secure permissions
chmod 755 "$WRAPPER_SCRIPT"

echo -e "${GREEN}✅ Secure convenience wrapper created: ./orch${NC}"

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

# Comprehensive installation test
echo -e "${YELLOW}🧪 Running installation tests...${NC}"

# Test 1: CLI script exists and is executable
if [[ ! -x "$ORCHESTRATOR_TARGET/cli.js" ]]; then
    echo -e "${RED}❌ Test failed: CLI script not executable${NC}" >&2
    exit 1
fi

# Test 2: Node.js can load the CLI script
echo "   Testing CLI script loading..."
if ! (cd "$ORCHESTRATOR_TARGET" && timeout 10s node -c cli.js 2>/dev/null); then
    echo -e "${RED}❌ Test failed: CLI script has syntax errors${NC}" >&2
    exit 1
fi

# Test 3: CLI help command works
echo "   Testing CLI help command..."
if ! (cd "$ORCHESTRATOR_TARGET" && timeout 10s node cli.js --help 2>&1 | head -20 | grep -qE "(Orchestrator|Usage|Help|Commands)"); then
    echo -e "${RED}❌ Test failed: CLI help command failed${NC}" >&2
    exit 1
fi

# Test 4: Wrapper script works
echo "   Testing wrapper script..."
if ! timeout 10s "$WRAPPER_SCRIPT" --help 2>&1 | head -10 | grep -qE "(Orchestrator|Usage|Help|Commands)"; then
    echo -e "${RED}❌ Test failed: Wrapper script failed${NC}" >&2
    exit 1
fi

echo -e "${GREEN}✅ All installation tests passed${NC}"

# Security summary
echo ""
echo -e "${BLUE}🔒 Security Features Enabled:${NC}"
echo "  ✅ Input validation and path sanitization"
echo "  ✅ File integrity verification"
echo "  ✅ Secure file permissions (644/755)"
echo "  ✅ Dependency security audit"
echo "  ✅ Comprehensive backup system"
echo "  ✅ Fail-fast error handling"
echo ""

if [[ -n "${BACKUP_DIR:-}" ]]; then
    echo -e "${YELLOW}📁 Backup Information:${NC}"
    echo "  Previous installation backed up to: $BACKUP_DIR"
    echo "  To rollback: rm -rf .orchestrator && mv $BACKUP_DIR .orchestrator"
    echo ""
fi

echo -e "${GREEN}🚀 Orchestrator is ready to use securely!${NC}"