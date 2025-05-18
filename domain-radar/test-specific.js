#!/usr/bin/env node

import apiClient from './dist/utils/api-client.js';

// Test a specific domain
async function testSpecificDomain() {
  try {
    console.log('Testing a specific domain that might be available...');
    const result = await apiClient.checkDomainAvailability('johnsmastertech.ai');
    console.log('Result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSpecificDomain();