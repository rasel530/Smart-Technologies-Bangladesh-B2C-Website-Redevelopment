const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertPaymentMethods() {
  console.log('========================================');
  console.log('Inserting Local Payment Methods');
  console.log('========================================\n');

  try {
    // Check if payment methods already exist
    const existingMethods = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "local_payment_methods"`;
    console.log(`Existing payment methods: ${existingMethods[0].count}`);

    if (existingMethods[0].count > 0) {
      console.log('Payment methods already exist, skipping insertion.');
      return;
    }

    // Insert bKash
    await prisma.$executeRaw`
      INSERT INTO "local_payment_methods" (
        "id", "name", "code", "displayName", "logoUrl", "isActive", 
        "minAmount", "maxAmount", "processingFee", "processingFeePercent", 
        "requiresPhone", "requiresPin", "description", "instructions", 
        "supportedNetworks", "createdAt", "updatedAt"
      )
      VALUES (
        'bkash-001', 'bKash', 'bkash', 'বিকাশ / bKash', NULL, true,
        10.00, 200000.00, 0.00, 1.50, true, false,
        'Bangladesh''s leading mobile financial service',
        '[{"step":1,"title_en":"Open your bKash app","title_bn":"আপনার বিকাশ অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 017XXXXXXXX","description_bn":"017XXXXXXXX লিখুন"}]',
        ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Inserted bKash');

    // Insert Nagad
    await prisma.$executeRaw`
      INSERT INTO "local_payment_methods" (
        "id", "name", "code", "displayName", "logoUrl", "isActive", 
        "minAmount", "maxAmount", "processingFee", "processingFeePercent", 
        "requiresPhone", "requiresPin", "description", "instructions", 
        "supportedNetworks", "createdAt", "updatedAt"
      )
      VALUES (
        'nagad-001', 'Nagad', 'nagad', 'নগদ / Nagad', NULL, true,
        10.00, 200000.00, 0.00, 1.50, true, false,
        'Digital financial service of Bangladesh Postal Department',
        '[{"step":1,"title_en":"Open your Nagad app","title_bn":"আপনার নগদ অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 018XXXXXXXX","description_bn":"018XXXXXXXX লিখুন"}]',
        ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Inserted Nagad');

    // Insert Rocket
    await prisma.$executeRaw`
      INSERT INTO "local_payment_methods" (
        "id", "name", "code", "displayName", "logoUrl", "isActive", 
        "minAmount", "maxAmount", "processingFee", "processingFeePercent", 
        "requiresPhone", "requiresPin", "description", "instructions", 
        "supportedNetworks", "createdAt", "updatedAt"
      )
      VALUES (
        'rocket-001', 'Rocket', 'rocket', 'রকেট / Rocket', NULL, true,
        10.00, 200000.00, 0.00, 1.50, true, false,
        'Mobile financial service of Dutch-Bangla Bank',
        '[{"step":1,"title_en":"Open your Rocket app","title_bn":"আপনার রকেট অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 016XXXXXXXX","description_bn":"016XXXXXXXX লিখুন"}]',
        ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Inserted Rocket');

    // Insert SureCash
    await prisma.$executeRaw`
      INSERT INTO "local_payment_methods" (
        "id", "name", "code", "displayName", "logoUrl", "isActive", 
        "minAmount", "maxAmount", "processingFee", "processingFeePercent", 
        "requiresPhone", "requiresPin", "description", "instructions", 
        "supportedNetworks", "createdAt", "updatedAt"
      )
      VALUES (
        'surecash-001', 'SureCash', 'surecash', 'সিওরক্যাশ / SureCash', NULL, true,
        10.00, 50000.00, 0.00, 1.50, true, false,
        'Mobile financial service for easy transactions',
        '[{"step":1,"title_en":"Open your SureCash app","title_bn":"আপনার সিওরক্যাশ অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 019XXXXXXXX","description_bn":"019XXXXXXXX লিখুন"}]',
        ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Inserted SureCash');

    console.log('\n========================================');
    console.log('✓ All payment methods inserted successfully!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Insertion failed:');
    console.error('========================================');
    console.error(error.message);
    console.error('\n');
  } finally {
    await prisma.$disconnect();
  }
}

insertPaymentMethods();
