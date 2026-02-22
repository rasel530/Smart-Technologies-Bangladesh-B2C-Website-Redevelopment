const { PrismaClient } = require('@prisma/client');

async function cleanCodDivisions() {
  console.log('[Clean COD Divisions] Starting cleanup...');
  
  const prisma = new PrismaClient();
  
  try {
    // Fetch current settings
    const settings = await prisma.codSettings.findFirst();
    
    if (!settings) {
      console.log('[Clean COD Divisions] No settings found, creating initial settings');
      await prisma.codSettings.create({
        data: {
          is_enabled: true,
          min_amount: 0,
          max_amount: 50000,
          available_divisions: ['dhaka', 'chittagong', 'khulna', 'rajshahi', 'rangpur', 'sylhet', 'barisal', 'mymensingh'],
          unavailable_divisions: [],
          additional_fee: 0,
          free_above_amount: 0,
          require_phone_verification: true,
          require_address_verification: true,
          max_daily_orders: 5,
          max_weekly_orders: 15,
          delivery_days: 3,
          notes: ''
        }
      });
      console.log('[Clean COD Divisions] Initial settings created with 8 divisions');
      return;
    }
    
    console.log('[Clean COD Divisions] Current divisions:', settings.available_divisions);
    console.log('[Clean COD Divisions] Division count:', settings.available_divisions.length);
    
    // Clean up divisions - convert to lowercase and remove duplicates
    const uniqueDivisions = [...new Set(settings.available_divisions.map(d => d.toLowerCase()))];
    const divisionsRemoved = settings.available_divisions.length - uniqueDivisions.length;
    
    console.log('[Clean COD Divisions] Unique divisions (lowercase):', uniqueDivisions);
    console.log('[Clean COD Divisions] Unique count:', uniqueDivisions.length);
    console.log('[Clean COD Divisions] Divisions removed:', divisionsRemoved);
    
    // Update settings
    const updatedSettings = await prisma.codSettings.update({
      where: { id: settings.id },
      data: {
        available_divisions: uniqueDivisions
      }
    });
    
    console.log('[Clean COD Divisions] Settings updated successfully');
    console.log('[Clean COD Divisions] New division count:', updatedSettings.available_divisions.length);
    
  } catch (error) {
    console.error('[Clean COD Divisions] Error occurred during cleanup:', error.message);
    console.error('[Clean COD Divisions] Stack trace:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanCodDivisions()
  .then(() => {
    console.log('[Clean COD Divisions] Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Clean COD Divisions] Cleanup failed:', error);
    process.exit(1);
  });
