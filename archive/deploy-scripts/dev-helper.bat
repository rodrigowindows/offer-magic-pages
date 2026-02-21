@echo off
REM Development Helper Script for Multi-Agent Collaboration

echo ========================================
echo    Multi-Agent Development Helper
echo ========================================

if "%1"=="status" goto status
if "%1"=="sync" goto sync
if "%1"=="conflict" goto conflict
if "%1"=="feature" goto feature
if "%1"=="review" goto review
if "%1"=="help" goto help

:help
echo Usage: dev-helper.bat [command]
echo.
echo Commands:
echo   status    - Show current git status and recent commits
echo   sync      - Sync with main branch safely
echo   conflict  - Help resolve merge conflicts
echo   feature   - Create new feature branch
echo   review    - Prepare branch for code review
echo   help      - Show this help
goto end

:status
echo === Git Status ===
git status --short
echo.
echo === Recent Commits ===
git log --oneline -5
echo.
echo === Current Branch ===
git branch --show-current
goto end

:sync
echo === Syncing with main branch ===
echo Stashing local changes...
git stash
echo Pulling latest changes...
git checkout main
git pull origin main
echo Returning to your branch...
git checkout -
echo Reapplying your changes...
git stash pop
echo.
echo === Check for conflicts above ===
goto end

:conflict
echo === Merge Conflict Resolution Helper ===
echo.
echo 1. Open conflicting files in your editor
echo 2. Look for conflict markers: <<<<<<<, =======, >>>>>>>
echo 3. Choose which version to keep or merge them
echo 4. Remove conflict markers
echo 5. Stage resolved files: git add [file]
echo 6. Complete merge: git commit
echo.
echo Current conflicts:
git status --porcelain | findstr "^UU"
goto end

:feature
if "%2"=="" (
    echo Usage: dev-helper.bat feature [branch-name]
    goto end
)
echo === Creating Feature Branch ===
git checkout main
git pull origin main
git checkout -b "feature/%2"
echo Created and switched to feature/%2
goto end

:review
echo === Preparing Branch for Review ===
echo.
echo Current branch:
git branch --show-current
echo.
echo Recent commits:
git log --oneline -3
echo.
echo Run these commands to prepare PR:
echo   git push -u origin [current-branch]
echo   Create PR on GitHub/GitLab
goto end

:end
echo.
echo ========================================