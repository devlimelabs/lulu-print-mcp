#!/usr/bin/env node

import apiClient from './dist/utils/api-client.js';

// Test domain availability checking
async function testDomainAvailability() {
  console.log('Testing Domain Radar MCP with WhoisXML API integration...\n');
  
  try {
    // Test 1: Check a specific domain
    console.log('Test 1: Checking devlimelabs.com availability...');
    const result1 = await apiClient.checkDomainAvailability('devlimelabs.com');
    console.log('Result:', result1);
    console.log('');
    
    // Test 2: Check multiple TLDs
    console.log('Test 2: Checking multiple TLDs for "example"...');
    const result2 = await apiClient.checkMultipleTLDs('example');
    console.log('Results:');
    result2.forEach(r => console.log(`- ${r.domain}: ${r.available ? 'Available' : 'Not Available'}`));
    console.log('');
    
    // Test 3: Get expiring domains (mock data)
    console.log('Test 3: Getting expiring domains (mock data)...');
    const result3 = await apiClient.getExpiringDomains();
    console.log('Expiring domains count:', result3.length);
    if (result3.length > 0) {
      console.log('First domain:', result3[0]);
    }
    console.log('');
    
    // Test 4: Get expired domains (mock data)
    console.log('Test 4: Getting expired domains (mock data)...');
    const result4 = await apiClient.getExpiredDomains();
    console.log('Expired domains count:', result4.length);
    if (result4.length > 0) {
      console.log('First domain:', result4[0]);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDomainAvailability();