@echo off
echo ========================================
echo   FETS Profile Migration
echo ========================================
echo.
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM2MjY1NSwiZXhwIjoyMDcwOTM4NjU1fQ.LJePJfsskt3HvoJvo9cWWDGaE0fOstb0tlmyYm5sWPo
node execute-migration.js
pause
