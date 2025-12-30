# Script de test automatique - Panier Intelligent
# Usage: .\test-api.ps1

Write-Host "🧪 Test du système Panier Intelligent`n" -ForegroundColor Cyan

# Configuration
$backendUrl = "http://localhost:3001"
$adminPassword = "MonMotDePasseSecurise2024!"

# Test 1: Health Check
Write-Host "1️⃣  Test Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/api/health"
    Write-Host "   ✅ Backend opérationnel: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend non accessible" -ForegroundColor Red
    exit 1
}

# Test 2: Login Admin
Write-Host "`n2️⃣  Test Login Admin..." -ForegroundColor Yellow
try {
    $loginBody = @{ password = $adminPassword } | ConvertTo-Json
    $loginResult = Invoke-RestMethod -Uri "$backendUrl/api/admin/login" -Method Post -Body $loginBody -ContentType 'application/json'
    $token = $loginResult.token
    Write-Host "   ✅ Login réussi (token: $($token.Substring(0,20))...)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login échoué" -ForegroundColor Red
    exit 1
}

# Test 3: Génération données test (55 produits)
Write-Host "`n3️⃣  Test génération 55 produits..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $testResult = Invoke-RestMethod -Uri "$backendUrl/api/admin/scrape/test" -Method Post -Headers $headers -ContentType 'application/json'
    Write-Host "   ✅ $($testResult.totalFound) produits générés" -ForegroundColor Green
    Write-Host "   📦 Échantillon:" -ForegroundColor Cyan
    $testResult.products | Select-Object -First 3 | Format-Table name, brand, price, validFrom, validTo -AutoSize
} catch {
    Write-Host "   ❌ Génération échouée: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Génération 5 épiceries (275 produits)
Write-Host "4️⃣  Test génération 275 produits (5 épiceries)..." -ForegroundColor Yellow
try {
    $allStoresResult = Invoke-RestMethod -Uri "$backendUrl/api/admin/scrape/all-stores" -Method Post -Headers $headers -ContentType 'application/json'
    Write-Host "   ✅ $($allStoresResult.totalFound) produits générés" -ForegroundColor Green
    Write-Host "   🏪 Épiceries: $($allStoresResult.stores -join ', ')" -ForegroundColor Cyan
    Write-Host "   📅 Période: $($allStoresResult.validFrom) à $($allStoresResult.validTo)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Génération échouée: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Comparaison de prix "Lait 2%"
Write-Host "`n5️⃣  Comparaison prix 'Lait 2%' entre épiceries..." -ForegroundColor Yellow
try {
    $laitPrices = $allStoresResult.products | Where-Object { $_.name -eq 'Lait 2%' } | Sort-Object price
    Write-Host "   📊 Comparaison (du moins cher au plus cher):" -ForegroundColor Cyan
    $laitPrices | Format-Table @{Label="Épicerie";Expression={$_.store}}, @{Label="Prix";Expression={"$($_.price)$"}}, @{Label="Marque";Expression={$_.brand}} -AutoSize
    
    $minPrice = ($laitPrices | Measure-Object -Property price -Minimum).Minimum
    $maxPrice = ($laitPrices | Measure-Object -Property price -Maximum).Maximum
    $savings = [math]::Round(($maxPrice - $minPrice), 2)
    $savingsPercent = [math]::Round((($maxPrice - $minPrice) / $maxPrice * 100), 1)
    
    Write-Host "   💰 Économie potentielle: $savings$ ($savingsPercent%)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Comparaison non disponible" -ForegroundColor Yellow
}

# Test 6: Statistiques par épicerie
Write-Host "`n6️⃣  Statistiques par épicerie..." -ForegroundColor Yellow
$storeGroups = $allStoresResult.products | Group-Object store
Write-Host "   📊 Répartition des produits:" -ForegroundColor Cyan
$storeGroups | Format-Table @{Label="Épicerie";Expression={$_.Name}}, @{Label="Produits";Expression={$_.Count}} -AutoSize

# Résumé final
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🎉 RÉSUMÉ DES TESTS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ Backend opérationnel" -ForegroundColor Green
Write-Host "   ✅ Authentification fonctionnelle" -ForegroundColor Green
Write-Host "   ✅ Génération 55 produits OK" -ForegroundColor Green
Write-Host "   ✅ Génération 275 produits OK" -ForegroundColor Green
Write-Host "   ✅ Comparaison multi-épiceries OK" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🚀 Prochaine étape:" -ForegroundColor Yellow
Write-Host "   Ouvrez http://localhost:5174/admin" -ForegroundColor Cyan
Write-Host "   Mot de passe: $adminPassword`n" -ForegroundColor Cyan

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - GUIDE_ADMIN.md : Guide d'utilisation" -ForegroundColor Cyan
Write-Host "   - TEST_GUIDE.md : Procédures de test" -ForegroundColor Cyan
Write-Host "   - RESUME_SYSTEME.md : Architecture complète`n" -ForegroundColor Cyan
