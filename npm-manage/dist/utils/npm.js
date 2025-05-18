/**
 * NPM command execution utilities for the MCP server
 * Provides safe, typed wrappers around npm CLI operations
 */
import { exec } from "child_process";
import { promisify } from "util";
// Promisify exec for async/await usage
const execAsync = promisify(exec);
/**
 * Executes an npm command and returns the output
 *
 * @param command - The npm command to execute (without 'npm' prefix)
 * @param cwd - The working directory to execute the command in
 * @returns The stdout of the command execution
 * @throws Error if the command fails
 */
export async function runNpmCommand(command, cwd = process.cwd()) {
    try {
        const { stdout, stderr } = await execAsync(`npm ${command}`, {
            cwd,
            // Allow larger output
            maxBuffer: 1024 * 1024 * 10
        });
        // NPM often outputs to stderr for non-error information
        if (stderr &&
            !stderr.includes('npm notice') &&
            !stderr.includes('npm WARN') &&
            !stderr.includes('npm http') &&
            !stderr.includes('added') &&
            !stderr.includes('removed')) {
            throw new Error(stderr);
        }
        // Return combined output in case important info is in stderr
        return stdout + (stderr ? `\n${stderr}` : '');
    }
    catch (error) {
        // If error has stdout/stderr, include it in the error message
        if (error.stdout || error.stderr) {
            const errorOutput = error.stderr || error.stdout;
            throw new Error(`Error executing npm ${command}: ${errorOutput}`);
        }
        throw new Error(`Error executing npm ${command}: ${error.message}`);
    }
}
/**
 * Checks if npm is installed and accessible
 *
 * @returns A promise that resolves to true if npm is installed, or rejects with an error
 */
export async function checkNpmInstallation() {
    try {
        await execAsync('npm --version');
        return true;
    }
    catch (error) {
        throw new Error('NPM is not installed or not accessible. Please install NPM to use this MCP server.');
    }
}
/**
 * Checks if the user is logged in to npm
 *
 * @returns A promise that resolves to the user info if logged in, or null if not logged in
 */
export async function getNpmUser() {
    try {
        const { stdout } = await execAsync('npm whoami --json');
        return JSON.parse(stdout);
    }
    catch (error) {
        // If command fails, user is likely not logged in
        return null;
    }
}
//# sourceMappingURL=npm.js.map