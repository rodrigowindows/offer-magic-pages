# 🔧 Solução para Git Lock File

**Problema:** `fatal: Unable to create '.git/index.lock': File exists`

---

## 🎯 **SOLUÇÃO RÁPIDA**

### **Opção 1: Executar Script (RECOMENDADO)**

```powershell
.\fix-git-lock.ps1
```

O script vai:
1. Parar processos Git
2. Verificar processos bloqueando
3. Remover lock file
4. Verificar se foi removido

---

### **Opção 2: Manual (se script não funcionar)**

**1. Feche o Cursor/IDE completamente**

**2. Abra PowerShell como Administrador**

**3. Execute:**
```powershell
cd c:\dev\code\offer-magic-pages
Remove-Item -Force .git\index.lock
```

**4. Se ainda der erro, tente:**
```powershell
# Parar todos os processos Git
Get-Process | Where-Object {$_.ProcessName -like "*git*"} | Stop-Process -Force

# Aguardar 2 segundos
Start-Sleep -Seconds 2

# Remover lock
Remove-Item -Force .git\index.lock
```

---

### **Opção 3: Via Explorador de Arquivos**

1. Feche o Cursor/IDE
2. Abra o Explorador de Arquivos
3. Navegue até: `c:\dev\code\offer-magic-pages\.git\`
4. Delete o arquivo `index.lock` (se existir)
5. Tente novamente: `git add .`

---

## 🔍 **CAUSAS COMUNS**

1. **IDE/Cursor aberto** - O IDE pode estar usando o Git
2. **Processo Git travado** - Um comando Git anterior pode ter travado
3. **Permissões** - Pode precisar de permissões de administrador

---

## ✅ **APÓS REMOVER O LOCK**

```bash
git add .
git commit -m "feat: Add hardcoded ATTOM API key and production testing scripts"
git push
```

---

## ⚠️ **SE AINDA NÃO FUNCIONAR**

1. **Reinicie o computador** (garante que todos os processos sejam encerrados)
2. **Tente via IDE** - Use a interface do Cursor/VSCode para fazer commit
3. **Verifique processos** - Use Task Manager para ver se há processos Git rodando

---

## 📝 **CHECKLIST**

- [ ] Fechei o Cursor/IDE
- [ ] Executei o script `fix-git-lock.ps1`
- [ ] Verifiquei que o lock foi removido
- [ ] Tentei `git add .` novamente
- [ ] Fiz commit e push

---

**Script criado:** `fix-git-lock.ps1`  
**Execute:** `.\fix-git-lock.ps1`
