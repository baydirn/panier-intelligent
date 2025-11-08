# Test automatisé des endpoints API de circulaires
# Usage: .\scripts\test-api-endpoints.ps1

Write-Host "=== Test des API de circulaires Québec/Canada ===" -ForegroundColor Cyan
Write-Host ""

$endpoints = @(
    @{
        Name = "Metro"
        Url = "https://api.metro.ca/flyers?postal_code=H3A1A1"
        Type = "API"
    },
    @{
        Name = "IGA/Sobeys"
        Url = "https://webapi.sobeys.com/flyer/v2/flyers"
        Type = "API"
    },
    @{
        Name = "Walmart"
        Url = "https://www.walmart.ca/api/v2/flyers"
        Type = "API"
    },
    @{
        Name = "Adonis (Flyerify)"
        Url = "https://www.flyerify.com/api/flyers?store=adonis"
        Type = "API"
    },
    @{
        Name = "Maxi"
        Url = "https://www.maxi.ca/food/flyers"
        Type = "HTML"
    },
    @{
        Name = "Provigo"
        Url = "https://www.provigo.ca/food/flyers"
        Type = "HTML"
    },
    @{
        Name = "Super C"
        Url = "https://www.superc.ca/flyers"
        Type = "HTML"
    },
    @{
        Name = "Costco"
        Url = "https://www.costco.ca/flyers"
        Type = "HTML"
    }
)

$headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    "Accept" = "application/json, text/html"
}

foreach ($endpoint in $endpoints) {
    Write-Host "Testant: $($endpoint.Name) [$($endpoint.Type)]" -ForegroundColor Yellow
    Write-Host "URL: $($endpoint.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Headers $headers -Method Get -TimeoutSec 10
        
        $statusCode = $response.StatusCode
        $contentType = $response.Headers['Content-Type']
        $contentLength = $response.Content.Length
        
        if ($statusCode -eq 200) {
            Write-Host "✓ Succès (200 OK)" -ForegroundColor Green
            Write-Host "  Content-Type: $contentType" -ForegroundColor Gray
            Write-Host "  Taille: $contentLength bytes" -ForegroundColor Gray
            
            # Détecter si JSON
            if ($contentType -like "*application/json*") {
                try {
                    $json = $response.Content | ConvertFrom-Json
                    Write-Host "  Format: JSON valide ✓" -ForegroundColor Green
                    
                    # Sauvegarder échantillon
                    $sampleFile = "api-samples/$($endpoint.Name -replace '/', '-').json"
                    New-Item -ItemType Directory -Force -Path "api-samples" | Out-Null
                    $response.Content | Out-File -FilePath $sampleFile -Encoding UTF8
                    Write-Host "  Échantillon sauvegardé: $sampleFile" -ForegroundColor Cyan
                } catch {
                    Write-Host "  ⚠ JSON invalide" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  Format: HTML (scraping requis)" -ForegroundColor Magenta
            }
        } else {
            Write-Host "⚠ Statut: $statusCode" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== Tests terminés ===" -ForegroundColor Cyan
Write-Host "Vérifier le dossier api-samples/ pour les échantillons JSON" -ForegroundColor Gray
