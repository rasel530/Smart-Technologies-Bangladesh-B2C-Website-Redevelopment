require('dotenv').config();

// Override DATABASE_URL to use localhost instead of postgres container name
// This is needed when running the script outside Docker
process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
  '@postgres:',
  '@localhost:'
);

const { databaseService } = require('./backend/services/database');

async function activateCorporateAccount() {
  const targetEmail = 'john@testcompany.com';
  
  console.log('='.repeat(60));
  console.log('CORPORATE ACCOUNT ACTIVATION SCRIPT');
  console.log('='.repeat(60));
  console.log(`Target Email: ${targetEmail}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    console.log('\n[1] Connecting to database...');
    await databaseService.connect();
    console.log('✅ Database connected successfully');
    
    const prisma = databaseService.getClient();
    
    // Step 1: Find the corporate account by authorized person email
    console.log(`\n[2] Searching for corporate account with authorized person email: ${targetEmail}...`);
    const corporateAccount = await prisma.corporateAccount.findFirst({
      where: { authorizedPersonEmail: targetEmail },
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
    
    if (!corporateAccount) {
      console.log(`❌ Corporate account not found with authorized person email: ${targetEmail}`);
      console.log('Activation failed: Corporate account does not exist');
      return;
    }
    
    console.log('✅ Corporate account found:');
    
    if (!corporateAccount) {
      console.log(`❌ Corporate account not found for user: ${targetEmail}`);
      console.log('Activation failed: No corporate account exists for this user');
      return;
    }
    
    console.log('✅ Corporate account found:');
    console.log(`   - Account ID: ${corporateAccount.id}`);
    console.log(`   - Company Name: ${corporateAccount.companyName}`);
    console.log(`   - Registration Number: ${corporateAccount.companyRegistrationNumber}`);
    console.log(`   - Current Account Status: ${corporateAccount.accountStatus}`);
    console.log(`   - Current Verification Status: ${corporateAccount.verificationStatus}`);
    console.log(`   - Created At: ${corporateAccount.createdAt}`);
    console.log(`   - Company Email: ${corporateAccount.companyEmail}`);
    console.log(`   - Authorized Person: ${corporateAccount.authorizedPersonName}`);
    console.log(`   - Authorized Person Email: ${corporateAccount.authorizedPersonEmail}`);
    
    if (corporateAccount.users_corporate_accounts_user_idTousers) {
      console.log(`   - Linked User ID: ${corporateAccount.users_corporate_accounts_user_idTousers.id}`);
      console.log(`   - Linked User Email: ${corporateAccount.users_corporate_accounts_user_idTousers.email}`);
      console.log(`   - Linked User Name: ${corporateAccount.users_corporate_accounts_user_idTousers.firstName} ${corporateAccount.users_corporate_accounts_user_idTousers.lastName}`);
      console.log(`   - Linked User Role: ${corporateAccount.users_corporate_accounts_user_idTousers.role}`);
      console.log(`   - Linked User Status: ${corporateAccount.users_corporate_accounts_user_idTousers.status}`);
    }
    
    // Step 3: Check if account is already active
    if (corporateAccount.accountStatus === 'active' && corporateAccount.verificationStatus === 'verified') {
      console.log('\n⚠️  Corporate account is already active and verified');
      console.log('No action needed');
      return;
    }
    
    // Step 4: Update the corporate account status
    console.log(`\n[4] Activating corporate account...`);
    const previousStatus = corporateAccount.accountStatus;
    const previousVerificationStatus = corporateAccount.verificationStatus;
    
    const updatedAccount = await prisma.corporateAccount.update({
      where: { id: corporateAccount.id },
      data: {
        accountStatus: 'active',
        verificationStatus: 'verified',
        approvedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Corporate account updated successfully:');
    console.log(`   - Previous Account Status: ${previousStatus}`);
    console.log(`   - New Account Status: ${updatedAccount.accountStatus}`);
    console.log(`   - Previous Verification Status: ${previousVerificationStatus}`);
    console.log(`   - New Verification Status: ${updatedAccount.verificationStatus}`);
    console.log(`   - Approved At: ${updatedAccount.approvedAt}`);
    console.log(`   - Updated At: ${updatedAccount.updatedAt}`);
    
    // Step 5: Verify the activation by querying the database again
    console.log(`\n[5] Verifying activation...`);
    const verifiedAccount = await prisma.corporateAccount.findUnique({
      where: { id: corporateAccount.id },
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
    
    if (verifiedAccount.accountStatus === 'active' && verifiedAccount.verificationStatus === 'verified') {
      console.log('✅ Activation verified successfully!');
      console.log('\n' + '='.repeat(60));
      console.log('ACTIVATION SUMMARY');
      console.log('='.repeat(60));
      console.log('Corporate Account Details:');
      console.log(`  - Account ID: ${verifiedAccount.id}`);
      console.log(`  - Company Name: ${verifiedAccount.companyName}`);
      console.log(`  - Registration Number: ${verifiedAccount.companyRegistrationNumber}`);
      console.log(`  - Business Address: ${verifiedAccount.businessAddress}`);
      console.log(`  - Business Division: ${verifiedAccount.businessDivision}`);
      console.log(`  - Business District: ${verifiedAccount.businessDistrict}`);
      console.log(`  - Company Email: ${verifiedAccount.companyEmail}`);
      console.log(`  - Authorized Person: ${verifiedAccount.authorizedPersonName}`);
      console.log(`  - Authorized Person Email: ${verifiedAccount.authorizedPersonEmail}`);
      console.log(`  - Authorized Person Phone: ${verifiedAccount.authorizedPersonPhone}`);
      console.log(`  - Credit Limit: ${verifiedAccount.creditLimit || 'Not set'}`);
      console.log(`  - Credit Used: ${verifiedAccount.creditUsed}`);
      console.log(`  - Account Status: ${verifiedAccount.accountStatus}`);
      console.log(`  - Verification Status: ${verifiedAccount.verificationStatus}`);
      console.log(`  - Created At: ${verifiedAccount.createdAt}`);
      console.log(`  - Updated At: ${verifiedAccount.updatedAt}`);
      console.log(`  - Approved At: ${verifiedAccount.approvedAt}`);
      console.log('\nLinked User Details:');
      if (verifiedAccount.users_corporate_accounts_user_idTousers) {
        console.log(`  - User ID: ${verifiedAccount.users_corporate_accounts_user_idTousers.id}`);
        console.log(`  - User Email: ${verifiedAccount.users_corporate_accounts_user_idTousers.email}`);
        console.log(`  - User Name: ${verifiedAccount.users_corporate_accounts_user_idTousers.firstName} ${verifiedAccount.users_corporate_accounts_user_idTousers.lastName}`);
        console.log(`  - User Role: ${verifiedAccount.users_corporate_accounts_user_idTousers.role}`);
        console.log(`  - User Status: ${verifiedAccount.users_corporate_accounts_user_idTousers.status}`);
      }
      console.log('='.repeat(60));
      console.log('✅ CORPORATE ACCOUNT ACTIVATION COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
    } else {
      console.log('❌ Activation verification failed!');
      console.log(`Current Account Status: ${verifiedAccount.accountStatus}`);
      console.log(`Current Verification Status: ${verifiedAccount.verificationStatus}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during corporate account activation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    // Disconnect from database
    console.log('\n[6] Disconnecting from database...');
    await databaseService.disconnect();
    console.log('✅ Database disconnected successfully');
  }
}

// Run the activation script
activateCorporateAccount()
  .then(() => {
    console.log('\nScript execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript execution failed:', error);
    process.exit(1);
  });
