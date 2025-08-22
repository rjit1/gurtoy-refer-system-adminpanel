#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  production: {
    branch: 'main',
    supabaseProject: 'production',
    vercelProject: 'gurtoy-production'
  },
  staging: {
    branch: 'staging',
    supabaseProject: 'staging',
    vercelProject: 'gurtoy-staging'
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to execute commands
function runCommand(command, options = {}) {
  console.log(`\n> ${command}`);
  try {
    return execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      console.log(`Command failed, but continuing: ${error.message}`);
      return '';
    }
    console.error(`\n❌ Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Check for uncommitted changes
function checkGitStatus() {
  const status = runCommand('git status --porcelain', { silent: true });
  if (status.trim() !== '') {
    console.log('\n⚠️ You have uncommitted changes:');
    console.log(status);
    return false;
  }
  return true;
}

// Run database migrations
async function runMigrations(environment) {
  console.log('\n🔄 Running database migrations...');
  
  try {
    // First run the view dependency fix
    console.log('\n> Running view dependency fix...');
    runCommand(`npx supabase db push --db-url postgresql://postgres:postgres@db.${config[environment].supabaseProject}.supabase.co:5432/postgres ./supabase/fix-view-dependencies.sql`);
    
    // Then run performance indexes
    console.log('\n> Adding performance indexes...');
    runCommand(`npx supabase db push --db-url postgresql://postgres:postgres@db.${config[environment].supabaseProject}.supabase.co:5432/postgres ./supabase/add-performance-indexes.sql`);
    
    console.log('\n✅ Database migrations completed successfully');
  } catch (error) {
    console.error('\n❌ Error running migrations:', error.message);
    throw error;
  }
}

// Build and deploy to Vercel
async function deployToVercel(environment) {
  console.log(`\n🚀 Deploying to Vercel (${environment})...`);
  
  // Build the project
  console.log('\n> Building project...');
  runCommand('npm run build');
  
  // Deploy to Vercel
  console.log(`\n> Deploying to Vercel ${config[environment].vercelProject}...`);
  runCommand(`npx vercel --prod --name ${config[environment].vercelProject}`);
  
  console.log('\n✅ Vercel deployment completed');
}

// Fix KYC documents
async function fixKycDocuments(environment) {
  console.log('\n🔧 Fixing KYC document URLs...');
  runCommand('node fix-kyc-documents.js');
}

// Main deployment function
async function deploy() {
  console.log('🚀 Gurtoy Deployment Script');
  console.log('==========================');
  
  // Ask for environment
  rl.question('\nSelect environment to deploy:\n1. Production\n2. Staging\n> ', async (answer) => {
    const environment = answer === '1' ? 'production' : 'staging';
    console.log(`\nDeploying to ${environment} environment`);
    
    // Check git status
    if (!checkGitStatus()) {
      rl.question('\n⚠️ You have uncommitted changes. Continue anyway? (y/n) ', async (answer) => {
        if (answer.toLowerCase() !== 'y') {
          console.log('\n🛑 Deployment cancelled');
          rl.close();
          return;
        }
        await continueDeployment(environment);
      });
    } else {
      await continueDeployment(environment);
    }
  });
}

async function continueDeployment(environment) {
  try {
    // Switch to the correct branch
    console.log(`\n> Switching to ${config[environment].branch} branch...`);
    runCommand(`git checkout ${config[environment].branch}`);
    
    // Pull latest changes
    console.log('\n> Pulling latest changes...');
    runCommand('git pull');
    
    // Install dependencies
    console.log('\n> Installing dependencies...');
    runCommand('npm ci');
    
    // Ask what to deploy
    rl.question('\nWhat would you like to deploy?\n1. Everything (Database + Vercel)\n2. Database only\n3. Vercel only\n4. Fix KYC documents only\n> ', async (answer) => {
      try {
        if (answer === '1' || answer === '2') {
          await runMigrations(environment);
        }
        
        if (answer === '1' || answer === '3') {
          await deployToVercel(environment);
        }
        
        if (answer === '4') {
          await fixKycDocuments(environment);
        }
        
        console.log('\n✅ Deployment completed successfully!');
        rl.close();
      } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        rl.close();
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Start deployment
deploy();