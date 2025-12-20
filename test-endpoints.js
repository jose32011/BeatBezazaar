#!/usr/bin/env node

/**
 * Quick endpoint availability test
 * This script tests if the new API endpoints are accessible
 */

const testEndpoints = [
  '/api/test/input-validation',
  '/api/test/auth-flow',
  '/api/test/beats-api',
  '/api/test/cart-operations',
  '/api/test/media-validation',
  '/api/test/audio-processing',
  '/api/test/payment-flow',
  '/api/test/email-templates',
  '/api/test/notification-system',
  '/api/test/auth-security',
  '/api/test/rate-limiting'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return { endpoint, status: 'JSON Response', code: response.status };
    } else {
      return { endpoint, status: 'HTML Response (404)', code: response.status };
    }
  } catch (error) {
    return { endpoint, status: 'Network Error', error: error.message };
  }
}

async function testAllEndpoints() {
  console.log('🔍 Testing New API Endpoints Availability\n');
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.status === 'JSON Response') {
      console.log(`✅ ${endpoint} - Available (${result.code})`);
    } else if (result.status === 'HTML Response (404)') {
      console.log(`❌ ${endpoint} - Not Found (returning HTML)`);
    } else {
      console.log(`⚠️  ${endpoint} - ${result.status}`);
    }
  }
  
  console.log('\n💡 If endpoints show "Not Found (returning HTML)":');
  console.log('   → Your development server needs to be restarted');
  console.log('   → The new routes in server/routes.ts need to be loaded');
}

testAllEndpoints().catch(console.error);