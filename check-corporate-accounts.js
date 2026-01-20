require('dotenv').config();

// Override DATABASE_URL to use localhost instead of postgres container name
process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
  '@postgres:',
  '@localhost:'
);

const { databaseService } = require('./backend/services/database');

async function checkCorporateAccounts() {
  console.log('Checking corporate accounts in database...\n');
  
  try {
    await databaseService.connect();
    const prisma = databaseService.getClient();
    
    // Get all corporate accounts
    const corporateAccounts = await prisma.corporateAccount.findMany({
      include: {
        users_corporate_accounts_user_idTousers: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true
          }
        }
      }
    });
    
    console.log(`Found ${corporateAccounts.length} corporate account(s):\n`);
    
    if (corporateAccounts.length === 0) {
      console.log('No corporate accounts found in the database.');
    } else {
      corporateAccounts.forEach((account, index) => {
        console.log(`[${index + 1}] Corporate Account:`);
        console.log(`    Account ID: ${account.id}`);
        console.log(`    Company Name: ${account.companyName}`);
        console.log(`    Registration Number: ${account.companyRegistrationNumber}`);
        console.log(`    Account Status: ${account.accountStatus}`);
        console.log(`    Verification Status: ${account.verificationStatus}`);
        console.log(`    Company Email: ${account.companyEmail}`);
        console.log(`    Authorized Person: ${account.authorizedPersonName}`);
        console.log(`    Authorized Person Email: ${account.authorizedPersonEmail}`);
        console.log(`    User Email: ${account.users_corporate_accounts_user_idTousers?.email || 'N/A'}`);
        console.log(`    Created At: ${account.createdAt}`);
        console.log(`    Updated At: ${account.updatedAt}`);
        console.log(`    Approved At: ${account.approvedAt || 'Not approved'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await databaseService.disconnect();
  }
}

checkCorporateAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
