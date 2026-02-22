/**
 * Diagnostic script to check COD divisions in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
});

async function diagnoseDivisions() {
  try {
    console.log('=== COD Divisions Diagnostic ===\n');

    // 1. Check COD settings in database
    console.log('1. Checking COD settings in database...');
    const codSettings = await prisma.codSettings.findFirst();
    
    if (!codSettings) {
      console.log('   No COD settings found in database');
    } else {
      console.log('   COD Settings ID:', codSettings.id);
      console.log('   Available Divisions:', JSON.stringify(codSettings.available_divisions));
      console.log('   Available Divisions Count:', codSettings.available_divisions.length);
      console.log('   Unavailable Divisions:', JSON.stringify(codSettings.unavailable_divisions));
      console.log('   Unavailable Divisions Count:', codSettings.unavailable_divisions.length);
      
      // Check for duplicates
      const uniqueDivisions = [...new Set(codSettings.available_divisions)];
      console.log('   Unique Divisions Count:', uniqueDivisions.length);
      
      if (codSettings.available_divisions.length !== uniqueDivisions.length) {
        console.log('   WARNING: Found duplicate divisions!');
        const duplicates = codSettings.available_divisions.filter((item, index) => 
          codSettings.available_divisions.indexOf(item) !== index
        );
        console.log('   Duplicate divisions:', [...new Set(duplicates)]);
      }
    }

    // 2. Check frontend BANGLADESH_DIVISIONS array
    console.log('\n2. Frontend BANGLADESH_DIVISIONS array:');
    const BANGLADESH_DIVISIONS = [
      'dhaka',
      'chittagong',
      'khulna',
      'rajshahi',
      'rangpur',
      'sylhet',
      'barisal',
      'mymensingh'
    ];
    console.log('   Divisions:', BANGLADESH_DIVISIONS);
    console.log('   Count:', BANGLADESH_DIVISIONS.length);

    // 3. Check backend divisions array
    console.log('\n3. Backend divisions array:');
    const backendDivisions = [
      'dhaka',
      'chittagong',
      'khulna',
      'rajshahi',
      'sylhet',
      'barishal',
      'rangpur',
      'mymensingh'
    ];
    console.log('   Divisions:', backendDivisions);
    console.log('   Count:', backendDivisions.length);

    // 4. Compare arrays
    console.log('\n4. Comparison:');
    console.log('   Frontend uses: barisal');
    console.log('   Backend uses: barishal');
    console.log('   This is a SPELLING MISMATCH!');

    // 5. Check if this mismatch causes issues
    if (codSettings) {
      console.log('\n5. Checking for mismatch issues:');
      const hasBarisal = codSettings.available_divisions.includes('barisal');
      const hasBarishal = codSettings.available_divisions.includes('barishal');
      console.log('   Database has "barisal":', hasBarisal);
      console.log('   Database has "barishal":', hasBarishal);
      
      if (hasBarisal && hasBarishal) {
        console.log('   WARNING: Database has BOTH "barisal" and "barishal"!');
        console.log('   This could be causing the count to be incorrect.');
      }
    }

  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDivisions();
