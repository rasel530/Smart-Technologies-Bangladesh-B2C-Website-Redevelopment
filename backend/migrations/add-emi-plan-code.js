const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Step 1: Adding nullable code column to emi_plans table...');
    
    // Add code column as nullable (ignore if already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE emi_plans 
        ADD COLUMN IF NOT EXISTS code VARCHAR(255);
      `);
      console.log('Code column added successfully.');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === '42701') {
        console.log('Code column already exists. Skipping column creation.');
      } else {
        throw error;
      }
    }
    
    console.log('Step 2: Updating existing plans with code values...');
    
    // Check if there are plans without codes
    const plansWithoutCode = await prisma.$queryRaw`
      SELECT ep.id, ep.name, ep.duration, ep.provider_id, ep.code
      FROM emi_plans ep
      WHERE ep.code IS NULL;
    `;
    
    if (plansWithoutCode.length > 0) {
      console.log(`Found ${plansWithoutCode.length} plans without codes. Updating...`);
      
      for (const plan of plansWithoutCode) {
        // Get provider code
        const provider = await prisma.$queryRaw`
          SELECT code FROM emi_providers WHERE id = ${plan.provider_id} LIMIT 1;
        `;
        
        const providerCode = provider[0]?.code || 'unknown';
        
        // Generate code from provider code, plan name, and duration
        // Format: {provider-code}-{duration}m (e.g., dutch-bangla-3m)
        let code = `${providerCode}-${plan.duration}m`
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Handle potential duplicates by checking if code already exists
        let suffix = 1;
        let originalCode = code;
        
        while (true) {
          const existingPlans = await prisma.$queryRaw`
            SELECT id FROM emi_plans WHERE code = ${code} LIMIT 1;
          `;
          
          if (existingPlans.length === 0) {
            break;
          }
          
          code = `${originalCode}-${suffix}`;
          suffix++;
        }
        
        await prisma.$executeRawUnsafe(`
          UPDATE emi_plans
          SET code = '${code}'
          WHERE id = '${plan.id}';
        `);
        
        console.log(`Updated plan "${plan.name}" (${plan.duration} months) with code: ${code}`);
      }
    } else {
      console.log('All plans already have codes. Skipping update.');
    }
    
    console.log('Step 3: Adding unique constraint to code column...');
    
    // Add unique constraint (PostgreSQL doesn't support IF NOT EXISTS for constraints)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE emi_plans 
        ADD CONSTRAINT emi_plans_code_key UNIQUE (code);
      `);
      console.log('Unique constraint added successfully.');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === '42P07') {
        console.log('Unique constraint already exists. Skipping.');
      } else {
        throw error;
      }
    }
    
    // Verify migration
    const plans = await prisma.$queryRaw`
      SELECT ep.id, ep.name, ep.duration, ep.code, ep.provider_id, ep2.code as provider_code
      FROM emi_plans ep
      LEFT JOIN emi_providers ep2 ON ep.provider_id = ep2.id
      LIMIT 5;
    `;
    
    console.log('\nSample plans after migration:');
    plans.forEach(p => {
      console.log(`  - ${p.name} (${p.duration} months): ${p.code} (provider: ${p.provider_code})`);
    });
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
