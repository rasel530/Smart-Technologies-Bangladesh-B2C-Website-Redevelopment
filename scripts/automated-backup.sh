#!/bin/bash

# ============================================
# Smart Tech Ecommerce - Automated Database Backup System
# ============================================
# This script performs automated daily backups of the PostgreSQL database
# It creates compressed backups and maintains a configurable retention policy
#
# Usage: ./scripts/automated-backup.sh [options]
#   Options:
#     --force      Force backup even if one was already created today
#     --no-compress  Create backup without compression
#     --dry-run    Show what would be done without executing
#
# Author: Smart Tech Team
# Created: 2026-01-31
# Version: 1.0.0
# ============================================

set -e  # Exit on error
set -u # Treat unset variables as errors
set -o pipefail # Return exit code of last command that failed

# ============================================
# Configuration
# ============================================

# Database Configuration
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="smart_ecommerce_dev"
DB_USER="smart_dev"
DB_PASSWORD="smart_dev_password_2024"

# Backup Configuration
BACKUP_DIR="E:/Smart_Ecommerce_DB"
BACKUP_RETENTION_DAYS=7  # Keep backups for 7 days
BACKUP_COMPRESS=true  # Compress backups by default
BACKUP_TIMESTAMP_FORMAT="%Y-%m-%d-%H%M%S"  # 2026-01-31-14-30-00
LOG_FILE="${BACKUP_DIR}/backup.log"
BACKUP_LOCK_FILE="${BACKUP_DIR}/.backup_in_progress"

# Email Configuration (for alerts)
ALERT_EMAIL="admin@smarttech.com"
ALERT_ENABLED=false  # Set to true to enable email alerts

# ============================================
# Color Codes
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# ============================================
# Functions
# ============================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}"
}

log_info() {
    log "INFO" "$@"
}

log_success() {
    log "SUCCESS" "$@"
    echo -e "${GREEN}✓ $*"
}

log_warning() {
    log "WARNING" "$@"
    echo -e "${YELLOW}⚠ $*"
}

log_error() {
    log "ERROR" "$@"
    echo -e "${RED}✗ $*"
}

log_debug() {
    if [ "$DEBUG" = "true" ]; then
        log "DEBUG" "$@"
    fi
}

# ============================================
# Utility Functions
# ============================================

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log_error "psql is not available. Please install PostgreSQL client tools first."
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

check_backup_dir() {
    log_info "Checking backup directory..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    # Create log file if it doesn't exist
    if [ ! -f "$LOG_FILE" ]; then
        touch "$LOG_FILE"
    fi
    
    log_success "Backup directory is ready"
}

check_lock_file() {
    # Check if another backup is in progress
    if [ -f "$BACKUP_LOCK_FILE" ]; then
        local lock_age=$(( $(date +%s) - $(stat -c %Y "$BACKUP_LOCK_FILE")))
        local lock_age_minutes=$((lock_age / 60))
        
        if [ $lock_age_minutes -lt 5 ]; then
            log_warning "Backup is already in progress (started $lock_age_minutes minutes ago)"
            log_info "Waiting for current backup to complete..."
            sleep 30
            return 1
        else
            # Lock file is stale, remove it
            rm -f "$BACKUP_LOCK_FILE"
            log_info "Removed stale lock file"
        fi
    fi
    
    return 0
}

create_lock_file() {
    # Create lock file to prevent concurrent backups
    echo "$(date +%s)" > "$BACKUP_LOCK_FILE"
    log_debug "Created lock file: $BACKUP_LOCK_FILE"
}

remove_lock_file() {
    if [ -f "$BACKUP_LOCK_FILE" ]; then
        rm -f "$BACKUP_LOCK_FILE"
        log_debug "Removed lock file: $BACKUP_LOCK_FILE"
    fi
}

get_backup_filename() {
    echo "$BACKUP_DIR/backup_${BACKUP_TIMESTAMP_FORMAT}.sql"
}

get_backup_filename_compressed() {
    echo "$BACKUP_DIR/backup_${BACKUP_TIMESTAMP_FORMAT}.sql.gz"
}

check_disk_space() {
    log_info "Checking disk space..."
    
    local required_space_mb=500 # Minimum 500MB free space required
    local available_space_mb=$(df -m "$BACKUP_DIR" --output=avail | tail -1 | awk '{print $2}')
    
    if [ $available_space_mb -lt $required_space_mb ]; then
        log_warning "Low disk space: ${available_space_mb}MB available (minimum: ${required_space_mb}MB)"
    else
        log_success "Disk space is sufficient: ${available_space_mb}MB available"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $BACKUP_RETENTION_DAYS days)..."
    
    local deleted_count=0
    local total_size_before=0
    local total_size_after=0
    
    # Calculate total size before cleanup
    if [ -d "$BACKUP_DIR" ]; then
        total_size_before=$(du -sm "$BACKUP_DIR" | cut -f1 | awk '{sum += $1}')
    fi
    
    # Find and delete old backups
    find "$BACKUP_DIR" -name "backup_*.sql*" -type f -mtime +${BACKUP_RETENTION_DAYS} | while read -r file; do
        if [ -f "$file" ]; then
            local file_size=$(stat -c %s "$file" | cut -d' ')
            total_size_after=$((total_size_after + file_size))
            rm -f "$file"
            deleted_count=$((deleted_count + 1))
            log_debug "Deleted old backup: $(basename "$file") ($(numfmt --to=iec --suffix=B --suffix=MB $file_size))"
        fi
    done
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Deleted $deleted_count old backup(s), freed $(( (total_size_before - total_size_after) / 1048576 ))MB"
    else
        log_info "No old backups to clean up"
    fi
}

# ============================================
# Backup Functions
# ============================================

create_backup() {
    local backup_file="$1"
    
    log_info "Creating backup: $(basename "$backup_file")..."
    
    # Create lock file
    create_lock_file
    
    # Use pg_dump to create backup
    local dump_cmd="docker exec -i smarttech_postgres pg_dump -U $DB_USER -d $DB_NAME --format=plain --no-owner --no-acl"
    
    if [ "$BACKUP_COMPRESS" = "true" ]; then
        dump_cmd="$dump_cmd | gzip > \"${backup_file}.gz\""
        log_info "Backup will be compressed"
    else
        dump_cmd="$dump_cmd > \"$backup_file\""
    fi
    
    log_debug "Executing: $dump_cmd"
    
    # Execute backup
    if eval "$dump_cmd"; then
        local backup_size=$(stat -c %s "$backup_file" | cut -d' ')
        
        # Remove lock file
        remove_lock_file
        
        # Log success
        if [ "$BACKUP_COMPRESS" = "true" ]; then
            backup_size=$(stat -c %s "${backup_file}.gz" | cut -d' ')
            log_success "Backup completed: $(basename "$backup_file") ($(numfmt --to=iec --suffix=MB $backup_size))"
        else
            log_success "Backup completed: $(basename "$backup_file") ($(numfmt --to=iec --B --suffix=MB $backup_size))"
        fi
        
        # Write to log file
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup completed: $(basename "$backup_file") ($(numfmt --to=iec --suffix=MB $backup_size))" >> "$LOG_FILE"
        
        # Send email alert if enabled
        if [ "$ALERT_ENABLED" = "true" ]; then
            echo "Backup completed: $(basename "$backup_file")" | mail -s "Backup Alert" -a "$ALERT_EMAIL"
        fi
        
        return 0
    else
        log_error "Backup failed: $(basename "$backup_file")"
        remove_lock_file
        return 1
    fi
}

verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup: $(basename "$backup_file")..."
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(stat -c %s "$backup_file" | cut -d' ')
    
    # Check minimum size (at least 100KB for uncompressed, 10KB for compressed)
    local min_size_kb=100
    if [ "$BACKUP_COMPRESS" = "true" ]; then
        min_size_kb=10
    fi
    
    local file_size_kb=$((file_size / 1024))
    
    if [ $file_size_kb -lt $min_size_kb ]; then
        log_error "Backup file is too small: ${file_size_kb}KB (minimum: ${min_size_kb}KB)"
        return 1
    fi
    
    # Check if backup contains expected tables
    local expected_tables=("products" "product_images" "product_specifications" "product_variants" "product_categories" "brands" "categories" "users")
    
    for table in "${expected_tables[@]}"; do
        if grep -q "COPY public.${table}" "$backup_file"; then
            log_debug "Found table: $table"
        else
            log_warning "Missing table: $table"
        fi
    done
    
    # Check for data in products table
    if grep -q "COPY public.products" "$backup_file"; then
        local product_count=$(grep -A 1 "COPY public.products" "$backup_file" | tail -n +2 | grep -v "^\\." | wc -l)
        log_success "Backup contains $product_count product records"
    else
        log_error "Backup does not contain products data"
        return 1
    fi
    
    log_success "Backup verification passed: $(basename "$backup_file") ($(numfmt --to=iec --suffix=MB $file_size))"
    return 0
}

# ============================================
# Main Script
# ============================================

main() {
    local dry_run=false
    local force=false
    local no_compress=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --force)
                force=true
                shift
                ;;
            --no-compress)
                no_compress=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --force      Force backup even if one was already created today"
                echo "  --no-compress Create backup without compression"
                echo "  --dry-run    Show what would be done without executing"
                exit 1
                ;;
        esac
    done
    
    # Set compression flag based on no_compress option
    if [ "$no_compress" = "true" ]; then
        BACKUP_COMPRESS=false
    fi
    
    # Dry run mode - just show what would be done
    if [ "$dry_run" = "true" ]; then
        log_info "DRY RUN MODE - No changes will be made"
        log_info "Backup file would be: $(get_backup_filename)"
        exit 0
    fi
    
    # Check if backup already exists for today
    local backup_file=$(get_backup_filename)
    if [ -f "$backup_file" ] && [ "$force" != "true" ]; then
        log_warning "Backup already exists for today: $(basename "$backup_file")"
        log_info "Use --force to overwrite"
        exit 0
    fi
    
    # Run pre-backup checks
    check_dependencies
    check_backup_dir
    check_lock_file
    check_disk_space
    
    # Create backup
    log_info "=========================================="
    log_info "Starting backup process..."
    log_info "=========================================="
    
    create_backup "$backup_file"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Cleanup old backups
        cleanup_old_backups
        
        # Verify backup
        verify_backup "$backup_file"
        
        if [ "$ALERT_ENABLED" = "true" ]; then
            log_info "=========================================="
            log_info "Backup process completed successfully!"
            log_info "=========================================="
        else
            log_info "=========================================="
            log_error "Backup process failed!"
            log_info "=========================================="
        fi
    else
        log_info "=========================================="
        log_info "Backup process failed!"
        log_info "=========================================="
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"