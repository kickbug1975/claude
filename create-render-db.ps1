# Script PowerShell pour creer une nouvelle base de donnees PostgreSQL sur Render

$token = "rnd_JncfqMcWKABKdNKiUXBUAIlNeUTD"
$apiUrl = "https://api.render.com/v1"
$ownerId = "tea-d5lqn2lactks73bt1oig"

Write-Host "Creation d'une nouvelle base de donnees PostgreSQL sur Render..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    # Configuration de la base de donnees
    $dbConfig = @{
        name = "claude-postgres-db"
        ownerId = $ownerId
        plan = "free"
        region = "frankfurt"
        databaseName = "maintenance_db"
        databaseUser = "postgres"
    } | ConvertTo-Json
    
    Write-Host "Configuration de la base de donnees:" -ForegroundColor Yellow
    Write-Host $dbConfig -ForegroundColor White
    Write-Host ""
    
    Write-Host "Envoi de la requete a l'API Render..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$apiUrl/postgres" -Method Post -Headers $headers -Body $dbConfig -ErrorAction Stop
    
    Write-Host ""
    Write-Host "Base de donnees creee avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informations de la base de donnees:" -ForegroundColor Cyan
    Write-Host "  - ID: $($response.id)" -ForegroundColor White
    Write-Host "  - Nom: $($response.name)" -ForegroundColor White
    Write-Host "  - Database: $($response.databaseName)" -ForegroundColor White
    Write-Host "  - User: $($response.databaseUser)" -ForegroundColor White
    Write-Host "  - Region: $($response.region)" -ForegroundColor White
    Write-Host "  - Plan: $($response.plan)" -ForegroundColor White
    Write-Host "  - Status: $($response.status)" -ForegroundColor White
    Write-Host ""
    
    # Attendre quelques secondes pour que la base soit initialisee
    Write-Host "Attente de l'initialisation de la base de donnees (10 secondes)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Recuperer les informations de connexion
    Write-Host "Recuperation des informations de connexion..." -ForegroundColor Yellow
    try {
        $dbDetails = Invoke-RestMethod -Uri "$apiUrl/postgres/$($response.id)" -Method Get -Headers $headers -ErrorAction Stop
        
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
        Write-Host "Les informations de connexion seront disponibles dans quelques minutes." -ForegroundColor Yellow
        Write-Host "Verifiez sur https://dashboard.render.com" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "  1. Mettez a jour server/.env avec DATABASE_URL" -ForegroundColor White
    Write-Host "  2. Executez: cd server && npx prisma db push" -ForegroundColor White
    Write-Host "  3. Testez: node test-db.js" -ForegroundColor White
    
} catch {
    Write-Host "Erreur lors de la creation de la base de donnees:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details de l'erreur:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Solutions possibles:" -ForegroundColor Yellow
    Write-Host "  1. Une base de donnees existe peut-etre deja" -ForegroundColor White
    Write-Host "  2. Verifiez les quotas de votre compte Render (max 1 DB gratuite)" -ForegroundColor White
    Write-Host "  3. Creez la base manuellement sur https://dashboard.render.com" -ForegroundColor White
    
    exit 1
}
