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
    if (line.includes('<pre') || line.includes('<code')) {
      // find closing tag
      let closingTag = line.includes('<pre') ? '</pre>' : '</code>';
      let j = i + 1;
      let inside = false;
      while (j < lines.length) {
        if (lines[j].includes(closingTag)) break;
        // check declaration lines
        if (/^\s*(const|let|var|function)\b/.test(lines[j])) {
          // ensure the declaration is not inside a template string block (starts with {` or { or {JSON)
          const prev = lines[j-1] || '';
          // if previous non-empty contains '{' at end or starts with '{`', it's an expression - still invalid if declaration is raw text
          findings.push({ line: j+1, code: lines[j].trim(), file: file });
        }
        j++;
      }
    }
  }
  return findings;
}

function main(){
  const root = path.join(__dirname, '..', 'src');
  const files = findFiles(root, '.tsx');
  let total = 0;
  for (const f of files) {
    const findings = checkFile(f);
    if (findings.length) {
      console.log(`\nFile: ${path.relative(process.cwd(), f)}`);
      findings.forEach(fn => {
        console.log(`  Line ${fn.line}: ${fn.code}`);
      });
      total += findings.length;
    }
  }
  if (total === 0) console.log('\nNo declarations found directly inside <pre>/<code> children.');
  else console.log(`\nFound ${total} declarations inside <pre>/<code> candidates.`);
}

main();
