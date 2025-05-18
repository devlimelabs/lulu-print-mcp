#!/usr/bin/env node
/**
 * Test runner for Domain Radar MCP
 * 
 * This script runs a series of test requests against the Domain Radar MCP server
 * to verify that it's functioning correctly.
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  try {
    console.log('Starting Domain Radar MCP test suite...');
    
    // Set up environment (use example .env values for testing)
    const env = {
      ...process.env,
      DOMAIN_API_KEY: 'test_api_key',
    };

    // Start the MCP server
    console.log('Starting MCP server...');
    const mcp = spawn('node', ['../dist/bin/cli.js'], {
      env,
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Collect stdout and stderr
    let stdoutData = '';
    let stderrData = '';

    mcp.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log('Server output:', data.toString().trim());
    });

    mcp.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log('Server log:', data.toString().trim());
    });

    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Server started, beginning tests...');

    try {
      // Test files to run
      const testFiles = [
        'check-domain-availability.json',
        'search-expiring-domains.json',
        'search-expired-domains.json'
      ];
      
      // Run each test
      for (const testFile of testFiles) {
        console.log(`Testing ${testFile}...`);
        const req = await fs.readFile(path.join(__dirname, testFile), 'utf-8');
        mcp.stdin.write(req + '\\n');
        
        // Wait for the response
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('All tests completed.');
    } finally {
      // Kill the server
      console.log('Stopping the server...');
      mcp.kill();
      
      // Save the logs
      await fs.writeFile(path.join(__dirname, 'server_stdout.log'), stdoutData);
      await fs.writeFile(path.join(__dirname, 'server_stderr.log'), stderrData);
      
      console.log('Tests completed. Logs saved to:');
      console.log(`- ${path.join(__dirname, 'server_stdout.log')}`);
      console.log(`- ${path.join(__dirname, 'server_stderr.log')}`);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Unhandled test error:', error);
  process.exit(1);
});