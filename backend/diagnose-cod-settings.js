const { PrismaClient } = require('@prisma/client');
const { codService } = require('./services/codService');

const prisma = new PrismaClient();

async function diagnoseCodSettings() {
  console.log('=== COD SETTINGS DIAGNOSTIC REPORT ===\n');

  try {
    // 1. Check database directly
    console.log('1. Checking database for COD settings...');
    const dbSettings = await prisma.codSettings.findFirst();
    if (dbSettings) {
      console.log('✓ Found COD settings in database:');
      console.log(JSON.stringify(dbSettings, null, 2));
    } else {
      console.log('✗ NO COD settings found in database!');
    }

    // 2. Check what codService.getCodSettings() returns
    console.log('\n2. Checking what codService.getCodSettings() returns...');
    const serviceSettings = await codService.getCodSettings();
    console.log('Service returned:');
    console.log(JSON.stringify(serviceSettings, null, 2));

    // 3. Check what getDefaultSettings() returns
    console.log('\n3. Checking what getDefaultSettings() returns...');
    const defaultSettings = codService.getDefaultSettings();
    console.log('Default settings:');
    console.log(JSON.stringify(defaultSettings, null, 2));

    // 4. Compare
    console.log('\n4. COMPARISON:');
    console.log('Database has settings:', !!dbSettings);
    console.log('Service returned defaults:', !dbSettings);
    console.log('Service returned:', JSON.stringify(serviceSettings, null, 2));

  } catch (error) {
    console.error('\n✗ Error during diagnosis:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=== END DIAGNOSTIC REPORT ===');
}

diagnoseCodSettings();
