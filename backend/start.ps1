#!/usr/bin/env pwsh
# Script de démarrage backend pour éviter les problèmes de terminal

$ErrorActionPreference = "Stop"

Write-Host "=== Démarrage Backend Panier Intelligent ===" -ForegroundColor Cyan

# Aller au dossier backend
Set-Location "C:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2\backend"

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] node_modules non trouvé, installation..." -ForegroundColor Yellow
    npm install
}

# Afficher la version Node
Write-Host "[INFO] Node version:" (node -v) -ForegroundColor Green

# Démarrer le serveur
Write-Host "[INFO] Démarrage du serveur..." -ForegroundColor Green
node server.js

# Si on arrive ici, le serveur s'est arrêté
Write-Host "[ERROR] Le serveur s'est arrêté!" -ForegroundColor Red
Read-Host "Appuyez sur Entrée pour fermer"
