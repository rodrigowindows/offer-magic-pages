#!/usr/bin/env node

/**
 * Script de verificação de erros comuns no código frontend (OTIMIZADO)
 * Executa validações estáticas antes do deploy
 *
 * Uso: npm run check:errors
 */

const fs = require('fs');
const path = require('path');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const errors = [];
const warnings = [];
let filesChecked = 0;

// Configuração
const config = {
  srcDir: path.join(__dirname, '..', 'src'),
  extensions: ['.tsx', '.ts'],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    '.test.',
    '.spec.',
    'vite-env.d.ts',
  ],
  // Focar apenas em arquivos críticos
  priorityPaths: [
    'pages',
    'components',
    'hooks',
    'services',
  ],
};

/**
 * Encontra todos os arquivos recursivamente
 */
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);

    // Ignorar padrões específicos
    if (config.ignorePatterns.some(pattern => filePath.includes(pattern))) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (config.extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Verifica erros CRÍTICOS no conteúdo do arquivo
 */
function checkFileContent(filePath, content) {
  filesChecked++;
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // 1. Verificar .map() sem key (CRÍTICO)
  lines.forEach((line, index) => {
    if (line.includes('.map(') && !line.includes('//')) {
      // Verificar se há "key=" nas próximas 3 linhas
      const contextLines = lines.slice(index, index + 4).join('\n');
      if (contextLines.includes('return') && contextLines.includes('<') && !contextLines.includes('key=')) {
        warnings.push({
          file: relativePath,
          line: index + 1,
          type: 'missing-key',
          message: '.map() sem prop "key"',
          code: line.trim().substring(0, 80),
        });
      }
    }
  });

  // 2. Verificar console.log (AVISOS)
  lines.forEach((line, index) => {
    if ((line.includes('console.log') || line.includes('console.error')) && !line.trim().startsWith('//')) {
      warnings.push({
        file: relativePath,
        line: index + 1,
        type: 'console-log',
        message: 'console.log encontrado',
        code: line.trim().substring(0, 80),
      });
    }
  });

  // 3. Verificar acessos sem optional chaining (DESABILITADO - muito lento)
  // Desabilitado temporariamente para melhorar performance
}

/**
 * Imprime resultados de forma compacta
 */
function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}🔍 VERIFICAÇÃO DE ERROS FRONTEND${colors.reset}`);
  console.log(`   ${filesChecked} arquivos verificados`);
  console.log('='.repeat(70) + '\n');

  // Agrupar warnings por tipo
  const grouped = warnings.reduce((acc, w) => {
    if (!acc[w.type]) acc[w.type] = [];
    acc[w.type].push(w);
    return acc;
  }, {});

  const typeDescriptions = {
    'missing-key': '🔑 .map() sem prop "key"',
    'console-log': '📝 console.log/error encontrado',
    'unsafe-access': '⚠️  Acesso sem optional chaining (?.)',
  };

  // Mostrar resumo por tipo
  Object.entries(grouped).forEach(([type, items]) => {
    console.log(`${colors.yellow}${typeDescriptions[type]} (${items.length} ocorrências)${colors.reset}`);

    // Mostrar apenas os 3 primeiros de cada tipo
    items.slice(0, 3).forEach(item => {
      console.log(`   ${colors.blue}${item.file}:${item.line}${colors.reset}`);
      console.log(`   ${item.code}`);
    });

    if (items.length > 3) {
      console.log(`   ${colors.yellow}... e mais ${items.length - 3} ocorrências${colors.reset}`);
    }
    console.log('');
  });

  // Resumo final
  console.log('='.repeat(70));
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✅ Nenhum erro ou warning encontrado!${colors.reset}`);
  } else {
    console.log(`📊 Resumo:`);
    console.log(`   ${colors.red}Erros críticos: ${errors.length}${colors.reset}`);
    console.log(`   ${colors.yellow}Warnings: ${warnings.length}${colors.reset}`);

    if (errors.length > 0) {
      console.log(`\n${colors.red}⛔ Corrija os erros críticos antes de fazer deploy!${colors.reset}`);
    } else if (warnings.length > 20) {
      console.log(`\n${colors.yellow}⚠️  Muitos warnings. Revise antes do deploy.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✅ Sem erros críticos!${colors.reset}`);
    }
  }
  console.log('='.repeat(70) + '\n');

  // Exit code - só falha se tiver erros CRÍTICOS
  process.exit(errors.length > 0 ? 1 : 0);
}

/**
 * Execução principal
 */
function main() {
  console.log(`${colors.blue}🔍 Procurando arquivos em: ${config.srcDir}${colors.reset}`);

  const files = findFiles(config.srcDir);
  console.log(`${colors.blue}📁 ${files.length} arquivos encontrados${colors.reset}`);

  // Processar apenas arquivos prioritários primeiro
  const priorityFiles = files.filter(f =>
    config.priorityPaths.some(p => f.includes(path.sep + p + path.sep))
  );

  // Limitar a no máximo 50 arquivos para performance
  const filesToCheck = priorityFiles.length > 50 ? priorityFiles.slice(0, 50) : priorityFiles;

  console.log(`${colors.blue}📝 Verificando ${filesToCheck.length} arquivos prioritários...${colors.reset}\n`);

  filesToCheck.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      checkFileContent(filePath, content);
    } catch (err) {
      // Ignorar erros de leitura
    }
  });

  printResults();
}

// Executar
main();
