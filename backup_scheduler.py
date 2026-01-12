#!/usr/bin/env python3
"""
Script de Backup Automático do Supabase
Executa backup completo e salva em arquivo local
"""

import requests
import json
import os
from datetime import datetime
import logging

# Configurações
SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/backup-database"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs"

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup_scheduler.log'),
        logging.StreamHandler()
    ]
)

def create_backup_directory():
    """Cria diretório de backup se não existir"""
    backup_dir = "database_backups"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        logging.info(f"Diretorio criado: {backup_dir}")
    return backup_dir

def perform_backup():
    """Executa o backup via Edge Function"""
    try:
        logging.info("Iniciando backup automatico...")

        headers = {
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "includeMetadata": True,
            "format": "json"
        }

        response = requests.post(FUNCTION_URL, json=payload, headers=headers, timeout=300)

        if response.status_code == 200:
            result = response.json()

            if result.get("success"):
                logging.info(f"Backup realizado com sucesso!")
                logging.info(f"Total de registros: {result['totalRecords']}")
                logging.info(f"URL do download: {result.get('downloadUrl', 'N/A')}")

                # Salvar resultado localmente
                backup_dir = create_backup_directory()
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{backup_dir}/backup_result_{timestamp}.json"

                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)

                logging.info(f"Resultado salvo em: {filename}")

                # Se houver URL de download, baixar o arquivo
                if result.get("downloadUrl"):
                    download_response = requests.get(result["downloadUrl"])
                    if download_response.status_code == 200:
                        backup_filename = f"{backup_dir}/backup_data_{timestamp}.json"
                        with open(backup_filename, 'w', encoding='utf-8') as f:
                            f.write(download_response.text)
                        logging.info(f"Arquivo de backup baixado: {backup_filename}")

                return True
            else:
                logging.error(f"Backup falhou: {result.get('error')}")
                return False
        else:
            logging.error(f"Erro HTTP {response.status_code}: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        logging.error(f"Erro de conexao: {e}")
        return False
    except Exception as e:
        logging.error(f"Erro inesperado: {e}")
        return False

def cleanup_old_backups(max_backups=10):
    """Remove backups antigos mantendo apenas os mais recentes"""
    try:
        backup_dir = "database_backups"
        if not os.path.exists(backup_dir):
            return

        # Listar arquivos de backup
        backup_files = [f for f in os.listdir(backup_dir) if f.startswith("backup_")]

        if len(backup_files) > max_backups:
            # Ordenar por data (mais recentes primeiro)
            backup_files.sort(key=lambda x: os.path.getctime(os.path.join(backup_dir, x)), reverse=True)

            # Remover arquivos antigos
            files_to_remove = backup_files[max_backups:]
            for filename in files_to_remove:
                filepath = os.path.join(backup_dir, filename)
                os.remove(filepath)
                logging.info(f"Backup antigo removido: {filename}")

    except Exception as e:
        logging.error(f"Erro na limpeza: {e}")

if __name__ == "__main__":
    logging.info("=" * 50)
    logging.info("INICIO DO BACKUP AUTOMATICO")
    logging.info("=" * 50)

    success = perform_backup()

    if success:
        cleanup_old_backups()
        logging.info("Backup automatico concluido com sucesso!")
    else:
        logging.error("Backup automatico falhou!")

    logging.info("=" * 50)
    logging.info("FIM DO BACKUP AUTOMATICO")
    logging.info("=" * 50)