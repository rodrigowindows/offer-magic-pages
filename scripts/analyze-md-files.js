// scripts/analyze-md-files.js
// Script para analisar e categorizar arquivos .md


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'md-files-report.json');

function getAllMdFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Ignora node_modules, .git, docs (opcional)
      if (!['node_modules', '.git'].includes(file)) {
        getAllMdFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function extractTitleAndKeywords(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const title = lines.find(line => line.trim().startsWith('#')) || '';
  // Palavras-chave: primeiras 20 palavras (ignorando stopwords comuns)
  const stopwords = ['de', 'da', 'do', 'e', 'em', 'para', 'com', 'o', 'a', 'os', 'as', 'um', 'uma', 'por', 'no', 'na', 'que', 'dos', 'das', 'ou', 'se', 'ao', 'à', 'às', 'é', 'ser', 'são', 'foi', 'sendo', 'como', 'mais', 'menos', 'também', 'mas', 'já', 'não', 'sim', 'seu', 'sua', 'seus', 'suas', 'pelo', 'pela', 'pelos', 'pelas'];
  const words = content.replace(/[#*\-\d\[\]\(\)\.,:;_]/g, ' ').split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !stopwords.includes(w));
  const keywords = Array.from(new Set(words)).slice(0, 20);
  return { title: title.trim(), keywords };
}

function main() {
  const mdFiles = getAllMdFiles(ROOT);
  const report = mdFiles.map(filePath => {
    const relPath = path.relative(ROOT, filePath);
    const { title, keywords } = extractTitleAndKeywords(filePath);
    return { file: relPath, title, keywords };
  });
  fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Relatório gerado: ${OUTPUT}`);
}

main();
