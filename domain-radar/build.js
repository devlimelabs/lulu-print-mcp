#!/usr/bin/env node
import { createRequire } from 'module';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Building Domain Radar MCP...');

  try {
    // Create dist directory
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/tools'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/utils'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/resources'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/bin'), { recursive: true });

    // Copy and transform core files
    const filesToCopy = [
      'src/index.ts',
      'src/server.ts',
      'src/config.ts',
      'src/types.ts',
      'src/tools/index.ts',
      'src/tools/domain-tools.ts',
      'src/utils/api-client.ts',
      'src/utils/error-handler.ts',
      'src/resources/index.ts',
      'src/resources/domain-resources.ts',
      'src/bin/cli.ts'
    ];

    for (const file of filesToCopy) {
      const content = await fs.readFile(path.join(__dirname, file), 'utf8');
      
      // Simple TypeScript to JavaScript transformation
      const jsContent = content
        .replace(/\.ts/g, '.js')
        .replace(/import type \{[^}]*\}[^;]*;/g, '') // Remove type imports
        .replace(/interface\s+[^{]*\{[^}]*\}/g, '') // Remove interfaces
        .replace(/:\s*[A-Za-z<>\[\]'"|&]+/g, '') // Remove type annotations
        .replace(/export type[^;]*;/g, '') // Remove exported types
        .replace(/Promise<[^>]*>/g, 'Promise') // Remove generic Promise types
        .replace(/: void/g, '') // Remove void return types
        .replace(/\s*\?\s*:/g, ':') // Remove optional parameter indicators
        .replace(/as\s+[A-Za-z<>\[\]'"|&]+/g, '') // Remove type assertions
        .replace(/<[A-Za-z<>\[\]'"|&]+>/g, ''); // Remove generic type parameters

      const destPath = path.join(__dirname, 'dist', file.replace(/^src\//, '').replace(/\.ts$/, '.js'));
      await fs.writeFile(destPath, jsContent);
      console.log(`Processed: ${file} -> ${destPath}`);
    }

    // Make bin file executable
    await fs.chmod(path.join(__dirname, 'dist/bin/cli.js'), 0o755);
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();