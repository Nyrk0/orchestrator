#!/bin/bash

# QUALIA•NSS Orchestrator System - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PRODUCTION_DIR="${PRODUCTION_DIR:-/production/orchestrator}"
BACKUP_DIR="$PRODUCTION_DIR/backups"
CONFIG_DIR="$PRODUCTION_DIR/config"
LOG_FILE="$PRODUCTION_DIR/logs/deploy-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    # Also log to file if log directory exists
    if [[ -d "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed"
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    
    if [[ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]]; then
        error_exit "Node.js version $node_version is below required version $required_version"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error_exit "npm is not installed"
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]] || [[ ! -f "$PROJECT_ROOT/cli.js" ]]; then
        error_exit "Not in orchestrator project directory or missing required files"
    fi
    
    # Check disk space (require at least 1GB)
    local available_space=$(df "$PRODUCTION_DIR" 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
    if [[ $available_space -lt 1048576 ]]; then
        log "WARN" "Available disk space may be insufficient for production deployment"
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Run pre-deployment validation
pre_deployment_validation() {
    log "INFO" "Running pre-deployment validation..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies for testing
    log "INFO" "Installing dependencies for validation..."
    npm ci --quiet
    
    # Run test suite
    log "INFO" "Running test suite..."
    if ! npm test --silent; then
        error_exit "Test suite failed - deployment aborted"
    fi
    
    # Run production validation
    log "INFO" "Running production validation..."
    if ! npm run validate:production --silent; then
        error_exit "Production validation failed - deployment aborted"
    fi
    
    # Run performance benchmark
    log "INFO" "Running performance benchmark..."
    if ! npm run test:performance --silent; then
        log "WARN" "Performance benchmark failed - reviewing results recommended"
    fi
    
    log "INFO" "Pre-deployment validation completed successfully"
}

# Create production directories
create_directories() {
    log "INFO" "Creating production directory structure..."
    
    mkdir -p "$PRODUCTION_DIR"/{app,data/{states,backups,logs},config,scripts}
    
    # Set proper permissions
    chmod 755 "$PRODUCTION_DIR"
    chmod 755 "$PRODUCTION_DIR/app"
    chmod 770 "$PRODUCTION_DIR/data"
    chmod 770 "$PRODUCTION_DIR/data"/{states,backups,logs}
    chmod 750 "$PRODUCTION_DIR/config"
    chmod 755 "$PRODUCTION_DIR/scripts"
    
    log "INFO" "Directory structure created"
}

# Backup existing deployment
backup_existing() {
    if [[ -d "$PRODUCTION_DIR/app" ]]; then
        log "INFO" "Backing up existing deployment..."
        
        local backup_name="deployment_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR/$backup_name"
        
        cp -r "$PRODUCTION_DIR/app" "$BACKUP_DIR/$backup_name/"
        cp -r "$PRODUCTION_DIR/config" "$BACKUP_DIR/$backup_name/" 2>/dev/null || true
        
        # Compress backup
        cd "$BACKUP_DIR"
        tar -czf "$backup_name.tar.gz" "$backup_name"
        rm -rf "$backup_name"
        
        log "INFO" "Existing deployment backed up to $backup_name.tar.gz"
    fi
}

# Deploy application files
deploy_application() {
    log "INFO" "Deploying application files..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy core application files
    cp -r core commands templates schemas "$PRODUCTION_DIR/app/"
    cp cli.js "$PRODUCTION_DIR/app/"
    cp package.json package-lock.json "$PRODUCTION_DIR/app/"
    cp -r scripts "$PRODUCTION_DIR/app/"
    
    # Deploy documentation
    cp README.md API.md CHANGELOG.md PRODUCTION-GUIDE.md "$PRODUCTION_DIR/app/"
    
    # Create production package.json (exclude dev dependencies)
    cd "$PRODUCTION_DIR/app"
    
    # Install production dependencies only
    log "INFO" "Installing production dependencies..."
    NODE_ENV=production npm ci --only=production --quiet
    
    log "INFO" "Application files deployed successfully"
}

# Configure environment
configure_environment() {
    log "INFO" "Configuring production environment..."
    
    # Copy environment configuration
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        cp "$PROJECT_ROOT/.env.production" "$CONFIG_DIR/.env"
    elif [[ -f "$PROJECT_ROOT/.env.example" ]]; then
        cp "$PROJECT_ROOT/.env.example" "$CONFIG_DIR/.env"
        log "WARN" "Using example environment file - please review and customize"
    else
        log "WARN" "No environment configuration found - creating default"
        cat > "$CONFIG_DIR/.env" << EOF
NODE_ENV=production
ORCHESTRATOR_STATE_DIR=$PRODUCTION_DIR/data/states
ORCHESTRATOR_BACKUP_DIR=$PRODUCTION_DIR/data/backups
ORCHESTRATOR_LOG_DIR=$PRODUCTION_DIR/data/logs
ORCHESTRATOR_LOG_LEVEL=info
ORCHESTRATOR_ENABLE_AUDIT=true
EOF
    fi
    
    # Set proper permissions on config files
    chmod 600 "$CONFIG_DIR/.env"
    
    log "INFO" "Environment configured"
}

# Create systemd service (if systemd is available)
create_service() {
    if command -v systemctl &> /dev/null; then
        log "INFO" "Creating systemd service..."
        
        cat > /etc/systemd/system/qualia-orchestrator.service << EOF
[Unit]
Description=QUALIA•NSS Orchestrator System
After=network.target

[Service]
Type=simple
User=orchestrator
Group=orchestrator
WorkingDirectory=$PRODUCTION_DIR/app
Environment=NODE_ENV=production
EnvironmentFile=$CONFIG_DIR/.env
ExecStart=/usr/bin/node cli.js --daemon
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=qualia-orchestrator

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable qualia-orchestrator
        
        log "INFO" "Systemd service created and enabled"
    else
        log "WARN" "Systemd not available - manual service management required"
    fi
}

# Set up monitoring
setup_monitoring() {
    log "INFO" "Setting up monitoring and maintenance scripts..."
    
    # Create backup script
    cat > "$PRODUCTION_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash
# Automated backup script for QUALIA•NSS Orchestrator
BACKUP_DIR="/production/orchestrator/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR/$TIMESTAMP"
cp -r /production/orchestrator/data/states "$BACKUP_DIR/$TIMESTAMP/"
cp -r /production/orchestrator/config "$BACKUP_DIR/$TIMESTAMP/"
tar -czf "$BACKUP_DIR/orchestrator_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$BACKUP_DIR/$TIMESTAMP"
find "$BACKUP_DIR" -name "orchestrator_backup_*.tar.gz" -mtime +30 -delete
EOF
    
    # Create health check script
    cat > "$PRODUCTION_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash
# Health check script for QUALIA•NSS Orchestrator
cd /production/orchestrator/app
if node cli.js --version > /dev/null 2>&1; then
    echo "OK: Orchestrator is responding"
    exit 0
else
    echo "ERROR: Orchestrator is not responding"
    exit 1
fi
EOF
    
    # Create log rotation script
    cat > "$PRODUCTION_DIR/scripts/rotate-logs.sh" << 'EOF'
#!/bin/bash
# Log rotation script for QUALIA•NSS Orchestrator
LOG_DIR="/production/orchestrator/data/logs"
find "$LOG_DIR" -name "*.log" -size +10M -exec gzip {} \;
find "$LOG_DIR" -name "*.gz" -mtime +7 -delete
EOF
    
    # Make scripts executable
    chmod +x "$PRODUCTION_DIR/scripts"/*.sh
    
    # Set up cron jobs (if cron is available)
    if command -v crontab &> /dev/null; then
        log "INFO" "Setting up cron jobs for maintenance..."
        
        # Add cron jobs for automated maintenance
        (crontab -l 2>/dev/null || echo ""; cat << EOF
# QUALIA•NSS Orchestrator maintenance jobs
0 2 * * * $PRODUCTION_DIR/scripts/backup.sh >> $PRODUCTION_DIR/data/logs/backup.log 2>&1
*/15 * * * * $PRODUCTION_DIR/scripts/health-check.sh >> $PRODUCTION_DIR/data/logs/health.log 2>&1
0 3 * * 0 $PRODUCTION_DIR/scripts/rotate-logs.sh >> $PRODUCTION_DIR/data/logs/maintenance.log 2>&1
EOF
        ) | crontab -
        
        log "INFO" "Cron jobs configured for automated maintenance"
    fi
    
    log "INFO" "Monitoring and maintenance setup completed"
}

# Post-deployment verification
post_deployment_verification() {
    log "INFO" "Running post-deployment verification..."
    
    cd "$PRODUCTION_DIR/app"
    
    # Test CLI functionality
    if ! node cli.js --version > /dev/null 2>&1; then
        error_exit "CLI functionality test failed"
    fi
    
    # Test basic orchestrator operations
    if ! node cli.js spec test-deployment --objectives "Production deployment test" > /dev/null 2>&1; then
        error_exit "Basic orchestrator operation test failed"
    fi
    
    # Check system status
    local status_output=$(node cli.js status test-deployment 2>/dev/null || echo "ERROR")
    if [[ "$status_output" == "ERROR" ]]; then
        error_exit "System status check failed"
    fi
    
    # Test performance (basic)
    log "INFO" "Running basic performance test..."
    if ! timeout 30 node scripts/performance-benchmark.js > /dev/null 2>&1; then
        log "WARN" "Performance test failed or timed out - manual review recommended"
    fi
    
    log "INFO" "Post-deployment verification completed successfully"
}

# Start services
start_services() {
    if command -v systemctl &> /dev/null && systemctl is-enabled qualia-orchestrator &> /dev/null; then
        log "INFO" "Starting orchestrator service..."
        systemctl start qualia-orchestrator
        
        # Wait for service to start
        sleep 3
        
        if systemctl is-active qualia-orchestrator &> /dev/null; then
            log "INFO" "Orchestrator service started successfully"
        else
            log "WARN" "Orchestrator service may not have started properly - check logs"
        fi
    else
        log "INFO" "Service management not configured - manual start required"
    fi
}

# Clean up
cleanup() {
    log "INFO" "Cleaning up temporary files..."
    
    # Remove any temporary files created during deployment
    find /tmp -name "orchestrator-deploy-*" -mtime +1 -delete 2>/dev/null || true
    
    log "INFO" "Cleanup completed"
}

# Main deployment function
main() {
    log "INFO" "Starting QUALIA•NSS Orchestrator production deployment..."
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    
    check_prerequisites
    pre_deployment_validation
    create_directories
    backup_existing
    deploy_application
    configure_environment
    create_service
    setup_monitoring
    post_deployment_verification
    start_services
    cleanup
    
    log "INFO" "🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log "INFO" "Orchestrator is deployed to: $PRODUCTION_DIR"
    log "INFO" "Configuration: $CONFIG_DIR/.env"
    log "INFO" "Logs: $PRODUCTION_DIR/data/logs/"
    log "INFO" "Backups: $PRODUCTION_DIR/data/backups/"
    
    echo ""
    echo -e "${GREEN}✅ QUALIA•NSS Orchestrator System deployed successfully!${NC}"
    echo -e "${BLUE}📍 Location: $PRODUCTION_DIR${NC}"
    echo -e "${BLUE}🔧 CLI: $PRODUCTION_DIR/app/cli.js${NC}"
    echo -e "${BLUE}📊 Status: systemctl status qualia-orchestrator${NC}"
    echo -e "${BLUE}📝 Logs: journalctl -u qualia-orchestrator -f${NC}"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi