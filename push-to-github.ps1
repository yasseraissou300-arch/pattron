#Requires -Version 5.0
# Script pour push Pattron sur GitHub
# Lance : clic droit sur le fichier -> "Exécuter avec PowerShell"

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Push Pattron -> GitHub" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# 1. Aller dans le dossier du projet
Set-Location -Path "C:\Users\HomePC\Desktop\pattron"
Write-Host "[1/6] Dossier : $(Get-Location)" -ForegroundColor Green

# 2. Verifier que git est installe
try {
    $gitVersion = git --version
    Write-Host "[2/6] Git OK : $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR : Git n'est pas installe !" -ForegroundColor Red
    Write-Host "Telecharge-le ici : https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Appuie sur Entree pour fermer"
    exit 1
}

# 3. Supprimer les anciens dossiers .git
Write-Host "[3/6] Nettoyage des anciens .git..." -ForegroundColor Green
Remove-Item -Recurse -Force ".git" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".git_old" -ErrorAction SilentlyContinue

# 4. Configurer git
git config --global user.email "yasseraissou300@gmail.com" 2>$null
git config --global user.name "yasseraissou300-arch" 2>$null
Write-Host "[4/6] Config git OK" -ForegroundColor Green

# 5. Init + commit
Write-Host "[5/6] Creation du commit..." -ForegroundColor Green
git init -b main | Out-Null
git add .
git commit -m "Initial commit: Pattron SaaS" | Out-Null

# 6. Push
Write-Host "[6/6] Push vers GitHub..." -ForegroundColor Green
Write-Host "   (Une fenetre GitHub peut s'ouvrir pour authentification)" -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/yasseraissou300-arch/pattron.git
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "  SUCCESS !" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "Ton code est sur : https://github.com/yasseraissou300-arch/pattron" -ForegroundColor Cyan
    Start-Process "https://github.com/yasseraissou300-arch/pattron"
} else {
    Write-Host ""
    Write-Host "ERREUR lors du push. Verifie la sortie ci-dessus." -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuie sur Entree pour fermer"
