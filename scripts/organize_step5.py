#!/usr/bin/env python3
"""
Reorganiza Step 5 automaticamente
Separa: Lovable (React) | Scripts Python | Dados | Docs

Autor: Claude Code
Data: 19 Dezembro 2025
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

def create_backup():
    """Cria backup antes de reorganizar"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"BACKUP_BEFORE_REORG_{timestamp}"

    print(f"📦 Criando backup: {backup_name}/")
    Path(backup_name).mkdir(exist_ok=True)

    # Lista de arquivos importantes para backup
    important_files = [
        ".env",
        "package.json",
        "package-lock.json",
    ]

    for file in important_files:
        if Path(file).exists():
            shutil.copy2(file, f"{backup_name}/{file}")

    print(f"✅ Backup criado: {backup_name}/")
    return backup_name

def create_folder_structure():
    """Cria estrutura de pastas"""
    folders = {
        "LOVABLE_PROJECT": "Projeto React/TypeScript (Lovable)",
        "SCRIPTS_PYTHON/data_processing": "Scripts Python de processamento",
        "DATA/source": "Dados originais",
        "DATA/processed": "Dados processados para upload",
        "DATA/archives": "Versões antigas de dados",
        "DATABASE/migrations": "SQL migrations e setup",
        "DOCS/setup": "Guias de setup inicial",
        "DOCS/import_guides": "Guias de importação",
        "DOCS/technical": "Documentação técnica",
        "DOCS/reports": "Relatórios e resumos",
        "DOCS/archives": "Documentação antiga",
        "TOOLS": "Ferramentas auxiliares",
    }

    print("\n📁 Criando estrutura de pastas...")
    for folder, description in folders.items():
        Path(folder).mkdir(parents=True, exist_ok=True)

        # Criar README.md em cada pasta
        readme_path = Path(folder) / "README.md"
        if not readme_path.exists():
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(f"# {folder.split('/')[-1]}\n\n{description}\n")

        print(f"  ✓ {folder}/")

    print("✅ Estrutura criada!")

def move_lovable_files():
    """Move arquivos do projeto Lovable"""
    lovable_items = [
        "src",
        "public",
        "supabase",
        "node_modules",
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
        "README.md",
        ".git",
    ]

    print("\n📱 Movendo projeto Lovable...")
    moved = 0
    for item in lovable_items:
        source = Path(item)
        if source.exists():
            dest = Path("LOVABLE_PROJECT") / item
            if source.is_dir():
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(source, dest)
            else:
                shutil.copy2(source, dest)
            print(f"  ✓ {item}")
            moved += 1

    print(f"✅ {moved} itens movidos para LOVABLE_PROJECT/")

def move_python_scripts():
    """Move scripts Python"""
    python_files = [
        "auto_setup_and_upload.py",
        "prepare_for_manual_upload.py",
        "setup_database.py",
        "simple_upload.py",
        "upload_images.py",
        "upload_with_error_handling.py",
    ]

    print("\n🐍 Movendo scripts Python...")
    moved = 0
    for file in python_files:
        source = Path(file)
        if source.exists():
            dest = Path("SCRIPTS_PYTHON/data_processing") / file
            shutil.copy2(source, dest)
            print(f"  ✓ {file}")
            moved += 1

    # Criar requirements.txt
    requirements = """pandas==2.1.0
python-dotenv==1.0.0
supabase==2.0.0
requests==2.31.0
Pillow==10.0.0
"""
    with open("SCRIPTS_PYTHON/requirements.txt", "w") as f:
        f.write(requirements)

    print(f"✅ {moved} scripts movidos + requirements.txt criado")

def move_data_files():
    """Move arquivos de dados"""
    csv_patterns = {
        "LOVABLE_UPLOAD": "DATA/processed",
        "SUPABASE": "DATA/processed",
    }

    print("\n💾 Movendo arquivos de dados...")
    moved = 0

    for file in Path(".").glob("*.csv"):
        for pattern, dest_folder in csv_patterns.items():
            if pattern in file.name:
                dest = Path(dest_folder) / file.name
                shutil.copy2(file, dest)
                print(f"  ✓ {file.name} → {dest_folder}/")
                moved += 1
                break

    # Mover pastas de dados
    data_folders = ["FINAL_242_LEADS", "FINAL_PARA_IMPORT"]
    for folder in data_folders:
        source = Path(folder)
        if source.exists():
            dest = Path("DATA/processed") / folder
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(source, dest)
            print(f"  ✓ {folder}/ → DATA/processed/")
            moved += 1

    print(f"✅ {moved} itens de dados movidos")

def move_database_files():
    """Move arquivos de banco de dados"""
    sql_files = [
        "setup_supabase_tables.sql",
        "fix_rls_policy.sql",
    ]

    print("\n🗄️ Movendo arquivos de banco...")
    moved = 0
    for file in sql_files:
        source = Path(file)
        if source.exists():
            dest = Path("DATABASE/migrations") / file
            shutil.copy2(source, dest)
            print(f"  ✓ {file}")
            moved += 1

    print(f"✅ {moved} arquivos SQL movidos")

def move_documentation():
    """Move documentação"""
    docs_mapping = {
        # Setup guides
        "DOCS/setup": [
            "COMECE_AQUI.txt",
            "GUIA_RAPIDO_UPLOAD.md",
            "GUIA_UPLOAD_LOVABLE.md",
            "INSTRUCOES_UPLOAD_SUPABASE.md",
            "README_UPLOAD.txt",
        ],
        # Import guides
        "DOCS/import_guides": [
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
        "DOCS/technical": [
            "FLOW_IMPROVEMENTS.md",
            "ADDITIONAL_SUGGESTIONS.md",
            "IMPLEMENTATION_SUMMARY.md",
            "ANALISE_DUPLICATAS_E_IMAGENS.md",
            "REORGANIZACAO_SUGERIDA.md",
        ],
        # Reports
        "DOCS/reports": [
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
                shutil.copy2(source, dest)
                print(f"  ✓ {file} → {dest_folder}/")
                moved += 1

    # Mover pasta DOCS antiga se existir
    if Path("DOCS").exists() and Path("DOCS").is_dir():
        for item in Path("DOCS").iterdir():
            if item.is_file() and item.suffix == ".md":
                dest = Path("DOCS/archives") / item.name
                shutil.copy2(item, dest)
                moved += 1

    print(f"✅ {moved} documentos movidos")

def create_main_readme():
    """Cria README.md principal"""
    readme_content = """# Step 5 - Outreach & Campaigns

## 🎯 Estrutura do Projeto (Reorganizada)

```
Step 5/
├─ LOVABLE_PROJECT/     # Aplicação React/TypeScript (frontend)
├─ SCRIPTS_PYTHON/      # Scripts de processamento de dados
├─ DATA/                # Arquivos CSV e dados processados
├─ DATABASE/            # Migrations e setup SQL
├─ DOCS/                # Documentação completa
└─ TOOLS/               # Ferramentas auxiliares
```

## 🚀 Quick Start

### Para desenvolver o frontend (Lovable):
```bash
cd LOVABLE_PROJECT
npm install
npm run dev
```

### Para processar dados:
```bash
cd SCRIPTS_PYTHON
pip install -r requirements.txt
python data_processing/simple_upload.py
```

### Para consultar documentação:
- **Setup inicial**: `DOCS/setup/COMECE_AQUI.md`
- **Importar dados**: `DOCS/import_guides/GUIA_UPLOAD_LOVABLE.md`
- **Melhorias técnicas**: `DOCS/technical/IMPLEMENTATION_SUMMARY.md`

## 📊 Status Atual

- ✅ **Frontend**: Pronto (Lovable project)
- ✅ **Backend**: Supabase configurado
- ✅ **Dados**: 242 leads processados
- ✅ **Documentação**: Completa e organizada

## 📁 Detalhes das Pastas

### LOVABLE_PROJECT/
Projeto React/TypeScript completo, pronto para abrir no Lovable.
Contém todo código fonte, componentes, hooks, utils, etc.

### SCRIPTS_PYTHON/
Scripts Python para processar dados, fazer upload para Supabase,
validar informações, etc.

### DATA/
- `source/` - Dados brutos vindos do Step 4
- `processed/` - CSVs prontos para upload
- `archives/` - Versões antigas (backup)

### DATABASE/
- `migrations/` - Scripts SQL de setup e migrations
- Configurações do Supabase

### DOCS/
Documentação completa dividida por categoria:
- Setup, Import, Technical, Reports

### TOOLS/
Ferramentas auxiliares e scripts de utilidade.

## 🔄 Reorganização

Este projeto foi reorganizado automaticamente em 19/12/2025.
Backup da estrutura anterior: `BACKUP_BEFORE_REORG_*/`

---

**Projeto**: MyLocalInvest Orlando
**Última atualização**: 19 Dezembro 2025
"""

    with open("README_NEW.md", "w", encoding="utf-8") as f:
        f.write(readme_content)

    print("\n📝 README.md principal criado: README_NEW.md")

def main():
    """Função principal"""
    print("=" * 60)
    print("🔄 REORGANIZADOR AUTOMÁTICO - STEP 5")
    print("=" * 60)

    # Confirmação
    print("\n⚠️  ATENÇÃO: Este script vai reorganizar toda a estrutura!")
    print("   Um backup será criado automaticamente.")
    response = input("\n   Deseja continuar? (s/n): ")

    if response.lower() != 's':
        print("\n❌ Operação cancelada pelo usuário.")
        return

    try:
        # 1. Backup
        backup_folder = create_backup()

        # 2. Criar estrutura
        create_folder_structure()

        # 3. Mover arquivos
        move_lovable_files()
        move_python_scripts()
        move_data_files()
        move_database_files()
        move_documentation()

        # 4. Criar README principal
        create_main_readme()

        print("\n" + "=" * 60)
        print("✅ REORGANIZAÇÃO COMPLETA!")
        print("=" * 60)
        print(f"\n📦 Backup: {backup_folder}/")
        print("📝 Novo README: README_NEW.md")
        print("\n⚠️  PRÓXIMOS PASSOS:")
        print("   1. Verificar se tudo está OK")
        print("   2. Renomear README_NEW.md → README.md")
        print("   3. Deletar arquivos antigos da raiz (opcional)")
        print("   4. Commitar mudanças no Git")

    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        print("   O backup está salvo e nenhum arquivo original foi deletado.")

if __name__ == "__main__":
    main()
