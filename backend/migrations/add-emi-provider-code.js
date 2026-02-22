const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Step 1: Adding nullable code column to emi_providers table...');
    
    // Add code column as nullable (ignore if already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE emi_providers 
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
    
    console.log('Step 2: Updating existing providers with code values...');
    
    // Check if there are providers without codes
    const providersWithoutCode = await prisma.$queryRaw`
      SELECT id, name FROM emi_providers WHERE code IS NULL;
    `;
    
    if (providersWithoutCode.length > 0) {
      console.log(`Found ${providersWithoutCode.length} providers without codes. Updating...`);
      
      for (const provider of providersWithoutCode) {
        // Generate code from name (lowercase, replace spaces with hyphens)
        let code = provider.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Handle potential duplicates by checking if code already exists
        let suffix = 1;
        let originalCode = code;
        
        while (true) {
          const existingProviders = await prisma.$queryRaw`
            SELECT id FROM emi_providers WHERE code = ${code} LIMIT 1;
          `;
          
          if (existingProviders.length === 0) {
            break;
          }
          
          code = `${originalCode}-${suffix}`;
          suffix++;
        }
        
        await prisma.$executeRawUnsafe(`
          UPDATE emi_providers
          SET code = '${code}'
          WHERE id = '${provider.id}';
        `);
        
        console.log(`Updated provider "${provider.name}" with code: ${code}`);
      }
    } else {
      console.log('All providers already have codes. Skipping update.');
    }
    
    console.log('Step 3: Adding unique constraint to code column...');
    
    // Add unique constraint (PostgreSQL doesn't support IF NOT EXISTS for constraints)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE emi_providers 
        ADD CONSTRAINT emi_providers_code_key UNIQUE (code);
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
    const providers = await prisma.$queryRaw`
      SELECT id, name, code FROM emi_providers LIMIT 5;
    `;
    
    console.log('\nSample providers after migration:');
    providers.forEach(p => {
      console.log(`  - ${p.name}: ${p.code}`);
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
