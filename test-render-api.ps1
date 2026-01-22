# Script PowerShell pour tester l'API Render et lister les services existants

$token = "rnd_JncfqMcWKABKdNKiUXBUAIlNeUTD"
$apiUrl = "https://api.render.com/v1"

Write-Host "Test de connexion a l'API Render..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
    }
    
    # Tester avec l'endpoint /owners
    Write-Host "1. Test de l'endpoint /owners..." -ForegroundColor Yellow
    try {
        $owners = Invoke-RestMethod -Uri "$apiUrl/owners" -Method Get -Headers $headers -ErrorAction Stop
        Write-Host "   Succes! Vous avez acces a l'API Render" -ForegroundColor Green
        Write-Host "   Owner ID: $($owners[0].owner.id)" -ForegroundColor White
        $ownerId = $owners[0].owner.id
    } catch {
        Write-Host "   Echec: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Lister les services existants
    Write-Host "2. Liste des services existants..." -ForegroundColor Yellow
    try {
        $services = Invoke-RestMethod -Uri "$apiUrl/services" -Method Get -Headers $headers -ErrorAction Stop
        Write-Host "   Nombre de services: $($services.Count)" -ForegroundColor Green
        foreach ($service in $services) {
            Write-Host "   - $($service.service.name) ($($service.service.type))" -ForegroundColor White
        }
    } catch {
        Write-Host "   Echec: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Lister les bases de donnees PostgreSQL existantes
    Write-Host "3. Liste des bases de donnees PostgreSQL..." -ForegroundColor Yellow
    try {
        $databases = Invoke-RestMethod -Uri "$apiUrl/postgres" -Method Get -Headers $headers -ErrorAction Stop
        Write-Host "   Nombre de bases de donnees: $($databases.Count)" -ForegroundColor Green
        foreach ($db in $databases) {
            Write-Host "   - $($db.name) (Region: $($db.region), Status: $($db.status))" -ForegroundColor White
        }
    } catch {
        Write-Host "   Echec: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Code d'erreur: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Informations de l'API:" -ForegroundColor Cyan
    Write-Host "  - Base URL: $apiUrl" -ForegroundColor White
    Write-Host "  - Token: rnd_...$(($token.Substring($token.Length - 10)))" -ForegroundColor White
    
} catch {
    Write-Host "Erreur generale:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Pour creer une base de donnees manuellement:" -ForegroundColor Yellow
Write-Host "  1. Allez sur https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Cliquez sur 'New +' puis 'PostgreSQL'" -ForegroundColor White
Write-Host "  3. Configurez avec les parametres du fichier render.yaml" -ForegroundColor White
