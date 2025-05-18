/**
 * Executes an npm command and returns the output
 *
 * @param command - The npm command to execute (without 'npm' prefix)
 * @param cwd - The working directory to execute the command in
 * @returns The stdout of the command execution
 * @throws Error if the command fails
 */
export declare function runNpmCommand(command: string, cwd?: string): Promise<string>;
/**
 * Checks if npm is installed and accessible
 *
 * @returns A promise that resolves to true if npm is installed, or rejects with an error
 */
export declare function checkNpmInstallation(): Promise<boolean>;
/**
 * Checks if the user is logged in to npm
 *
 * @returns A promise that resolves to the user info if logged in, or null if not logged in
 */
export declare function getNpmUser(): Promise<any | null>;
