/**
 * Diagnostic script for role-escalation-requests 500 error
 * This script checks:
 * 1. If the role_escalation_requests table exists
 * 2. The actual column names in the users table
 * 3. If the RBAC tables were created
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'info', 'warn']
});

async function diagnose() {
  console.log('=== RBAC Role Escalation Error Diagnosis ===\n');

  try {
    // Test 1: Check if role_escalation_requests table exists
    console.log('Test 1: Checking if role_escalation_requests table exists...');
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'role_escalation_requests'
        ) as exists
      `;
      console.log(`✅ role_escalation_requests table exists: ${tableExists[0].exists}\n`);
    } catch (error) {
      console.log(`❌ Error checking role_escalation_requests table: ${error.message}\n`);
    }

    // Test 2: Check actual column names in users table
    console.log('Test 2: Checking column names in users table...');
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        ORDER BY ordinal_position
      `;
      console.log('Users table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      
      // Check for firstName/lastName vs first_name/last_name
      const hasCamelCase = columns.some(col => col.column_name === 'firstName');
      const hasSnakeCase = columns.some(col => col.column_name === 'first_name');
      console.log(`\n  Has 'firstName' (camelCase): ${hasCamelCase}`);
      console.log(`  Has 'first_name' (snake_case): ${hasSnakeCase}\n`);
    } catch (error) {
      console.log(`❌ Error checking users table columns: ${error.message}\n`);
    }

    // Test 3: Check if roles table exists and has data
    console.log('Test 3: Checking roles table...');
    try {
      const rolesCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM roles
      `;
      console.log(`✅ Roles table has ${rolesCount[0].count} records\n`);
      
      // List roles
      const roles = await prisma.$queryRaw`
        SELECT id, name, hierarchy_level FROM roles ORDER BY hierarchy_level DESC
      `;
      console.log('Available roles:');
      roles.forEach(role => {
        console.log(`  - ${role.name} (Level: ${role.hierarchy_level})`);
      });
      console.log('');
    } catch (error) {
      console.log(`❌ Error checking roles table: ${error.message}\n`);
    }

    // Test 4: Check if user_roles table exists
    console.log('Test 4: Checking user_roles table...');
    try {
      const userRolesCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM user_roles
      `;
      console.log(`✅ user_roles table has ${userRolesCount[0].count} records\n`);
    } catch (error) {
      console.log(`❌ Error checking user_roles table: ${error.message}\n`);
    }

    // Test 5: Try to execute the actual query from RoleEscalationRequest.findAll
    console.log('Test 5: Executing the actual query from RoleEscalationRequest.findAll...');
    try {
      const query = `
        SELECT 
          r.id,
          r.user_id,
          u.email as user_email,
          u."firstName" as user_first_name,
          u."lastName" as user_last_name,
          r.current_role_id,
          cr.name as current_role_name,
          r.requested_role_id,
          rr.name as requested_role_name,
          r.requested_by,
          r.status,
          r.reason,
          r.reviewed_by,
          r.reviewed_at,
          r.review_notes,
          r.created_at
        FROM role_escalation_requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN roles cr ON r.current_role_id = cr.id
        LEFT JOIN roles rr ON r.requested_role_id = rr.id
        WHERE 1=1
        ORDER BY r.created_at DESC
      `;
      
      const requests = await prisma.$queryRawUnsafe(query, []);
      console.log(`✅ Query executed successfully, returned ${requests.length} records\n`);
    } catch (error) {
      console.log(`❌ Query failed with error:`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Meta: ${JSON.stringify(error.meta)}\n`);
      
      // Try alternative with snake_case columns
      console.log('Test 5b: Trying with snake_case column names...');
      try {
        const querySnake = `
          SELECT 
            r.id,
            r.user_id,
            u.email as user_email,
            u.first_name as user_first_name,
            u.last_name as user_last_name,
            r.current_role_id,
            cr.name as current_role_name,
            r.requested_role_id,
            rr.name as requested_role_name,
            r.requested_by,
            r.status,
            r.reason,
            r.reviewed_by,
            r.reviewed_at,
            r.review_notes,
            r.created_at
          FROM role_escalation_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN roles cr ON r.current_role_id = cr.id
          LEFT JOIN roles rr ON r.requested_role_id = rr.id
          WHERE 1=1
          ORDER BY r.created_at DESC
        `;
        
        const requestsSnake = await prisma.$queryRawUnsafe(querySnake, []);
        console.log(`✅ Snake_case query executed successfully, returned ${requestsSnake.length} records\n`);
      } catch (snakeError) {
        console.log(`❌ Snake_case query also failed:`);
        console.log(`   Message: ${snakeError.message}\n`);
      }
    }

    // Test 6: Check if all RBAC tables exist
    console.log('Test 6: Checking all RBAC tables...');
    const rbacTables = ['roles', 'permissions', 'role_permissions', 'user_roles', 'role_escalation_requests'];
    for (const tableName of rbacTables) {
      try {
        const exists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          ) as exists
        `;
        console.log(`  ${tableName}: ${exists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
      } catch (error) {
        console.log(`  ${tableName}: ❌ ERROR - ${error.message}`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('Fatal error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
    console.log('=== Diagnosis Complete ===');
  }
}

diagnose();
