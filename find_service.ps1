# Script PowerShell pour trouver le service 'feuille de maintenance' sur Render

$token = "rnd_JncfqMcWKABKdNKiUXBUAIlNeUTD"
$apiUrl = "https://api.render.com/v1"

Write-Host "Recherche du service 'feuille de maintenance'..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept"        = "application/json"
    }
    
    $services = Invoke-RestMethod -Uri "$apiUrl/services" -Method Get -Headers $headers -ErrorAction Stop
    
    $targetService = $services | Where-Object { $_.service.name -like "*feuille*" -or $_.service.name -like "*maintenance*" }
    
    if ($targetService) {
        Write-Host "✅ Service trouvé !" -ForegroundColor Green
        foreach ($s in $targetService) {
            Write-Host "  - Nom: $($s.service.name)" -ForegroundColor White
            Write-Host "  - ID: $($s.service.id)" -ForegroundColor White
            Write-Host "  - Type: $($s.service.type)" -ForegroundColor White
            Write-Host "  - Repo: $($s.service.repo)" -ForegroundColor White
            Write-Host ""
        }
    }
    else {
        Write-Host "❌ Aucune service correspondant trouve." -ForegroundColor Red
        Write-Host "Liste des services disponibles :"
        foreach ($s in $services) {
            Write-Host "  - $($s.service.name)"
        }
    }
    
}
catch {
    Write-Host "Erreur API: $($_.Exception.Message)" -ForegroundColor Red
}
