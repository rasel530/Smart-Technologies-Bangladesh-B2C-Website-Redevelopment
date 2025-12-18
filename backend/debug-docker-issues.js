// Diagnostic script to identify Docker build issues
console.log('🔍 DOCKER BUILD ISSUES DIAGNOSTIC');
console.log('================================');

console.log('\n📦 FRONTEND PACKAGE ANALYSIS:');
try {
  const fs = require('fs');
  const path = require('path');
  
  const packageJsonPath = path.join(__dirname, '../frontend/package.json');
  const lockfilePath = path.join(__dirname, '../frontend/pnpm-lock.yaml');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('✅ package.json found with', Object.keys(packageJson.dependencies || {}).length, 'dependencies');
    
    const deps = Object.keys(packageJson.dependencies || {});
    console.log('Dependencies:', deps);
  }
  
  if (fs.existsSync(lockfilePath)) {
    const lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
    console.log('✅ pnpm-lock.yaml found');
    
    // Check for missing dependencies
    const missingDeps = [
      '@hookform/resolvers',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label', 
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'date-fns',
      'next-i18next',
      'react-hook-form',
      'react-phone-number-input',
      'tailwind-merge',
      'zod'
    ];
    
    const foundInLockfile = missingDeps.filter(dep => lockfileContent.includes(dep));
    const missingFromLockfile = missingDeps.filter(dep => !lockfileContent.includes(dep));
    
    console.log('✅ Dependencies found in lockfile:', foundInLockfile.length);
    console.log('❌ Missing from lockfile:', missingFromLockfile);
    
    if (missingFromLockfile.length > 0) {
      console.log('🔴 DIAGNOSIS: pnpm lockfile is out of sync with package.json');
      console.log('💡 SOLUTION: Run "pnpm install" in frontend directory to update lockfile');
    }
  }
} catch (error) {
  console.log('❌ Error analyzing frontend packages:', error.message);
}

console.log('\n🗄️ BACKEND PRISMA ANALYSIS:');
try {
  const prismaSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
  
  if (fs.existsSync(prismaSchemaPath)) {
    const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
    
    console.log('✅ Prisma schema found');
    
    if (schemaContent.includes('binaryTargets')) {
      console.log('✅ binaryTargets configuration found');
    } else {
      console.log('❌ binaryTargets configuration missing');
      console.log('🔴 DIAGNOSIS: Prisma schema missing Linux binary targets');
      console.log('💡 SOLUTION: Add binaryTargets section to schema.prisma');
    }
    
    // Check current generator configuration
    const generatorMatch = schemaContent.match(/generator\s+client\s*\{[^}]*\}/);
    if (generatorMatch) {
      console.log('Current generator config:', generatorMatch[0]);
    }
  }
} catch (error) {
  console.log('❌ Error analyzing Prisma schema:', error.message);
}

console.log('\n🐳 DOCKER ENVIRONMENT ANALYSIS:');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

if (process.platform === 'linux') {
  console.log('✅ Running in Linux environment (Docker)');
  console.log('🔍 Prisma needs Linux binary targets for Docker compatibility');
} else {
  console.log('📊 Running in development environment:', process.platform);
}

console.log('\n🎯 RECOMMENDED FIXES:');
console.log('1. Update pnpm lockfile: cd frontend && pnpm install');
console.log('2. Add binaryTargets to Prisma schema');
console.log('3. Regenerate Prisma client: npx prisma generate');
console.log('4. Rebuild Docker containers');