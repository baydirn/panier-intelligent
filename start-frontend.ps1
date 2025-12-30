#!/usr/bin/env pwsh
# Script de démarrage frontend pour éviter les problèmes de terminal

$ErrorActionPreference = "Stop"

Write-Host "=== Démarrage Frontend Panier Intelligent ===" -ForegroundColor Cyan

# Aller au dossier racine
Set-Location "C:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2"

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] node_modules non trouvé, installation..." -ForegroundColor Yellow
    npm install
}

# Afficher la version Node
Write-Host "[INFO] Node version:" (node -v) -ForegroundColor Green
Write-Host "[INFO] Vite version:" (npm list vite --depth=0 2>$null | Select-String "vite@") -ForegroundColor Green

# Démarrer Vite
Write-Host "[INFO] Démarrage de Vite..." -ForegroundColor Green
npm run dev

# Si on arrive ici, Vite s'est arrêté
Write-Host "[ERROR] Vite s'est arrêté!" -ForegroundColor Red
Read-Host "Appuyez sur Entrée pour fermer"
