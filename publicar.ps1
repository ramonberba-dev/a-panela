# Publica a Área do participante da Panela no GitHub Pages (ramonberba-dev/a-panela).
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path .git)) {
  git init -b main
  git remote add origin https://github.com/ramonberba-dev/a-panela.git
}
git config user.name "Ramon Berba"
git add -A
git commit -m "Area do participante da Panela"
git push -u origin main
Write-Host "PUBLICADO"
