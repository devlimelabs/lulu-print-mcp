import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runTests() {
  // Set up environment variables
  const env = {
    ...process.env,
    MCP_ENV_ENCRYPTION_KEY: 'test-key-1234567890',
  };

  // Start the MCP server with stdio
  const mcp = spawn('node', ['dist/bin/mcp-env-manager.js'], {
    env,
    cwd: '/Users/john/code/master-mcps/packages/mcp-env-manager',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let profileId = '';

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
    // 1. Create a profile
    console.log('1. Testing create-profile...');
    const createProfileReq = await fs.readFile('./test_output/create_profile.json', 'utf-8');
    mcp.stdin.write(createProfileReq + '\n');
    
    // Wait for the response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. List profiles
    console.log('2. Testing list-profiles...');
    const listProfilesReq = await fs.readFile('./test_output/list_profiles.json', 'utf-8');
    mcp.stdin.write(listProfilesReq + '\n');
    
    // Wait for the response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the profile ID in the stdout
    const profileMatch = stdoutData.match(/"id":"([^"]+)"/);
    if (profileMatch && profileMatch[1]) {
      profileId = profileMatch[1];
      console.log('Found profile ID:', profileId);
      
      // 3. Activate profile
      console.log('3. Testing activate-profile...');
      let activateProfileReq = await fs.readFile('./test_output/activate_profile.json', 'utf-8');
      activateProfileReq = activateProfileReq.replace('PROFILE_ID_PLACEHOLDER', profileId);
      mcp.stdin.write(activateProfileReq + '\n');
      
      // Wait for the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. Set environment variable
      console.log('4. Testing set-env-var...');
      let setEnvVarReq = await fs.readFile('./test_output/set_env_var.json', 'utf-8');
      setEnvVarReq = setEnvVarReq.replace('PROFILE_ID_PLACEHOLDER', profileId);
      mcp.stdin.write(setEnvVarReq + '\n');
      
      // Wait for the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. List environment variables
      console.log('5. Testing list-env-vars...');
      let listEnvVarsReq = await fs.readFile('./test_output/list_env_vars.json', 'utf-8');
      listEnvVarsReq = listEnvVarsReq.replace('PROFILE_ID_PLACEHOLDER', profileId);
      mcp.stdin.write(listEnvVarsReq + '\n');
    } else {
      console.error('Could not find profile ID in the output');
    }
    
    // Wait for the response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Get watcher configuration
    console.log('6. Testing get-watcher-config...');
    const getWatcherConfigReq = await fs.readFile('./test_output/get_watcher_config.json', 'utf-8');
    mcp.stdin.write(getWatcherConfigReq + '\n');
    
    // Wait for the response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. List installed MCPs
    console.log('7. Testing list-installed-mcps...');
    const listInstalledMcpsReq = await fs.readFile('./test_output/list_installed_mcps.json', 'utf-8');
    mcp.stdin.write(listInstalledMcpsReq + '\n');
    
    // Wait for the final response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } finally {
    // Kill the server
    console.log('Stopping the server...');
    mcp.kill();
    
    // Save the logs
    await fs.writeFile('./test_output/server_stdout.log', stdoutData);
    await fs.writeFile('./test_output/server_stderr.log', stderrData);
    
    console.log('Tests completed. Logs saved to ./test_output/');
  }
}

runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});