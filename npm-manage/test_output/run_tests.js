import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  // Set up environment
  const env = {
    ...process.env,
  };

  // Start the MCP server
  console.log('Starting NPM Package Manager MCP server...');
  const mcp = spawn('node', ['../dist/bin.js'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Collect stdout and stderr
  let stdoutData = '';
  let stderrData = '';

  mcp.stdout.on('data', (data) => {
    stdoutData += data.toString();
    console.log('Server output:', data.toString());
  });

  mcp.stderr.on('data', (data) => {
    stderrData += data.toString();
    console.log('Server error:', data.toString());
  });

  // Wait for the server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test each tool
    for (const testFile of ['npm-init.json', 'npm-list-deps.json', 'npm-install.json']) {
      console.log(`\nTesting ${testFile}...`);
      const req = await fs.readFile(path.join(__dirname, testFile), 'utf-8');
      mcp.stdin.write(req + '\n');
      
      // Wait for the response
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Kill the server
    console.log('\nStopping the server...');
    mcp.kill();
    
    // Save the logs
    await fs.writeFile(path.join(__dirname, 'server_stdout.log'), stdoutData);
    await fs.writeFile(path.join(__dirname, 'server_stderr.log'), stderrData);
    
    console.log('Tests completed. Logs saved to test_output directory.');
  }
}

runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});