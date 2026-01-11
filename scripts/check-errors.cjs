#!/usr/bin/env node

/**
 * Script de verificação de erros comuns no código frontend
 * Executa validações estáticas antes do deploy
 *
 * Uso: node scripts/check-errors.js
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

// Configuração
const config = {
  srcDir: path.join(__dirname, '..', 'src'),
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
  ],
};

/**
 * Encontra todos os arquivos recursivamente
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Ignorar padrões específicos
    if (config.ignorePatterns.some(pattern => filePath.includes(pattern))) {
      return;
    }

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (config.extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Verifica erros comuns no conteúdo do arquivo
 */
function checkFileContent(filePath, content) {
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // 1. Verificar .map() sem key
  lines.forEach((line, index) => {
    if (line.includes('.map(') && line.includes('return') && line.includes('<')) {
      // Verificar se há "key=" nas próximas 3 linhas
      const contextLines = lines.slice(index, index + 4).join('\n');
      if (!contextLines.includes('key=')) {
        warnings.push({
          file: relativePath,
          line: index + 1,
          message: 'Possível .map() sem prop "key"',
          code: line.trim(),
        });
      }
    }
  });

  // 2. Verificar console.log
  lines.forEach((line, index) => {
    if (line.includes('console.log') && !line.trim().startsWith('//')) {
      warnings.push({
        file: relativePath,
        line: index + 1,
        message: 'console.log encontrado (remover antes de deploy)',
        code: line.trim(),
      });
    }
  });

  // 3. Verificar acessos diretos a arrays sem verificação
  lines.forEach((line, index) => {
    // Padrões problemáticos: variable.map, variable.filter sem verificação
    const problematicPatterns = [
      /(?<!Array\.isArray\()(?<!\?\.)(\w+)\.map\(/,
      /(?<!Array\.isArray\()(?<!\?\.)(\w+)\.filter\(/,
      /(?<!Array\.isArray\()(?<!\?\.)(\w+)\.forEach\(/,
    ];

    problematicPatterns.forEach(pattern => {
      if (pattern.test(line) && !line.includes('||') && !line.includes('??')) {
        // Ignorar se já tem verificação na mesma linha
        if (!line.includes('Array.isArray') && !line.includes('?.')) {
          warnings.push({
            file: relativePath,
            line: index + 1,
            message: 'Possível acesso a array sem verificação null-safe',
            code: line.trim(),
          });
        }
      }
    });
  });

  // 4. Verificar useEffect sem cleanup em código assíncrono
  let inUseEffect = false;
  let useEffectHasAsync = false;
  let useEffectHasCleanup = false;
  let useEffectStartLine = 0;

  lines.forEach((line, index) => {
    if (line.includes('useEffect(')) {
      inUseEffect = true;
      useEffectHasAsync = false;
      useEffectHasCleanup = false;
      useEffectStartLine = index + 1;
    }

    if (inUseEffect) {
      if (line.includes('async') || line.includes('.then(') || line.includes('await')) {
        useEffectHasAsync = true;
      }
      if (line.includes('return () =>') || line.includes('return function')) {
        useEffectHasCleanup = true;
      }
      if (line.includes('}, [')) {
        // Fim do useEffect
        if (useEffectHasAsync && !useEffectHasCleanup) {
          warnings.push({
            file: relativePath,
            line: useEffectStartLine,
            message: 'useEffect com código assíncrono sem cleanup function',
            code: 'useEffect(...)',
          });
        }
        inUseEffect = false;
      }
    }
  });

  // 5. Verificar imports quebrados (paths relativos suspeitos)
  lines.forEach((line, index) => {
    if (line.includes('import') && line.includes('from')) {
      // Verificar imports com muitos ../
      const match = line.match(/from ['"](.+)['"]/);
      if (match) {
        const importPath = match[1];
        const dotdotCount = (importPath.match(/\.\.\//g) || []).length;
        if (dotdotCount > 3) {
          warnings.push({
            file: relativePath,
            line: index + 1,
            message: `Import com muitos níveis de diretório (${dotdotCount}x ../). Considere usar @/ alias`,
            code: line.trim(),
          });
        }
      }
    }
  });

  // 6. Verificar hooks condicionais - DESABILITADO TEMPORARIAMENTE
  // Script melhorado detectou falsos positivos, desabilitando até correção
  /*
  // Procura por estruturas onde um hook é chamado dentro de um bloco if/else
  const fileLines = content.split('\n');
  let inConditionalBlock = false;
  let conditionalDepth = 0;

  for (let i = 0; i < fileLines.length; i++) {
    const line = fileLines[i].trim();

    // Detecta início de bloco condicional
    if (line.match(/^\s*if\s*\(/) || line.match(/^\s*}?\s*else\s+if\s*\(/) || line.match(/^\s*}?\s*else\s*{/)) {
      inConditionalBlock = true;
      conditionalDepth++;
    }

    // Detecta hooks dentro de blocos condicionais
    if (inConditionalBlock && conditionalDepth > 0 && line.match(/\b(useState|useEffect|useCallback|useMemo|useRef|useContext)\s*\(/)) {
      // Verifica se não é uma chamada de função normal ou import
      if (!line.includes('import') && !line.includes('function') && !line.includes('const') && !line.includes('let')) {
        errors.push({
          file: relativePath,
          line: i + 1,
          message: 'ERRO: Hook chamado dentro de bloco condicional (viola Rules of Hooks)',
          code: line,
        });
        break; // Para no primeiro erro encontrado neste arquivo
      }
    }

    // Detecta fim de bloco
    if (line.includes('}')) {
      conditionalDepth = Math.max(0, conditionalDepth - 1);
      if (conditionalDepth === 0) {
        inConditionalBlock = false;
      }
    }
  }
  */

  // 7. Verificar acesso a propriedades aninhadas sem optional chaining
  lines.forEach((line, index) => {
    // Padrão: objeto.prop1.prop2.prop3 sem ?. ou verificação
    const deepAccessPattern = /(\w+)\.(\w+)\.(\w+)\.(\w+)/;
    if (deepAccessPattern.test(line) && !line.includes('?.') && !line.includes('&&')) {
      // Ignorar imports, types, e comentários
      if (!line.includes('import') && !line.includes('//') && !line.includes('interface')) {
        warnings.push({
          file: relativePath,
          line: index + 1,
          message: 'Acesso profundo a propriedades sem optional chaining (?.)',
          code: line.trim(),
        });
      }
    }
  });
}

/**
 * Imprime resultados
 */
function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}🔍 VERIFICAÇÃO DE ERROS FRONTEND${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  // Erros críticos
  if (errors.length > 0) {
    console.log(`${colors.red}❌ ERROS CRÍTICOS (${errors.length})${colors.reset}\n`);
    errors.forEach(error => {
      console.log(`${colors.red}📁 ${error.file}:${error.line}${colors.reset}`);
      console.log(`   ${error.message}`);
      console.log(`   ${colors.yellow}${error.code}${colors.reset}\n`);
    });
  }

  // Warnings
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  AVISOS (${warnings.length})${colors.reset}\n`);

    // Agrupar por tipo de warning
    const groupedWarnings = warnings.reduce((acc, warning) => {
      if (!acc[warning.message]) {
        acc[warning.message] = [];
      }
      acc[warning.message].push(warning);
      return acc;
    }, {});

    Object.entries(groupedWarnings).forEach(([message, items]) => {
      console.log(`${colors.yellow}⚠️  ${message} (${items.length} ocorrências)${colors.reset}`);
      items.slice(0, 5).forEach(item => {
        console.log(`   📁 ${item.file}:${item.line}`);
        console.log(`      ${item.code.substring(0, 80)}${item.code.length > 80 ? '...' : ''}`);
      });
      if (items.length > 5) {
        console.log(`   ... e mais ${items.length - 5} ocorrências\n`);
      }
      console.log('');
    });
  }

  // Resumo
  console.log('='.repeat(70));
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✅ Nenhum erro ou warning encontrado!${colors.reset}`);
  } else {
    console.log(`📊 Resumo:`);
    console.log(`   ${colors.red}Erros críticos: ${errors.length}${colors.reset}`);
    console.log(`   ${colors.yellow}Warnings: ${warnings.length}${colors.reset}`);

    if (errors.length > 0) {
      console.log(`\n${colors.red}⛔ Corrija os erros críticos antes de fazer deploy!${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✅ Sem erros críticos, mas revise os warnings.${colors.reset}`);
    }
  }
  console.log('='.repeat(70) + '\n');

  // Exit code
  process.exit(errors.length > 0 ? 1 : 0);
}

/**
 * Execução principal
 */
function main() {
  console.log(`${colors.blue}🔍 Procurando arquivos em: ${config.srcDir}${colors.reset}`);

  const files = findFiles(config.srcDir);
  console.log(`${colors.blue}📁 ${files.length} arquivos encontrados${colors.reset}\n`);

  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      checkFileContent(filePath, content);
    } catch (err) {
      console.error(`${colors.red}Erro ao ler arquivo ${filePath}: ${err.message}${colors.reset}`);
    }
  });

  printResults();
}

// Executar
main();
