"use strict";
/**
 * Security Audit Service
 *
 * This service provides comprehensive security audit logging and management capabilities.
 * It logs security events, provides filtering and search capabilities, and generates
 * security statistics and trends.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityAuditService = exports.SecurityAuditService = void 0;
const database_service_1 = require("../database.service");
const payment_gateway_interface_1 = require("./payment-gateway.interface");
const prisma = database_service_1.databaseService.getClient();
/**
 * Security Audit Service Class
 */
class SecurityAuditService {
    /**
     * Log a security event
     * @param eventType - Type of security event
     * @param severity - Severity level (INFO, WARNING, ERROR, CRITICAL)
     * @param description - Description of the event
     * @param metadata - Additional metadata
     * @returns Created security audit record
     */
    async logSecurityEvent(eventType, severity, description, metadata) {
        try {
            const { v4: uuidv4 } = require('uuid');
            const audit = await prisma.security_audit.create({
                data: {
                    id: uuidv4(),
                    event_type: eventType,
                    severity,
                    description,
                    affected_user_id: metadata.userId,
                    affected_transaction_id: metadata.transactionId,
                    ip_address: metadata.ipAddress,
                    user_agent: metadata.userAgent,
                    event_data: metadata,
                    performed_by: metadata.userId
                }
            });
            // Also log to console for immediate visibility
            console.log(`[SECURITY_AUDIT] ${eventType} [${severity}]`, {
                description,
                userId: metadata.userId,
                transactionId: metadata.transactionId,
                ipAddress: metadata.ipAddress,
                timestamp: new Date().toISOString()
            });
            return {
                id: audit.id,
                eventType: audit.event_type,
                severity: audit.severity,
                description: audit.description,
                affectedUserId: audit.affected_user_id || undefined,
                affectedTransactionId: audit.affected_transaction_id || undefined,
                ipAddress: audit.ip_address || undefined,
                userAgent: audit.user_agent || undefined,
                eventData: audit.event_data,
                performedBy: audit.performed_by || undefined,
                createdAt: audit.created_at,
                resolvedAt: audit.resolved_at || undefined,
                resolvedBy: audit.resolved_by || undefined
            };
        }
        catch (error) {
            console.error('Error logging security event:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to log security event', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Get security audit logs with filters
     * @param filters - Audit filters
     * @returns Array of security audit records
     */
    async getSecurityAuditLogs(filters) {
        try {
            const where = {};
            if (filters.eventType) {
                where.event_type = filters.eventType;
            }
            if (filters.severity) {
                where.severity = filters.severity;
            }
            if (filters.startDate || filters.endDate) {
                where.created_at = {};
                if (filters.startDate) {
                    where.created_at.gte = filters.startDate;
                }
                if (filters.endDate) {
                    where.created_at.lte = filters.endDate;
                }
            }
            if (filters.affectedUserId) {
                where.affected_user_id = filters.affectedUserId;
            }
            if (filters.affectedTransactionId) {
                where.affected_transaction_id = filters.affectedTransactionId;
            }
            if (filters.ipAddress) {
                where.ip_address = filters.ipAddress;
            }
            if (filters.isResolved !== undefined) {
                where.resolved_at = filters.isResolved ? { not: null } : null;
            }
            const limit = filters.limit || 50;
            const offset = filters.offset || 0;
            const audits = await prisma.security_audit.findMany({
                where,
                orderBy: { created_at: 'desc' },
                take: limit,
                skip: offset
            });
            return audits.map(audit => ({
                id: audit.id,
                eventType: audit.event_type,
                severity: audit.severity,
                description: audit.description,
                affectedUserId: audit.affected_user_id || undefined,
                affectedTransactionId: audit.affected_transaction_id || undefined,
                ipAddress: audit.ip_address || undefined,
                userAgent: audit.user_agent || undefined,
                eventData: audit.event_data,
                performedBy: audit.performed_by || undefined,
                createdAt: audit.created_at,
                resolvedAt: audit.resolved_at || undefined,
                resolvedBy: audit.resolved_by || undefined
            }));
        }
        catch (error) {
            console.error('Error fetching security audit logs:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch security audit logs', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Get security audit by ID
     * @param id - Security audit ID
     * @returns Security audit record
     */
    async getSecurityAuditById(id) {
        try {
            const audit = await prisma.security_audit.findUnique({
                where: { id }
            });
            if (!audit) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Security audit not found', 'SECURITY_AUDIT_NOT_FOUND', 404);
            }
            return {
                id: audit.id,
                eventType: audit.event_type,
                severity: audit.severity,
                description: audit.description,
                affectedUserId: audit.affected_user_id || undefined,
                affectedTransactionId: audit.affected_transaction_id || undefined,
                ipAddress: audit.ip_address || undefined,
                userAgent: audit.user_agent || undefined,
                eventData: audit.event_data,
                performedBy: audit.performed_by || undefined,
                createdAt: audit.created_at,
                resolvedAt: audit.resolved_at || undefined,
                resolvedBy: audit.resolved_by || undefined
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            console.error('Error fetching security audit:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch security audit', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Resolve a security event
     * @param id - Security audit ID
     * @param resolutionNotes - Resolution notes
     * @param resolvedBy - User who resolved the event
     * @returns Updated security audit record
     */
    async resolveSecurityEvent(id, resolutionNotes, resolvedBy) {
        try {
            const audit = await prisma.security_audit.update({
                where: { id },
                data: {
                    resolved_at: new Date(),
                    resolved_by: resolvedBy,
                    event_data: {
                        resolutionNotes
                    }
                }
            });
            return {
                id: audit.id,
                eventType: audit.event_type,
                severity: audit.severity,
                description: audit.description,
                affectedUserId: audit.affected_user_id || undefined,
                affectedTransactionId: audit.affected_transaction_id || undefined,
                ipAddress: audit.ip_address || undefined,
                userAgent: audit.user_agent || undefined,
                eventData: audit.event_data,
                performedBy: audit.performed_by || undefined,
                createdAt: audit.created_at,
                resolvedAt: audit.resolved_at || undefined,
                resolvedBy: audit.resolved_by || undefined
            };
        }
        catch (error) {
            console.error('Error resolving security event:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to resolve security event', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Get security statistics
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Security statistics
     */
    async getSecurityStatistics(startDate, endDate) {
        try {
            // Get all security events in the period
            const events = await prisma.security_audit.findMany({
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            // Calculate statistics
            const totalEvents = events.length;
            const resolvedEvents = events.filter(e => e.resolved_at !== null).length;
            const unresolvedEvents = totalEvents - resolvedEvents;
            // Count by severity
            const eventsBySeverity = events.reduce((acc, event) => {
                acc[event.severity] = (acc[event.severity] || 0) + 1;
                return acc;
            }, {});
            // Count by type
            const eventsByType = events.reduce((acc, event) => {
                acc[event.event_type] = (acc[event.event_type] || 0) + 1;
                return acc;
            }, {});
            // Count by risk level
            const criticalEvents = eventsBySeverity['CRITICAL'] || 0;
            const highRiskEvents = eventsBySeverity['ERROR'] || 0;
            const mediumRiskEvents = eventsBySeverity['WARNING'] || 0;
            const lowRiskEvents = eventsBySeverity['INFO'] || 0;
            const statistics = {
                totalEvents,
                eventsBySeverity,
                eventsByType,
                resolvedEvents,
                unresolvedEvents,
                criticalEvents,
                highRiskEvents,
                mediumRiskEvents,
                lowRiskEvents,
                period: { startDate, endDate }
            };
            return statistics;
        }
        catch (error) {
            console.error('Error fetching security statistics:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch security statistics', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Get critical security events
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Array of critical security events
     */
    async getCriticalSecurityEvents(startDate, endDate) {
        try {
            const events = await prisma.security_audit.findMany({
                where: {
                    severity: 'CRITICAL',
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    },
                    resolved_at: null
                },
                orderBy: { created_at: 'desc' }
            });
            return events.map(event => ({
                id: event.id,
                eventType: event.event_type,
                severity: event.severity,
                description: event.description,
                affectedUserId: event.affected_user_id || undefined,
                affectedTransactionId: event.affected_transaction_id || undefined,
                ipAddress: event.ip_address || undefined,
                userAgent: event.user_agent || undefined,
                eventData: event.event_data,
                performedBy: event.performed_by || undefined,
                createdAt: event.created_at,
                resolvedAt: event.resolved_at || undefined,
                resolvedBy: event.resolved_by || undefined
            }));
        }
        catch (error) {
            console.error('Error fetching critical security events:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch critical security events', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Get security trends
     * @param period - Period ('daily', 'weekly', 'monthly')
     * @returns Security trends
     */
    async getSecurityTrends(period) {
        try {
            let startDate;
            let groupBy;
            let dataPoints;
            switch (period) {
                case 'daily':
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
                    groupBy = 'day';
                    dataPoints = 30;
                    break;
                case 'weekly':
                    startDate = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
                    groupBy = 'week';
                    dataPoints = 12;
                    break;
                case 'monthly':
                    startDate = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
                    groupBy = 'month';
                    dataPoints = 12;
                    break;
                default:
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    groupBy = 'day';
                    dataPoints = 30;
            }
            // Get all events in the period
            const events = await prisma.security_audit.findMany({
                where: {
                    created_at: {
                        gte: startDate
                    }
                },
                orderBy: { created_at: 'asc' }
            });
            // Group events by date
            const data = [];
            const now = new Date();
            for (let i = dataPoints - 1; i >= 0; i--) {
                let date;
                switch (period) {
                    case 'daily':
                        date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                        break;
                    case 'weekly':
                        date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'monthly':
                        date = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                }
                const dateStr = date.toISOString().split('T')[0];
                const dayEvents = events.filter(e => {
                    const eventDate = e.created_at.toISOString().split('T')[0];
                    return eventDate === dateStr;
                });
                data.push({
                    date: dateStr,
                    totalEvents: dayEvents.length,
                    criticalEvents: dayEvents.filter(e => e.severity === 'CRITICAL').length,
                    highRiskEvents: dayEvents.filter(e => e.severity === 'ERROR').length,
                    mediumRiskEvents: dayEvents.filter(e => e.severity === 'WARNING').length,
                    lowRiskEvents: dayEvents.filter(e => e.severity === 'INFO').length
                });
            }
            // Calculate summary
            const totalEvents = data.reduce((sum, d) => sum + d.totalEvents, 0);
            const averageEventsPerDay = totalEvents / dataPoints;
            // Calculate trend
            const firstHalf = data.slice(0, Math.floor(dataPoints / 2));
            const secondHalf = data.slice(Math.floor(dataPoints / 2));
            const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.totalEvents, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.totalEvents, 0) / secondHalf.length;
            const trendPercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
            let trendDirection;
            if (trendPercent > 5) {
                trendDirection = 'increasing';
            }
            else if (trendPercent < -5) {
                trendDirection = 'decreasing';
            }
            else {
                trendDirection = 'stable';
            }
            const trends = {
                period,
                data,
                summary: {
                    totalEvents,
                    averageEventsPerDay,
                    trendDirection,
                    trendPercent
                }
            };
            return trends;
        }
        catch (error) {
            console.error('Error fetching security trends:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch security trends', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
    /**
     * Export security audit logs
     * @param filters - Audit filters
     * @returns Buffer containing exported data
     */
    async exportSecurityAuditLogs(filters) {
        try {
            const audits = await this.getSecurityAuditLogs({
                ...filters,
                limit: 10000 // Limit export to 10,000 records
            });
            // Convert to CSV format
            const headers = [
                'ID',
                'Event Type',
                'Severity',
                'Description',
                'Affected User ID',
                'Affected Transaction ID',
                'IP Address',
                'User Agent',
                'Performed By',
                'Created At',
                'Resolved At',
                'Resolved By'
            ];
            const rows = audits.map(audit => [
                audit.id,
                audit.eventType,
                audit.severity,
                audit.description,
                audit.affectedUserId || '',
                audit.affectedTransactionId || '',
                audit.ipAddress || '',
                audit.userAgent || '',
                audit.performedBy || '',
                audit.createdAt.toISOString(),
                audit.resolvedAt?.toISOString() || '',
                audit.resolvedBy || ''
            ]);
            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            return Buffer.from(csvContent);
        }
        catch (error) {
            console.error('Error exporting security audit logs:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to export security audit logs', 'SECURITY_AUDIT_FAILED', 500);
        }
    }
}
exports.SecurityAuditService = SecurityAuditService;
// Export singleton instance
exports.securityAuditService = new SecurityAuditService();
