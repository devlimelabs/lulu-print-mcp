/**
 * NPM Package Manager MCP Server
 *
 * This server enables AI assistants to manage NPM packages through natural language.
 * It provides tools for package initialization, dependency management, publishing,
 * and other npm operations, allowing LLMs to help with the full lifecycle of
 * JavaScript/TypeScript package development.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkNpmInstallation, getNpmUser, runNpmCommand } from "./utils/npm.js";
import { readPackageJson, writePackageJson, packageJsonExists, updatePackageScripts, getAllDependencies } from "./utils/package-json.js";
import { createErrorResponse, handleError } from "./utils/error-handler.js";
import fs from "fs/promises";
// Create the MCP server
const server = new McpServer({
    name: "NPM Package Manager",
    version: "1.0.0"
});
// Helper to ensure proper return typing
const toolResponse = (text) => ({
    content: [{ type: "text", text }]
});
// ====================================================================================
// PACKAGE INITIALIZATION TOOLS
// ====================================================================================
server.tool("npm-init", "Initialize a new npm package or update an existing one", z.object({
    packageName: z.string().optional(),
    version: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    private: z.boolean().optional(),
    type: z.enum(['commonjs', 'module']).optional(),
    directory: z.string().optional()
}), async ({ packageName, version, description, author, license, private: isPrivate, type, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        // Create the directory if it doesn't exist
        await fs.mkdir(cwd, { recursive: true });
        // Check if package.json already exists
        const packageExists = await packageJsonExists(cwd);
        if (packageExists) {
            // If package.json exists, just update it with the provided fields
            const packageJson = await readPackageJson(cwd);
            if (packageName)
                packageJson.name = packageName;
            if (version)
                packageJson.version = version;
            if (description)
                packageJson.description = description;
            if (author)
                packageJson.author = author;
            if (license)
                packageJson.license = license;
            if (isPrivate !== undefined)
                packageJson.private = isPrivate;
            if (type)
                packageJson.type = type;
            await writePackageJson(packageJson, cwd);
            return toolResponse(`Successfully updated package.json for ${packageJson.name || 'package'} at ${cwd}`);
        }
        else {
            // If package.json doesn't exist, create a new one with npm init
            await runNpmCommand('init -y', cwd);
            // Then update with the provided fields
            const packageJson = await readPackageJson(cwd);
            if (packageName)
                packageJson.name = packageName;
            if (version)
                packageJson.version = version;
            if (description)
                packageJson.description = description;
            if (author)
                packageJson.author = author;
            if (license)
                packageJson.license = license;
            if (isPrivate !== undefined)
                packageJson.private = isPrivate;
            if (type)
                packageJson.type = type;
            await writePackageJson(packageJson, cwd);
            return toolResponse(`Successfully initialized NPM package ${packageJson.name} at ${cwd}\n\nTo continue development, you can add dependencies with npm-install, configure scripts with npm-set-scripts, and more.`);
        }
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// ====================================================================================
// DEPENDENCY MANAGEMENT TOOLS
// ====================================================================================
server.tool("npm-install", "Install packages as dependencies, devDependencies, or peerDependencies", z.object({
    packages: z.array(z.string()).optional().describe("Packages to install (e.g., ['react', 'lodash@4.17.21', '@types/node'])"),
    dev: z.boolean().optional().describe("Install as dev dependency (for development tools like TypeScript, testing frameworks)"),
    peer: z.boolean().optional().describe("Install as peer dependency (for plugins/extensions that require host package)"),
    exact: z.boolean().optional().describe("Install exact version instead of semver range (prevents auto-updates)"),
    global: z.boolean().optional().describe("Install package globally (available system-wide)"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}), async ({ packages, dev, peer, exact, global: isGlobal, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        // For global installs, we don't need to check for package.json
        if (!isGlobal && !await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Run npm-init first to create a package.`);
        }
        // Build the npm install command
        let command = 'install';
        // Can't combine these flags
        if (dev && peer) {
            throw new Error("Cannot install package as both dev and peer dependency");
        }
        if (dev)
            command += ' --save-dev';
        if (peer)
            command += ' --save-peer';
        if (exact)
            command += ' --save-exact';
        if (isGlobal)
            command += ' --global';
        if (packages && packages.length > 0)
            command += ` ${packages.join(' ')}`;
        const output = await runNpmCommand(command, cwd);
        const responseType = isGlobal ? 'globally' : (dev ? 'as dev dependencies' : (peer ? 'as peer dependencies' : 'as dependencies'));
        return {
            content: [{
                    type: "text",
                    text: packages && packages.length > 0
                        ? `Successfully installed ${packages.join(', ')} ${responseType}`
                        : `Successfully installed dependencies from package.json`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-uninstall", "Remove packages from your project", {
    packages: z.array(z.string()).describe("Packages to uninstall (e.g., ['react', 'lodash'])"),
    global: z.boolean().optional().describe("Uninstall package globally (if it was installed globally)"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ packages, global: isGlobal, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        // For global uninstalls, we don't need to check for package.json
        if (!isGlobal && !await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        if (!packages || packages.length === 0) {
            throw new Error("Please specify at least one package to uninstall");
        }
        // Build the npm uninstall command
        let command = 'uninstall';
        if (isGlobal)
            command += ' --global';
        command += ` ${packages.join(' ')}`;
        const output = await runNpmCommand(command, cwd);
        return {
            content: [{
                    type: "text",
                    text: `Successfully uninstalled ${packages.join(', ')} ${isGlobal ? 'globally' : 'from the project'}`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-list-deps", "List all dependencies in your project", {
    type: z.enum(['all', 'prod', 'dev', 'peer']).optional().describe("Type of dependencies to list: 'all', 'prod', 'dev', or 'peer'"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ type = 'all', directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        const { dependencies, devDependencies, peerDependencies } = await getAllDependencies(cwd);
        let result = '';
        if (type === 'all' || type === 'prod') {
            const depCount = Object.keys(dependencies).length;
            result += `Dependencies (${depCount}):\n`;
            if (depCount > 0) {
                for (const [name, version] of Object.entries(dependencies)) {
                    result += `- ${name}: ${version}\n`;
                }
            }
            else {
                result += "No dependencies found\n";
            }
            result += '\n';
        }
        if (type === 'all' || type === 'dev') {
            const devDepCount = Object.keys(devDependencies).length;
            result += `DevDependencies (${devDepCount}):\n`;
            if (devDepCount > 0) {
                for (const [name, version] of Object.entries(devDependencies)) {
                    result += `- ${name}: ${version}\n`;
                }
            }
            else {
                result += "No devDependencies found\n";
            }
            result += '\n';
        }
        if (type === 'all' || type === 'peer') {
            const peerDepCount = Object.keys(peerDependencies).length;
            result += `PeerDependencies (${peerDepCount}):\n`;
            if (peerDepCount > 0) {
                for (const [name, version] of Object.entries(peerDependencies)) {
                    result += `- ${name}: ${version}\n`;
                }
            }
            else {
                result += "No peerDependencies found\n";
            }
        }
        return {
            content: [{
                    type: "text",
                    text: result.trim()
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-update", "Update packages to their latest versions", {
    packages: z.array(z.string()).optional().describe("Specific packages to update (empty for all packages)"),
    latest: z.boolean().optional().describe("Update to the latest version, ignoring semver constraints"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ packages, latest, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        // Build the npm update command
        let command = 'update';
        if (latest)
            command += ' --latest';
        if (packages && packages.length > 0)
            command += ` ${packages.join(' ')}`;
        const output = await runNpmCommand(command, cwd);
        return {
            content: [{
                    type: "text",
                    text: packages && packages.length > 0
                        ? `Successfully updated ${packages.join(', ')}`
                        : `Successfully updated all dependencies`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// ====================================================================================
// PACKAGE CONFIGURATION TOOLS
// ====================================================================================
server.tool("npm-set-scripts", "Configure npm scripts in package.json", {
    scripts: z.record(z.string()).describe("Scripts to set in package.json (e.g., {'build': 'tsc', 'test': 'jest'})"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ scripts, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Run npm-init first to create a package.`);
        }
        const packageJson = await updatePackageScripts(scripts, cwd);
        let scriptList = '';
        for (const [name, command] of Object.entries(scripts)) {
            scriptList += `- ${name}: ${command}\n`;
        }
        return {
            content: [{
                    type: "text",
                    text: `Successfully updated scripts in package.json for ${packageJson.name}:\n\n${scriptList}\nRun these scripts with 'npm run <script-name>'`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-run-script", "Execute npm scripts", {
    script: z.string().describe("Script name to run from package.json (e.g., 'build', 'test')"),
    args: z.array(z.string()).optional().describe("Additional arguments to pass to the script"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ script, args = [], directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        const packageJson = await readPackageJson(cwd);
        if (!packageJson.scripts || !packageJson.scripts[script]) {
            throw new Error(`Script '${script}' not found in package.json. Available scripts are: ${packageJson.scripts ? Object.keys(packageJson.scripts).join(', ') : 'none'}`);
        }
        // Build the npm run command
        let command = `run ${script}`;
        if (args.length > 0) {
            // Need to pass -- to separate npm args from script args
            command += ` -- ${args.join(' ')}`;
        }
        const output = await runNpmCommand(command, cwd);
        return {
            content: [{
                    type: "text",
                    text: `Successfully ran script '${script}'\n\nCommand executed: npm ${command}\n\nOutput:\n${output}`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-set-config", "Set any field in package.json", {
    field: z.string().describe("Field to update in package.json (e.g., 'main', 'type', 'homepage')"),
    value: z.any().describe("Value to set for the field"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ field, value, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Run npm-init first to create a package.`);
        }
        const packageJson = await readPackageJson(cwd);
        // Update the specified field
        packageJson[field] = value;
        await writePackageJson(packageJson, cwd);
        return {
            content: [{
                    type: "text",
                    text: `Successfully set ${field} = ${JSON.stringify(value)} in package.json`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// ====================================================================================
// VERSION CONTROL AND PUBLISHING TOOLS
// ====================================================================================
server.tool("npm-version", "Update package version (major, minor, patch, or custom)", {
    type: z.enum(['major', 'minor', 'patch', 'custom']).describe("Version increment type based on semantic versioning"),
    customVersion: z.string().optional().describe("Custom version string (if type is 'custom', e.g., '2.0.0-beta.1')"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ type, customVersion, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        // Get current version before update
        const beforePkg = await readPackageJson(cwd);
        const oldVersion = beforePkg.version;
        let command;
        if (type === 'custom' && customVersion) {
            command = `version ${customVersion} --no-git-tag-version`;
        }
        else {
            command = `version ${type} --no-git-tag-version`;
        }
        await runNpmCommand(command, cwd);
        // Read the new version
        const packageJson = await readPackageJson(cwd);
        return {
            content: [{
                    type: "text",
                    text: `Successfully updated package version from ${oldVersion} to ${packageJson.version}`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-publish", "Publish package to npm registry", {
    access: z.enum(['public', 'restricted']).optional().describe("Package access type for scoped packages ('public' or 'restricted')"),
    tag: z.string().optional().describe("Tag to publish with (default: 'latest')"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ access, tag, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        // Check if user is logged in
        const user = await getNpmUser();
        if (!user) {
            return {
                content: [{
                        type: "text",
                        text: "You're not logged in to npm. Please run 'npm login' in your terminal first."
                    }]
            };
        }
        // Check if package is private
        const packageJson = await readPackageJson(cwd);
        if (packageJson.private) {
            return {
                content: [{
                        type: "text",
                        text: "This package is marked as private in package.json. Set 'private: false' to publish it."
                    }]
            };
        }
        // Build the publish command
        let command = 'publish';
        if (access)
            command += ` --access ${access}`;
        if (tag)
            command += ` --tag ${tag}`;
        const output = await runNpmCommand(command, cwd);
        return {
            content: [{
                    type: "text",
                    text: `Successfully published package ${packageJson.name}@${packageJson.version} to npm registry`
                }]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-registry", "Get or set npm registry configuration", {
    action: z.enum(['get', 'set']).describe("Registry action: 'get' current registry or 'set' new registry"),
    registry: z.string().optional().describe("Registry URL for 'set' action (e.g., 'https://registry.npmjs.org/')"),
    scope: z.string().optional().describe("Scope for the registry for 'set' action (e.g., '@company')"),
    directory: z.string().optional().describe("Directory to execute in (default: current directory)")
}, async ({ action, registry, scope, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        let command = '';
        let output = '';
        switch (action) {
            case 'get':
                command = 'config get registry';
                if (scope) {
                    command = `config get ${scope}:registry`;
                }
                output = await runNpmCommand(command, cwd);
                return {
                    content: [{
                            type: "text",
                            text: `Current npm registry${scope ? ` for scope ${scope}` : ''}: ${output.trim()}`
                        }]
                };
            case 'set':
                if (!registry) {
                    throw new Error("Registry URL is required for 'set' action");
                }
                command = `config set ${scope ? scope + ':' : ''}registry ${registry}`;
                await runNpmCommand(command, cwd);
                return {
                    content: [{
                            type: "text",
                            text: `Successfully set npm registry${scope ? ` for scope ${scope}` : ''} to ${registry}`
                        }]
                };
        }
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// ====================================================================================
// PACKAGE ANALYSIS TOOLS
// ====================================================================================
server.tool("npm-audit", "Run security audit on dependencies", {
    fix: z.boolean().optional().describe("Whether to automatically fix vulnerabilities"),
    level: z.enum(['info', 'low', 'moderate', 'high', 'critical']).optional().describe("Minimum vulnerability level to report"),
    directory: z.string().optional().describe("Directory of the package (default: current directory)")
}, async ({ fix, level, directory }) => {
    try {
        await checkNpmInstallation();
        const cwd = directory || process.cwd();
        if (!await packageJsonExists(cwd)) {
            throw new Error(`No package.json found in ${cwd}. Make sure you're in a package directory.`);
        }
        let command = 'audit';
        if (fix)
            command += ' fix';
        if (level)
            command += ` --audit-level=${level}`;
        try {
            const output = await runNpmCommand(command, cwd);
            return {
                content: [{
                        type: "text",
                        text: `Audit completed successfully${fix ? ' and fixed issues' : ''}\n\n${output}`
                    }]
            };
        }
        catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities are found
            // We'll still return the output since it contains useful information
            return {
                content: [{
                        type: "text",
                        text: `Audit completed with vulnerabilities${fix ? ' (some issues may have been fixed)' : ''}\n\n${handleError(error)}`
                    }]
            };
        }
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-info", "Get detailed information about packages", {
    packageName: z.string().describe("Package name to get info for (e.g., 'react', 'lodash')"),
    field: z.string().optional().describe("Specific info field to retrieve (e.g., 'version', 'dependencies')"),
    version: z.string().optional().describe("Specific version to get info for (e.g., '16.8.0')")
}, async ({ packageName, field, version }) => {
    try {
        await checkNpmInstallation();
        let fullPackageName = packageName;
        if (version) {
            fullPackageName += `@${version}`;
        }
        let command = `view ${fullPackageName}`;
        if (field)
            command += ` ${field}`;
        command += ' --json';
        const output = await runNpmCommand(command);
        try {
            // Try to parse as JSON for better formatting
            const info = JSON.parse(output);
            // Format the output for better readability
            let formattedOutput = '';
            if (field) {
                formattedOutput = `${field}: ${JSON.stringify(info, null, 2)}`;
            }
            else {
                // Format each field
                for (const [key, value] of Object.entries(info)) {
                    formattedOutput += `${key}: ${JSON.stringify(value, null, 2)}\n\n`;
                }
            }
            return {
                content: [{
                        type: "text",
                        text: `Package information for ${fullPackageName}:\n\n${formattedOutput}`
                    }]
            };
        }
        catch (e) {
            // If parsing fails, return the raw output
            return {
                content: [{
                        type: "text",
                        text: `Package information for ${fullPackageName}:\n\n${output}`
                    }]
            };
        }
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
server.tool("npm-search", "Search for packages on npm registry", {
    query: z.string().describe("Search query (e.g., 'react component', 'date utility')"),
    limit: z.number().optional().describe("Maximum number of results to return (default: 10)")
}, async ({ query, limit = 10 }) => {
    try {
        await checkNpmInstallation();
        const command = `search ${query} --no-description --limit=${limit} --json`;
        const output = await runNpmCommand(command);
        try {
            // Try to parse as JSON
            const results = JSON.parse(output);
            if (results.length === 0) {
                return {
                    content: [{
                            type: "text",
                            text: `No packages found for query '${query}'`
                        }]
                };
            }
            // Format the output for better readability
            let formattedOutput = '';
            results.forEach((pkg, index) => {
                formattedOutput += `${index + 1}. ${pkg.name} (${pkg.version})\n`;
                formattedOutput += `   Description: ${pkg.description || 'No description'}\n`;
                formattedOutput += `   Keywords: ${pkg.keywords ? pkg.keywords.join(', ') : 'None'}\n`;
                formattedOutput += `   Author: ${pkg.author ? (typeof pkg.author === 'string' ? pkg.author : pkg.author.name) : 'Unknown'}\n`;
                formattedOutput += `   Link: npm.im/${pkg.name}\n\n`;
            });
            return {
                content: [{
                        type: "text",
                        text: `Search results for '${query}':\n\n${formattedOutput}`
                    }]
            };
        }
        catch (e) {
            // If parsing fails, return the raw output
            return {
                content: [{
                        type: "text",
                        text: `Search results for '${query}':\n\n${output}`
                    }]
            };
        }
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// Export the server for external use
export { server };
//# sourceMappingURL=index.js.map