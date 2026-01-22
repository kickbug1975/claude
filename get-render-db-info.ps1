# Script PowerShell pour recuperer les details de la base de donnees PostgreSQL existante

$token = "rnd_JncfqMcWKABKdNKiUXBUAIlNeUTD"
$apiUrl = "https://api.render.com/v1"

Write-Host "Recuperation des details de la base de donnees PostgreSQL..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
    }
    
    # Recuperer la liste des bases de donnees
    $databases = Invoke-RestMethod -Uri "$apiUrl/postgres" -Method Get -Headers $headers -ErrorAction Stop
    
    if ($databases.Count -gt 0) {
        Write-Host "Base de donnees PostgreSQL trouvee!" -ForegroundColor Green
        Write-Host ""
        
        foreach ($db in $databases) {
            Write-Host "Informations de la base de donnees:" -ForegroundColor Cyan
            Write-Host "  - ID: $($db.id)" -ForegroundColor White
            Write-Host "  - Nom: $($db.name)" -ForegroundColor White
            Write-Host "  - Database Name: $($db.databaseName)" -ForegroundColor White
            Write-Host "  - User: $($db.databaseUser)" -ForegroundColor White
            Write-Host "  - Region: $($db.region)" -ForegroundColor White
            Write-Host "  - Plan: $($db.plan)" -ForegroundColor White
            Write-Host "  - Status: $($db.status)" -ForegroundColor White
            Write-Host ""
            
            # Recuperer les informations de connexion
            if ($db.id) {
                Write-Host "Recuperation des informations de connexion..." -ForegroundColor Yellow
                try {
                    $dbDetails = Invoke-RestMethod -Uri "$apiUrl/postgres/$($db.id)" -Method Get -Headers $headers -ErrorAction Stop
                    
                    if ($dbDetails.connectionInfo) {
                        Write-Host ""
                        Write-Host "Informations de connexion:" -ForegroundColor Green
                        Write-Host "  - Internal URL: $($dbDetails.connectionInfo.internalConnectionString)" -ForegroundColor White
                        Write-Host "  - External URL: $($dbDetails.connectionInfo.externalConnectionString)" -ForegroundColor White
                        Write-Host ""
                        Write-Host "Copiez cette URL dans votre fichier server/.env:" -ForegroundColor Yellow
                        Write-Host "DATABASE_URL=`"$($dbDetails.connectionInfo.internalConnectionString)`"" -ForegroundColor Green
                        Write-Host ""
                        
                        # Sauvegarder dans un fichier
                        $envContent = "DATABASE_URL=`"$($dbDetails.connectionInfo.internalConnectionString)`""
                        $envContent | Out-File -FilePath "server\.env.render" -Encoding UTF8
                        Write-Host "URL sauvegardee dans server\.env.render" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "Impossible de recuperer les details: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "Aucune base de donnees PostgreSQL trouvee." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Pour creer une nouvelle base de donnees:" -ForegroundColor Cyan
        Write-Host "  1. Allez sur https://dashboard.render.com" -ForegroundColor White
        Write-Host "  2. Cliquez sur 'New +' puis 'PostgreSQL'" -ForegroundColor White
        Write-Host "  3. Nom: claude-postgres-db" -ForegroundColor White
        Write-Host "  4. Database: maintenance_db" -ForegroundColor White
        Write-Host "  5. Region: Frankfurt" -ForegroundColor White
        Write-Host "  6. Plan: Free" -ForegroundColor White
    }
    
} catch {
    Write-Host "Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "  1. Mettez a jour server/.env avec DATABASE_URL" -ForegroundColor White
Write-Host "  2. Executez: cd server && npx prisma db push" -ForegroundColor White
Write-Host "  3. Testez: node test-db.js" -ForegroundColor White
