@echo off
cd /d "%~dp0"
del /f ".git\index.lock" 2>nul
git add src/App.jsx api/sync-results.js
git commit -m "fix: Argentine 3-0 Algerie (pas 3-1)"
git push
echo.
echo Deploiement en cours sur Vercel...
pause
