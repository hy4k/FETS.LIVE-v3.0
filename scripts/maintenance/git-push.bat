@echo off
cd /d c:\Dev\FETS.LIVE-2025-main
git init
git remote remove origin 2>nul
git remote add origin https://github.com/hy4k/FETS.LIVE-2025.git
git add .
git commit -m "FETS Connect implementation with realtime features"
git branch -M main
git push -u origin main --force
pause
