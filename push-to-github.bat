@echo off
REM Script pour push Pattron sur GitHub
REM Double-clique pour lancer

cd /d "C:\Users\HomePC\Desktop\pattron"

echo.
echo ===================================
echo   Push Pattron -^> GitHub
echo ===================================
echo.

where git >nul 2>nul
if errorlevel 1 (
    echo ERREUR : Git n'est pas installe !
    echo Telecharge-le ici : https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/5] Nettoyage des anciens .git...
if exist .git rmdir /s /q .git
if exist .git_old rmdir /s /q .git_old

echo [2/5] Configuration git...
git config --global user.email "yasseraissou300@gmail.com"
git config --global user.name "yasseraissou300-arch"

echo [3/5] Initialisation du repo...
git init -b main

echo [4/5] Creation du commit...
git add .
git commit -m "Initial commit: Pattron SaaS"

echo [5/5] Push vers GitHub...
echo    (Une fenetre GitHub peut s'ouvrir pour authentification)
git remote remove origin 2>nul
git remote add origin https://github.com/yasseraissou300-arch/pattron.git
git push -u origin main

if errorlevel 1 (
    echo.
    echo ERREUR lors du push. Verifie la sortie ci-dessus.
) else (
    echo.
    echo ===================================
    echo   SUCCESS !
    echo ===================================
    echo Ton code : https://github.com/yasseraissou300-arch/pattron
    start https://github.com/yasseraissou300-arch/pattron
)

echo.
pause
