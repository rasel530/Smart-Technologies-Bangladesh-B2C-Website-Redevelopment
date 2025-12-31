const { databaseService } = require('./services/database');

async function testDatabaseMethods() {
    console.log('🔍 TESTING DATABASE METHODS AVAILABILITY');
    console.log('==========================================');

    try {
        // Test basic connection
        console.log('\n1. Testing Database Connection...');
        await databaseService.connect();
        console.log('✅ Database connection successful');

        // Get Prisma client
        console.log('\n2. Testing Prisma Client Availability...');
        const prisma = databaseService.getClient();

        if (prisma) {
            console.log('✅ Prisma client available');

            // Test core methods
            console.log('\n3. Testing Core Prisma Methods...');

            const methods = [
                'user',
                'product',
                'category',
                'brand',
                'order',
                'review',
                'coupon',
                'cart',
                'wishlist',
                'address',
                'userSession'
            ];

            methods.forEach(model => {
                if (prisma[model]) {
                    console.log(`✅ prisma.${model} method available`);

                    // Test common operations
                    const operations = ['findMany', 'findUnique', 'findFirst', 'create', 'update', 'delete'];
                    operations.forEach(op => {
                        if (typeof prisma[model][op] === 'function') {
                            console.log(`   ✅ prisma.${model}.${op} method available`);
                        } else {
                            console.log(`   ❌ prisma.${model}.${op} method missing`);
                        }
                    });
                } else {
                    console.log(`❌ prisma.${model} method missing`);
                }
            });

            // Test a simple query
            console.log('\n4. Testing Simple Database Query...');
            try {
                const userCount = await prisma.user.count();
                console.log(`✅ Database query successful - Found ${userCount} users`);
            } catch (error) {
                console.error('❌ Database query failed:', error.message);
            }

        } else {
            console.log('❌ Prisma client not available');
        }

        // Test health check
        console.log('\n5. Testing Health Check...');
        const health = await databaseService.healthCheck();
        console.log('Health check result:', health);

    } catch (error) {
        console.error('❌ Database methods test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testDatabaseMethods().catch(console.error);
}

module.exports = { testDatabaseMethods };