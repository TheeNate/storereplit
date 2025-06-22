
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up your BTC Glass Store...\n');

// Check if we're in a Replit environment
const isReplit = process.env.REPL_ID !== undefined;

if (isReplit) {
  console.log('✅ Detected Replit environment');
} else {
  console.log('⚠️  Not in Replit - some features may not work as expected');
}

// Check for required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY', 
  'STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY'
];

const optionalEnvVars = [
  'ZAPRITE_API_KEY'
];

console.log('\n📋 Checking environment variables...');

let missingRequired = [];
let missingOptional = [];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingRequired.push(envVar);
  } else {
    console.log(`✅ ${envVar} is set`);
  }
});

optionalEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingOptional.push(envVar);
  } else {
    console.log(`✅ ${envVar} is set`);
  }
});

if (missingRequired.length > 0) {
  console.log('\n❌ Missing required environment variables:');
  missingRequired.forEach(envVar => {
    console.log(`   - ${envVar}`);
  });
  console.log('\nPlease add these to your Replit Secrets tab before continuing.');
}

if (missingOptional.length > 0) {
  console.log('\n⚠️  Missing optional environment variables:');
  missingOptional.forEach(envVar => {
    console.log(`   - ${envVar} (Bitcoin payments will be disabled)`);
  });
}

if (missingRequired.length === 0) {
  console.log('\n🎉 All required environment variables are set!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run db:migrate');
  console.log('2. Click the Run button to start your store');
  console.log('3. Visit /admin to add your first products');
  console.log('\n🛠️  Customize your store by:');
  console.log('- Updating colors in tailwind.config.ts');
  console.log('- Modifying site name in components');
  console.log('- Adding your products in the admin panel');
}

console.log('\n📚 For detailed setup instructions, see README.md');
