#!/usr/bin/env node

/**
 * Real API endpoint testing script
 * This script tests actual API endpoints without simulated data
 */

const testEndpoints = [
  { id: 'db-connection', name: 'Database Connection', endpoint: '/api/test/database' },
  { id: 'api-health', name: 'API Health Check', endpoint: '/api/test/api-health' },
  { id: 'auth-flow', name: 'Authentication Flow', endpoint: '/api/test/auth-flow' },
  { id: 'beats-api', name: 'Beats API', endpoint: '/api/test/beats-api' },
  { id: 'cart-operations', name: 'Cart Operations', endpoint: '/api/test/cart-operations' },
  { id: 'media-validation', name: 'Media Validation', endpoint: '/api/test/media-validation' },
  { id: 'audio-processing', name: 'Audio Processing', endpoint: '/api/test/audio-processing' },
  { id: 'paypal-config', name: 'PayPal Configuration', endpoint: '/api/test/paypal' },
  { id: 'stripe-config', name: 'Stripe Configuration', endpoint: '/api/test/stripe' },
  { id: 'payment-flow', name: 'Payment Flow', endpoint: '/api/test/payment-flow' },
  { id: 'email-config', name: 'Email Configuration', endpoint: '/api/test/email' },
  { id: 'email-templates', name: 'Email Templates', endpoint: '/api/test/email-templates' },
  { id: 'notification-system', name: 'Notification System', endpoint: '/api/test/notification-system' },
  { id: 'auth-security', name: 'Authentication Security', endpoint: '/api/test/auth-security' },
  { id: 'input-validation', name: 'Input Validation', endpoint: '/api/test/input-validation' },
  { id: 'rate-limiting', name: 'Rate Limiting', endpoint: '/api/test/rate-limiting' }
];

async function testEndpoint(endpoint, name) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method: 'GET',
      credentials: 'include', // Include session cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        name,
        status: 'passed',
        message: data.message || 'Test completed successfully',
        duration
      };
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return {
        name,
        status: 'failed',
        message: errorData.message || `HTTP ${response.status}`,
        duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      status: 'failed',
      message: error.message || 'Network error',
      duration
    };
  }
}

async function runRealEndpointTests() {
  console.log('🚀 Starting Real API Endpoint Testing\n');
  console.log('⚠️  Note: This requires your development server to be running on localhost:5000');
  console.log('⚠️  Note: You must be logged in as an admin for tests to pass\n');
  
  console.log(`📋 Total endpoints to test: ${testEndpoints.length}\n`);
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of testEndpoints) {
    process.stdout.write(`⏳ Testing ${test.name}... `);
    
    const result = await testEndpoint(test.endpoint, test.name);
    results.push(result);
    
    if (result.status === 'passed') {
      console.log(`✅ PASSED (${result.duration}ms)`);
      passed++;
    } else {
      console.log(`❌ FAILED (${result.duration}ms)`);
      failed++;
    }
  }
  
  console.log('\n📊 Real API Test Results Summary:');
  console.log('==================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / testEndpoints.length) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => console.log(`   • ${r.name}: ${r.message}`));
  }
  
  console.log('\n🎉 Real endpoint testing completed!');
  
  if (failed > 0) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Ensure your development server is running on localhost:5000');
    console.log('2. Make sure you are logged in as an admin user');
    console.log('3. Check that all required environment variables are set');
    console.log('4. Verify database connection is working');
  }
}

// Run the real endpoint tests
runRealEndpointTests().catch(console.error);