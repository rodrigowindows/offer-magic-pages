#!/usr/bin/env python3
"""
Reorganiza Step 5 SEM QUEBRAR O LOVABLE
Move apenas arquivos que NÃO são do Lovable (Python, CSVs, Docs extras)
MANTÉM estrutura Lovable intacta na raiz!

Autor: Claude Code
Data: 19 Dezembro 2025
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# ==========================================
# ARQUIVOS QUE LOVABLE PRECISA NA RAIZ
# (NÃO MOVER ESSES!)
# ==========================================
LOVABLE_CRITICAL = {
    # Pastas críticas
    "src",
    "public",
    "supabase",
    "node_modules",
    ".git",

    # Arquivos de config críticos
    "package.json",
    "package-lock.json",
    "bun.lockb",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "tailwind.config.ts",
    "components.json",
    "postcss.config.js",
    "eslint.config.js",
    "index.html",
    ".env",
    ".gitignore",
}

def create_safe_structure():
    """Cria estrutura SEM MOVER projeto Lovable"""
    folders = {
        "scripts": "Scripts Python de processamento",
        "data/processed": "Dados processados para upload",
        "data/archives": "Versões antigas de dados",
        "database": "SQL migrations e setup",
        "docs/setup": "Guias de setup",
        "docs/import": "Guias de importação",
        "docs/technical": "Docs técnicas",
        "docs/reports": "Relatórios",
    }

    print("\nCriando pastas de organizacao...")
    for folder, description in folders.items():
        Path(folder).mkdir(parents=True, exist_ok=True)

        # Criar .gitkeep para manter pasta no git
        gitkeep = Path(folder) / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.touch()

        print(f"  ✓ {folder}/")

    print("✅ Pastas criadas!")

def move_python_scripts():
    """Move scripts Python para scripts/"""
    python_files = [
        "auto_setup_and_upload.py",
        "prepare_for_manual_upload.py",
        "setup_database.py",
        "simple_upload.py",
        "upload_images.py",
        "upload_with_error_handling.py",
        "organize_step5.py",
        "organize_step5_SAFE.py",  # Este próprio script
    ]

    print("\n🐍 Movendo scripts Python...")
    moved = 0
    for file in python_files:
        source = Path(file)
        if source.exists():
            dest = Path("scripts") / file
            shutil.move(source, dest)
            print(f"  ✓ {file} → scripts/")
            moved += 1

    # Criar requirements.txt
    requirements = """# Step 5 - Python Dependencies
pandas>=2.1.0
python-dotenv>=1.0.0
supabase>=2.0.0
requests>=2.31.0
Pillow>=10.0.0
"""
    req_file = Path("scripts/requirements.txt")
    if not req_file.exists():
        with open(req_file, "w") as f:
            f.write(requirements)
        print(f"  ✓ requirements.txt criado")

    print(f"✅ {moved} scripts Python movidos")

def move_data_files():
    """Move CSVs para data/"""
    print("\n💾 Movendo arquivos de dados...")
    moved = 0

    # Move CSVs
    for file in Path(".").glob("*.csv"):
        # Pula se for arquivo crítico do Lovable
        if file.name in LOVABLE_CRITICAL:
            continue

        dest = Path("data/processed") / file.name
        shutil.move(file, dest)
        print(f"  ✓ {file.name} → data/processed/")
        moved += 1

    # Move pastas de dados
    data_folders = ["FINAL_242_LEADS", "FINAL_PARA_IMPORT"]
    for folder in data_folders:
        source = Path(folder)
        if source.exists():
            dest = Path("data/processed") / folder
            if dest.exists():
                shutil.rmtree(dest)
            shutil.move(source, dest)
            print(f"  ✓ {folder}/ → data/processed/")
            moved += 1

    print(f"✅ {moved} itens de dados movidos")

def move_database_files():
    """Move SQLs para database/"""
    sql_files = [
        "setup_supabase_tables.sql",
        "fix_rls_policy.sql",
    ]

    print("\n🗄️ Movendo arquivos SQL...")
    moved = 0
    for file in sql_files:
        source = Path(file)
        if source.exists():
            dest = Path("database") / file
            shutil.move(source, dest)
            print(f"  ✓ {file} → database/")
            moved += 1

    print(f"✅ {moved} arquivos SQL movidos")

def move_documentation():
    """Move documentação para docs/"""
    docs_mapping = {
        # Setup guides
        "docs/setup": [
            "COMECE_AQUI.txt",
            "GUIA_RAPIDO_UPLOAD.md",
            "GUIA_UPLOAD_LOVABLE.md",
            "INSTRUCOES_UPLOAD_SUPABASE.md",
            "README_UPLOAD.txt",
        ],
        # Import guides
        "docs/import": [
            "COMO_IMPORTAR_NO_LOVABLE.md",
            "COMO_AJUSTAR_IMPORT.md",
            "COMO_USAR_UPLOAD_FILTRADO.md",
            "IMPORTAR_AGORA.md",
            "PROMPT_PARA_LOVABLE.md",
            "PROMPT_PARA_LOVABLE_AI.md",
            "PROMPT_UPLOAD_IMAGENS.md",
            "ARQUIVOS_PARA_GIT.txt",
        ],
        # Technical docs
        "docs/technical": [
            "FLOW_IMPROVEMENTS.md",
            "ADDITIONAL_SUGGESTIONS.md",
            "IMPLEMENTATION_SUMMARY.md",
            "ANALISE_DUPLICATAS_E_IMAGENS.md",
            "REORGANIZACAO_SUGERIDA.md",
        ],
        # Reports
        "docs/reports": [
            "RESUMO_FINAL.md",
            "RESUMO_84_PROPERTIES.md",
            "NUMEROS_FINAIS_DEFINITIVOS.md",
            "VERDADE_SOBRE_OS_NUMEROS.md",
            "EXPLICACAO_238_vs_84.md",
        ],
    }

    print("\n📚 Movendo documentação...")
    moved = 0
    for dest_folder, files in docs_mapping.items():
        for file in files:
            source = Path(file)
            if source.exists():
                dest = Path(dest_folder) / file
                shutil.move(source, dest)
                print(f"  ✓ {file} → {dest_folder}/")
                moved += 1

    # Move pasta DOCS antiga
    if Path("DOCS").exists() and Path("DOCS").is_dir():
        dest_docs = Path("docs/archives_old")
        dest_docs.mkdir(parents=True, exist_ok=True)
        shutil.move("DOCS", dest_docs / "DOCS_old")
        print(f"  ✓ DOCS/ → docs/archives_old/")
        moved += 1

    # Move pasta tools se existir
    if Path("tools").exists() and Path("tools").is_dir():
        if not any(Path("tools").iterdir()):  # Se vazia
            Path("tools").rmdir()
        else:
            dest_tools = Path("scripts/tools")
            dest_tools.mkdir(parents=True, exist_ok=True)
            for item in Path("tools").iterdir():
                shutil.move(str(item), str(dest_tools / item.name))
            Path("tools").rmdir()
            print(f"  ✓ tools/ → scripts/tools/")
            moved += 1

    print(f"✅ {moved} documentos movidos")

def create_organization_readme():
    """Cria README sobre a organização"""
    readme_content = """# 📁 Organização de Arquivos

Este projeto foi reorganizado em {date} para separar:

## ✅ Arquivos Lovable (ficaram na raiz)
```
src/                    # Código React/TypeScript
public/                 # Assets públicos
supabase/              # Config Supabase
package.json           # Dependencies
vite.config.ts         # Config Vite
index.html             # Entry point
.env                   # Env vars
etc...
```
**ESTES ARQUIVOS NÃO FORAM MOVIDOS!**
O Lovable funciona normalmente.

## 📦 Arquivos Organizados (movidos para subpastas)

### scripts/
Scripts Python de processamento de dados:
- `simple_upload.py` - Upload simples
- `auto_setup_and_upload.py` - Setup automático
- `upload_images.py` - Upload de imagens
- `requirements.txt` - Python dependencies

### data/
Arquivos CSV e dados:
- `processed/` - CSVs prontos para upload
- `archives/` - Versões antigas

### database/
Migrations SQL:
- `setup_supabase_tables.sql`
- `fix_rls_policy.sql`

### docs/
Documentação organizada:
- `setup/` - Guias de setup inicial
- `import/` - Guias de importação
- `technical/` - Documentação técnica
- `reports/` - Relatórios e análises

## 🚀 Como Usar

### Desenvolver (Lovable):
```bash
npm install
npm run dev
```
**Nada mudou!** Tudo funciona igual.

### Processar Dados:
```bash
cd scripts
pip install -r requirements.txt
python simple_upload.py
```

### Consultar Docs:
- Setup: `docs/setup/COMECE_AQUI.txt`
- Import: `docs/import/GUIA_UPLOAD_LOVABLE.md`
- Technical: `docs/technical/IMPLEMENTATION_SUMMARY.md`

---

**Organizado em**: {date}
**Lovable**: ✅ Funcionando normalmente
""".format(date=datetime.now().strftime("%d/%m/%Y"))

    with open("ORGANIZATION.md", "w", encoding="utf-8") as f:
        f.write(readme_content)

    print("\n📝 ORGANIZATION.md criado")

def verify_lovable_structure():
    """Verifica se estrutura Lovable está intacta"""
    print("\n🔍 Verificando estrutura Lovable...")

    critical_files = [
        "package.json",
        "vite.config.ts",
        "index.html",
        "src",
    ]

    all_ok = True
    for item in critical_files:
        if Path(item).exists():
            print(f"  ✓ {item}")
        else:
            print(f"  ❌ {item} - FALTANDO!")
            all_ok = False

    if all_ok:
        print("✅ Estrutura Lovable intacta!")
    else:
        print("⚠️  ATENÇÃO: Arquivos críticos faltando!")

    return all_ok

def main():
    """Função principal"""
    print("=" * 70)
    print("REORGANIZADOR SEGURO - STEP 5")
    print("(NAO quebra o Lovable - mantem estrutura na raiz)")
    print("=" * 70)

    print("\nO QUE ESTE SCRIPT FAZ:")
    print("   - Move scripts Python -> scripts/")
    print("   - Move CSVs -> data/")
    print("   - Move SQLs -> database/")
    print("   - Move docs extras -> docs/")
    print("\nO QUE ESTE SCRIPT NAO FAZ:")
    print("   - NAO move src/, public/, node_modules/")
    print("   - NAO move package.json, vite.config.ts, etc.")
    print("   - NAO quebra Lovable!")

    response = input("\n   Deseja continuar? (s/n): ")

    if response.lower() != 's':
        print("\n❌ Operação cancelada.")
        return

    try:
        # 1. Criar estrutura
        create_safe_structure()

        # 2. Mover apenas arquivos não-Lovable
        move_python_scripts()
        move_data_files()
        move_database_files()
        move_documentation()

        # 3. Criar README explicativo
        create_organization_readme()

        # 4. Verificar Lovable
        lovable_ok = verify_lovable_structure()

        print("\n" + "=" * 70)
        if lovable_ok:
            print("✅ REORGANIZAÇÃO COMPLETA - LOVABLE INTACTO!")
        else:
            print("⚠️  REORGANIZAÇÃO COM AVISOS - VERIFICAR MANUALMENTE!")
        print("=" * 70)

        print("\n📁 Nova estrutura:")
        print("   scripts/       - Scripts Python")
        print("   data/          - Arquivos CSV")
        print("   database/      - SQL migrations")
        print("   docs/          - Documentação")
        print("\n   src/, package.json, etc. → Mantidos na raiz")
        print("\n📝 Veja: ORGANIZATION.md")

        print("\n🚀 Lovable continua funcionando:")
        print("   npm run dev")

    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        print("   Nenhum arquivo crítico foi movido.")
        print("   Estrutura Lovable deve estar intacta.")

if __name__ == "__main__":
    main()
