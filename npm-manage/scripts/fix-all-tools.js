import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all tool definitions to use z.object()
const toolPattern = /server\.tool\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*\{/g;
content = content.replace(toolPattern, 'server.tool(\n  "$1",\n  "$2",\n  z.object({');

// Fix all return statements
const returnPattern = /return\s*\{\s*content:\s*\[\s*\{\s*type:\s*"text"(?:\s*as\s*const)?\s*,\s*text:\s*`([^`]+)`\s*\}\s*\]\s*\}/g;
content = content.replace(returnPattern, 'return toolResponse(`$1`)');

// More complex return statements with variables
const returnPattern2 = /return\s*\{\s*content:\s*\[\s*\{\s*type:\s*"text"(?:\s*as\s*const)?\s*,\s*text:\s*([^}]+)\s*\}\s*\]\s*\}/g;
content = content.replace(returnPattern2, (match, text) => {
  // If the text contains template literals or expressions, wrap in toolResponse
  if (text.includes('?') || text.includes(':') || text.includes('join')) {
    return `return toolResponse(${text.trim()})`;
  }
  return match;
});

fs.writeFileSync(filePath, content);
console.log('Fixed all tool definitions');