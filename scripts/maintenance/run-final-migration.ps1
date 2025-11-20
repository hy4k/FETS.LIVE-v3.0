# =====================================================
# Run Final Profile Migration Script
# =====================================================
# This script executes the FINAL-MERGE-PROFILES.sql migration
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FETS Profile Migration Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SUPABASE_PROJECT_REF = "qqewusetilxxfvfkmsed"
$SQL_FILE = "FINAL-MERGE-PROFILES.sql"

# Check if SQL file exists
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "❌ Error: $SQL_FILE not found!" -ForegroundColor Red
    Write-Host "   Please ensure the migration file exists in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Migration Details:" -ForegroundColor Yellow
Write-Host "   Project: $SUPABASE_PROJECT_REF" -ForegroundColor White
Write-Host "   SQL File: $SQL_FILE" -ForegroundColor White
Write-Host ""

# Prompt for service role key
Write-Host "🔑 Please enter your Supabase Service Role Key:" -ForegroundColor Yellow
$SUPABASE_SERVICE_ROLE_KEY = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SUPABASE_SERVICE_ROLE_KEY)
$SERVICE_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($SERVICE_KEY)) {
    Write-Host "❌ Error: Service role key is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  WARNING: This will merge profiles → staff_profiles" -ForegroundColor Yellow
Write-Host "   - All foreign keys will be updated" -ForegroundColor Yellow
Write-Host "   - profiles table will be renamed to profiles_deprecated" -ForegroundColor Yellow
Write-Host ""
Write-Host "📦 Recommended: Create a database backup before proceeding!" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting migration..." -ForegroundColor Green
Write-Host ""

# Read SQL file
$sqlContent = Get-Content $SQL_FILE -Raw

# Execute SQL via Supabase REST API
$url = "https://$SUPABASE_PROJECT_REF.supabase.co/rest/v1/rpc/exec_sql"
$headers = @{
    "apikey" = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
}

try {
    # Split SQL into statements and execute
    Write-Host "📝 Executing migration SQL..." -ForegroundColor Cyan
    
    # Use psql if available (better for complex migrations)
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    
    if ($psqlPath) {
        Write-Host "   Using psql for migration..." -ForegroundColor Gray
        $env:PGPASSWORD = $SERVICE_KEY
        $connectionString = "postgresql://postgres:$SERVICE_KEY@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres"
        
        psql $connectionString -f $SQL_FILE
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Migration failed! Check the error messages above." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   psql not found. Please install PostgreSQL client tools." -ForegroundColor Yellow
        Write-Host "   Or run the SQL manually in Supabase SQL Editor." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 SQL file location: $((Get-Location).Path)\$SQL_FILE" -ForegroundColor Cyan
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error executing migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ profiles → staff_profiles merge complete" -ForegroundColor Green
Write-Host "✅ All foreign keys updated" -ForegroundColor Green
Write-Host "✅ profiles table renamed to profiles_deprecated" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test all features (incidents, kudos, vault)" -ForegroundColor White
Write-Host "   2. Verify data integrity" -ForegroundColor White
Write-Host "   3. Monitor for any issues" -ForegroundColor White
Write-Host "   4. After 30 days, drop profiles_deprecated table" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Migration complete!" -ForegroundColor Green
