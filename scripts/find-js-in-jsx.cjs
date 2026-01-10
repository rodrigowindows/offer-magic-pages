#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findFiles(dir, ext = '.tsx') {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git'].includes(file)) continue;
      results.push(...findFiles(full, ext));
    } else if (file.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(const|let|var|function)\b/.test(line)) {
      // look back N non-empty lines
      let lookback = 8;
      let j = i - 1;
      let prevLines = [];
      while (j >= 0 && lookback > 0) {
        if (lines[j].trim() !== '') {
          prevLines.push(lines[j]);
          lookback--;
        }
        j--;
      }
      const joined = prevLines.join('\n');
      // Heuristic: previous context contains JSX opening tag or an expression start
      if (/[<>]/.test(joined) || /\{/.test(joined)) {
        // But ignore cases where the const is at top of component (export const ...) or normal function boundaries
        // If two lines above contains "export" or "function" or "const .* = \(" treat as ok
        const above = prevLines[prevLines.length - 1] || '';
        if (/^\s*(export\s+)?const\s+\w+\s*=\s*\(/.test(above)) {
          // skip
        } else {
          findings.push({ line: i + 1, code: line.trim(), context: prevLines.reverse().slice(0,5).join('\n') });
        }
      }
    }
  }

  return findings;
}

function main() {
  const root = path.join(__dirname, '..', 'src');
  const files = findFiles(root, '.tsx');
  let total = 0;
  for (const f of files) {
    const findings = checkFile(f);
    if (findings.length) {
      console.log(`\nFile: ${path.relative(process.cwd(), f)}`);
      findings.forEach(fn => {
        console.log(`  Line ${fn.line}: ${fn.code}`);
        console.log(`    Context:
${fn.context.split('\n').map(l => '      ' + l).join('\n')}`);
      });
      total += findings.length;
    }
  }
  if (total === 0) console.log('\nNo likely JS-in-JSX declarations found.');
  else console.log(`\nFound ${total} possible occurrences.`);
}

main();
