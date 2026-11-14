import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const excluded = new Set(['node_modules', '.git', '.next', 'artifacts', 'coverage', 'meta']);
const generated = new Set(['package-lock.json', 'next-env.d.ts', 'tsconfig.tsbuildinfo']);
const extensions = new Set(['.ts', '.tsx', '.mjs', '.css', '.sql', '.json', '.yaml']);
const errors = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !excluded.has(entry.name)) await inspect(file);
    if (!entry.isFile() || generated.has(entry.name)) continue;
    if (!extensions.has(path.extname(file))) continue;
    const content = await readFile(file, 'utf8');
    const lines = content.trimEnd().split(/\r?\n/);
    if (lines.length > 300) errors.push(`${file}: ${lines.length} lines (maximum 300)`);
    lines.forEach((line, index) => {
      if (line.length > 100 && !line.includes('https://')) {
        errors.push(`${file}:${index + 1}: ${line.length} characters (maximum 100)`);
      }
    });
  }
}

await inspect('.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('All authored code/config files: <=300 lines, <=100 characters per line.');
