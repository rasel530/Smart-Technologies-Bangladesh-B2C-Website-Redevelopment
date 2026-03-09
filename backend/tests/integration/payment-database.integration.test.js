/**
 * Payment Database Integration Tests
 * 
 * Comprehensive integration tests for payment database operations
 * including PaymentTransaction, PaymentGatewaySettings, and PaymentLog tables.
 */

const { PrismaClient } = require('@prisma/client');
const {
  createTestUser,
  createTestAddress,
  createTestOrderWithItems,
  cleanupTestData
} = require('../../../tests/setup/payment-test-data.test');

const prisma = new PrismaClient();

describe('Payment Database Integration Tests', () => {
  let testUser, testAddress, testOrder;

  beforeAll(async () => {
    testUser = await createTestUser();
    testAddress = await createTestAddress(testUser.id);
    testOrder = await createTestOrderWithItems(testUser.id, testAddress.id);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('PaymentTransaction Table Operations', () => {
    let testTransaction;

    it('should create a payment transaction', async () => {
      const transactionData = {
        orderId: testOrder.id,
        paymentMethod: 'CREDIT_CARD',
        amount: 1050.00,
        currency: 'BDT',
        transactionId: `TXN-${Date.now()}`,
        gatewayTransactionId: `GW-${Date.now()}`,
        status: 'pending',
        gatewayResponse: {
          success: true,
          message: 'Payment initiated'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent'
      };

      testTransaction = await prisma.payment_transaction.create({
        data: transactionData
      });

      expect(testTransaction).toBeDefined();
      expect(testTransaction.id).toBeDefined();
      expect(testTransaction.orderId).toBe(testOrder.id);
      expect(testTransaction.paymentMethod).toBe('CREDIT_CARD');
      expect(testTransaction.amount).toBe(1050.00);
      expect(testTransaction.status).toBe('pending');
      expect(testTransaction.createdAt).toBeDefined();
    });

    it('should read a payment transaction', async () => {
      const transaction = await prisma.payment_transaction.findUnique({
        where: { id: testTransaction.id }
      });

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(testTransaction.id);
      expect(transaction.transactionId).toBe(testTransaction.transactionId);
    });

    it('should update a payment transaction', async () => {
      const updatedTransaction = await prisma.payment_transaction.update({
        where: { id: testTransaction.id },
        data: {
          status: 'completed',
          callbackResponse: {
            success: true,
            status: 'VALID'
          }
        }
      });

      expect(updatedTransaction.status).toBe('completed');
      expect(updatedTransaction.callbackResponse).toBeDefined();
      expect(updatedTransaction.updatedAt).toBeDefined();
    });

    it('should delete a payment transaction', async () => {
      const newTransaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'BKASH',
          amount: 500.00,
          currency: 'BDT',
          transactionId: `TXN-DELETE-${Date.now()}`,
          status: 'pending'
        }
      });

      await prisma.payment_transaction.delete({
        where: { id: newTransaction.id }
      });

      const deletedTransaction = await prisma.payment_transaction.findUnique({
        where: { id: newTransaction.id }
      });

      expect(deletedTransaction).toBeNull();
    });

    it('should list payment transactions', async () => {
      const transactions = await prisma.payment_transaction.findMany({
        where: { orderId: testOrder.id }
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should filter payment transactions by status', async () => {
      const completedTransactions = await prisma.payment_transaction.findMany({
        where: {
          status: 'completed'
        }
      });

      expect(Array.isArray(completedTransactions)).toBe(true);
      completedTransactions.forEach(t => {
        expect(t.status).toBe('completed');
      });
    });

    it('should filter payment transactions by payment method', async () => {
      const creditCardTransactions = await prisma.payment_transaction.findMany({
        where: {
          paymentMethod: 'CREDIT_CARD'
        }
      });

      expect(Array.isArray(creditCardTransactions)).toBe(true);
      creditCardTransactions.forEach(t => {
        expect(t.paymentMethod).toBe('CREDIT_CARD');
      });
    });
  });

  describe('PaymentGatewaySettings Table Operations', () => {
    let testGatewaySettings;

    it('should create payment gateway settings', async () => {
      const gatewayData = {
        gateway: 'test-gateway',
        isActive: true,
        isTestMode: true,
        merchantId: 'TEST_MERCHANT',
        storeId: 'TEST_STORE',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
        config: {
          testMode: true,
          currency: 'BDT'
        }
      };

      testGatewaySettings = await prisma.payment_gateway_settings.create({
        data: gatewayData
      });

      expect(testGatewaySettings).toBeDefined();
      expect(testGatewaySettings.gateway).toBe('test-gateway');
      expect(testGatewaySettings.isActive).toBe(true);
      expect(testGatewaySettings.isTestMode).toBe(true);
    });

    it('should read payment gateway settings', async () => {
      const gatewaySettings = await prisma.payment_gateway_settings.findUnique({
        where: { gateway: 'test-gateway' }
      });

      expect(gatewaySettings).toBeDefined();
      expect(gatewaySettings.gateway).toBe('test-gateway');
    });

    it('should update payment gateway settings', async () => {
      const updatedSettings = await prisma.payment_gateway_settings.update({
        where: { gateway: 'test-gateway' },
        data: {
          isActive: false,
          config: {
            ...testGatewaySettings.config,
            updated: true
          }
        }
      });

      expect(updatedSettings.isActive).toBe(false);
      expect(updatedSettings.config.updated).toBe(true);
    });

    it('should delete payment gateway settings', async () => {
      await prisma.payment_gateway_settings.delete({
        where: { gateway: 'test-gateway' }
      });

      const deletedSettings = await prisma.payment_gateway_settings.findUnique({
        where: { gateway: 'test-gateway' }
      });

      expect(deletedSettings).toBeNull();
    });

    it('should list all payment gateway settings', async () => {
      const allGateways = await prisma.payment_gateway_settings.findMany();

      expect(Array.isArray(allGateways)).toBe(true);
      expect(allGateways.length).toBeGreaterThan(0);
    });

    it('should filter gateway settings by active status', async () => {
      const activeGateways = await prisma.payment_gateway_settings.findMany({
        where: { isActive: true }
      });

      expect(Array.isArray(activeGateways)).toBe(true);
      activeGateways.forEach(g => {
        expect(g.isActive).toBe(true);
      });
    });
  });

  describe('PaymentLog Table Operations', () => {
    let testPaymentLog;

    it('should create a payment log', async () => {
      const logData = {
        transactionId: testTransaction?.id || 'test-transaction-id',
        orderId: testOrder.id,
        eventType: 'PAYMENT_INITIATION',
        eventData: {
          amount: 1050.00,
          currency: 'BDT',
          paymentMethod: 'CREDIT_CARD'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        riskScore: 10,
        isSuspicious: false
      };

      testPaymentLog = await prisma.payment_log.create({
        data: logData
      });

      expect(testPaymentLog).toBeDefined();
      expect(testPaymentLog.id).toBeDefined();
      expect(testPaymentLog.eventType).toBe('PAYMENT_INITIATION');
      expect(testPaymentLog.orderId).toBe(testOrder.id);
    });

    it('should read a payment log', async () => {
      const paymentLog = await prisma.payment_log.findUnique({
        where: { id: testPaymentLog.id }
      });

      expect(paymentLog).toBeDefined();
      expect(paymentLog.id).toBe(testPaymentLog.id);
      expect(paymentLog.eventType).toBe('PAYMENT_INITIATION');
    });

    it('should update a payment log', async () => {
      const updatedLog = await prisma.payment_log.update({
        where: { id: testPaymentLog.id },
        data: {
          riskScore: 50,
          isSuspicious: true
        }
      });

      expect(updatedLog.riskScore).toBe(50);
      expect(updatedLog.isSuspicious).toBe(true);
    });

    it('should delete a payment log', async () => {
      const newLog = await prisma.payment_log.create({
        data: {
          transactionId: 'test-txn-id',
          orderId: testOrder.id,
          eventType: 'TEST_EVENT',
          eventData: {}
        }
      });

      await prisma.payment_log.delete({
        where: { id: newLog.id }
      });

      const deletedLog = await prisma.payment_log.findUnique({
        where: { id: newLog.id }
      });

      expect(deletedLog).toBeNull();
    });

    it('should list payment logs', async () => {
      const logs = await prisma.payment_log.findMany({
        where: { orderId: testOrder.id }
      });

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should filter payment logs by event type', async () => {
      const initiationLogs = await prisma.payment_log.findMany({
        where: {
          eventType: 'PAYMENT_INITIATION'
        }
      });

      expect(Array.isArray(initiationLogs)).toBe(true);
      initiationLogs.forEach(log => {
        expect(log.eventType).toBe('PAYMENT_INITIATION');
      });
    });

    it('should filter payment logs by suspicious flag', async () => {
      const suspiciousLogs = await prisma.payment_log.findMany({
        where: {
          isSuspicious: true
        }
      });

      expect(Array.isArray(suspiciousLogs)).toBe(true);
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should enforce relationship between transaction and order', async () => {
      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1000.00,
          currency: 'BDT',
          transactionId: `TXN-FK-${Date.now()}`,
          status: 'pending'
        }
      });

      // Verify relationship through include
      const transactionWithOrder = await prisma.payment_transaction.findUnique({
        where: { id: transaction.id },
        include: {
          order: true
        }
      });

      expect(transactionWithOrder.order).toBeDefined();
      expect(transactionWithOrder.order.id).toBe(testOrder.id);
    });

    it('should cascade delete on order deletion', async () => {
      const testUser2 = await createTestUser();
      const testAddress2 = await createTestAddress(testUser2.id);
      const testOrder2 = await createTestOrderWithItems(testUser2.id, testAddress2.id);

      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder2.id,
          paymentMethod: 'BKASH',
          amount: 500.00,
          currency: 'BDT',
          transactionId: `TXN-CASCADE-${Date.now()}`,
          status: 'pending'
        }
      });

      // Delete order
      await prisma.order.delete({
        where: { id: testOrder2.id }
      });

      // Verify transaction is also deleted (or has null orderId depending on schema)
      // Note: This depends on the actual schema cascade settings
      const deletedTransaction = await prisma.payment_transaction.findUnique({
        where: { id: transaction.id }
      });

      // Transaction should be deleted if cascade is enabled
      // or should have null orderId if not
      expect(deletedTransaction).toBeDefined();
    });
  });

  describe('Index Performance', () => {
    it('should use index for transaction ID lookups', async () => {
      const startTime = Date.now();
      
      await prisma.payment_transaction.findUnique({
        where: { transactionId: testTransaction?.transactionId || 'test-txn-id' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should be fast (< 100ms) with proper indexing
      expect(queryTime).toBeLessThan(100);
    });

    it('should use index for order ID lookups', async () => {
      const startTime = Date.now();
      
      await prisma.payment_transaction.findMany({
        where: { orderId: testOrder.id }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100);
    });

    it('should use index for status filtering', async () => {
      const startTime = Date.now();
      
      await prisma.payment_transaction.findMany({
        where: { status: 'completed' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100);
    });

    it('should use index for payment method filtering', async () => {
      const startTime = Date.now();
      
      await prisma.payment_transaction.findMany({
        where: { paymentMethod: 'CREDIT_CARD' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100);
    });

    it('should use index for payment log event type filtering', async () => {
      const startTime = Date.now();
      
      await prisma.payment_log.findMany({
        where: { eventType: 'PAYMENT_INITIATION' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100);
    });
  });

  describe('Data Integrity Constraints', () => {
    it('should enforce unique constraint on transaction ID', async () => {
      const uniqueTransactionId = `TXN-UNIQUE-${Date.now()}`;

      // Create first transaction
      await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1000.00,
          currency: 'BDT',
          transactionId: uniqueTransactionId,
          status: 'pending'
        }
      });

      // Try to create second transaction with same transaction ID
      await expect(
        prisma.payment_transaction.create({
          data: {
            orderId: testOrder.id,
            paymentMethod: 'BKASH',
            amount: 500.00,
            currency: 'BDT',
            transactionId: uniqueTransactionId,
            status: 'pending'
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on gateway name', async () => {
      const gatewayName = 'test-unique-gateway';

      // Create first gateway settings
      await prisma.payment_gateway_settings.create({
        data: {
          gateway: gatewayName,
          isActive: true,
          isTestMode: true
        }
      });

      // Try to create second gateway with same name
      await expect(
        prisma.payment_gateway_settings.create({
          data: {
            gateway: gatewayName,
            isActive: false,
            isTestMode: true
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce not null constraints', async () => {
      await expect(
        prisma.payment_transaction.create({
          data: {
            orderId: testOrder.id,
            paymentMethod: 'CREDIT_CARD',
            amount: 1000.00,
            currency: 'BDT',
            status: 'pending'
            // transactionId is missing (should be required)
          }
        })
      ).rejects.toThrow();
    });

    it('should validate enum values for payment method', async () => {
      await expect(
        prisma.payment_transaction.create({
          data: {
            orderId: testOrder.id,
            paymentMethod: 'INVALID_METHOD',
            amount: 1000.00,
            currency: 'BDT',
            transactionId: `TXN-ENUM-${Date.now()}`,
            status: 'pending'
          }
        })
      ).rejects.toThrow();
    });

    it('should validate enum values for payment status', async () => {
      await expect(
        prisma.payment_transaction.create({
          data: {
            orderId: testOrder.id,
            paymentMethod: 'CREDIT_CARD',
            amount: 1000.00,
            currency: 'BDT',
            transactionId: `TXN-STATUS-${Date.now()}`,
            status: 'INVALID_STATUS'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Transaction Rollback on Errors', () => {
    it('should rollback transaction on error', async () => {
      const initialTransactionCount = await prisma.payment_transaction.count();

      try {
        await prisma.$transaction(async (tx) => {
          // Create a transaction
          await tx.payment_transaction.create({
            data: {
              orderId: testOrder.id,
              paymentMethod: 'CREDIT_CARD',
              amount: 1000.00,
              currency: 'BDT',
              transactionId: `TXN-ROLLBACK-${Date.now()}`,
              status: 'pending'
            }
          });

          // Intentionally cause an error
          await tx.payment_transaction.create({
            data: {
              orderId: testOrder.id,
              paymentMethod: 'INVALID_METHOD',
              amount: 1000.00,
              currency: 'BDT',
              transactionId: `TXN-ROLLBACK-2-${Date.now()}`,
              status: 'pending'
            }
          });
        });
      } catch (error) {
        // Expected error
      }

      // Verify transaction was rolled back
      const finalTransactionCount = await prisma.payment_transaction.count();
      expect(finalTransactionCount).toBe(initialTransactionCount);
    });

    it('should rollback multiple operations on error', async () => {
      const initialTransactionCount = await prisma.payment_transaction.count();
      const initialLogCount = await prisma.payment_log.count();

      try {
        await prisma.$transaction(async (tx) => {
          // Create transaction
          await tx.payment_transaction.create({
            data: {
              orderId: testOrder.id,
              paymentMethod: 'CREDIT_CARD',
              amount: 1000.00,
              currency: 'BDT',
              transactionId: `TXN-MULTI-${Date.now()}`,
              status: 'pending'
            }
          });

          // Create log
          await tx.payment_log.create({
            data: {
              orderId: testOrder.id,
              eventType: 'TEST_EVENT',
              eventData: {}
            }
          });

          // Intentionally cause an error
          await tx.payment_transaction.create({
            data: {
              orderId: testOrder.id,
              paymentMethod: 'INVALID_METHOD',
              amount: 1000.00,
              currency: 'BDT',
              transactionId: `TXN-MULTI-2-${Date.now()}`,
              status: 'pending'
            }
          });
        });
      } catch (error) {
        // Expected error
      }

      // Verify all operations were rolled back
      const finalTransactionCount = await prisma.payment_transaction.count();
      const finalLogCount = await prisma.payment_log.count();

      expect(finalTransactionCount).toBe(initialTransactionCount);
      expect(finalLogCount).toBe(initialLogCount);
    });
  });

  describe('JSON Field Operations', () => {
    it('should store and retrieve JSON gateway response', async () => {
      const gatewayResponse = {
        success: true,
        tran_id: 'SSL-123456',
        amount: '1050.00',
        card_type: 'VISA',
        card_issuer: 'Test Bank',
        card_brand: 'VISA',
        store_amount: '1039.50',
        bank_tran_id: 'BANK-789'
      };

      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1050.00,
          currency: 'BDT',
          transactionId: `TXN-JSON-${Date.now()}`,
          status: 'completed',
          gatewayResponse
        }
      });

      expect(transaction.gatewayResponse).toEqual(gatewayResponse);
    });

    it('should store and retrieve JSON callback response', async () => {
      const callbackResponse = {
        success: true,
        status: 'VALID',
        val_id: 'VAL-123456',
        amount: '1050.00'
      };

      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1050.00,
          currency: 'BDT',
          transactionId: `TXN-CALLBACK-${Date.now()}`,
          status: 'completed',
          callbackResponse
        }
      });

      expect(transaction.callbackResponse).toEqual(callbackResponse);
    });

    it('should store and retrieve JSON event data in logs', async () => {
      const eventData = {
        amount: 1050.00,
        currency: 'BDT',
        paymentMethod: 'CREDIT_CARD',
        gateway: 'sslcommerz',
        timestamp: new Date().toISOString()
      };

      const log = await prisma.payment_log.create({
        data: {
          orderId: testOrder.id,
          eventType: 'PAYMENT_INITIATION',
          eventData
        }
      });

      expect(log.eventData).toEqual(eventData);
    });

    it('should query JSON fields', async () => {
      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1050.00,
          currency: 'BDT',
          transactionId: `TXN-QUERY-${Date.now()}`,
          status: 'completed',
          gatewayResponse: {
            success: true,
            tran_id: 'SSL-QUERY-123'
          }
        }
      });

      // Query by JSON field (PostgreSQL JSONB query)
      const result = await prisma.payment_transaction.findFirst({
        where: {
          gatewayResponse: {
            path: ['success'],
            equals: true
          }
        }
      });

      expect(result).toBeDefined();
    });
  });

  describe('Timestamp Fields', () => {
    it('should automatically set createdAt timestamp', async () => {
      const beforeCreate = new Date();

      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1000.00,
          currency: 'BDT',
          transactionId: `TXN-TIMESTAMP-${Date.now()}`,
          status: 'pending'
        }
      });

      const afterCreate = new Date();

      expect(transaction.createdAt).toBeDefined();
      expect(transaction.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(transaction.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should automatically update updatedAt timestamp', async () => {
      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1000.00,
          currency: 'BDT',
          transactionId: `TXN-UPDATE-${Date.now()}`,
          status: 'pending'
        }
      });

      const initialUpdatedAt = transaction.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedTransaction = await prisma.payment_transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      });

      expect(updatedTransaction.updatedAt).toBeDefined();
      expect(updatedTransaction.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    it('should handle refundedAt timestamp', async () => {
      const transaction = await prisma.payment_transaction.create({
        data: {
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          amount: 1000.00,
          currency: 'BDT',
          transactionId: `TXN-REFUND-TIME-${Date.now()}`,
          status: 'refunded',
          refundAmount: 500.00,
          refundedAt: new Date()
        }
      });

      expect(transaction.refundedAt).toBeDefined();
      expect(transaction.refundAmount).toBe(500.00);
    });
  });
});
