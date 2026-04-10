param(
    [string]$Output = "./scripts/migration.sql",
    [string]$From = "0",
    [string]$To = ""
)

$baseCommand = "dotnet ef migrations script $From"

if (-not [string]::IsNullOrWhiteSpace($To)) {
    $baseCommand += " $To"
}

$baseCommand += " --idempotent --output $Output --project ./Zad.Infrastructure/Zad.Infrastructure.csproj --startup-project ./Zad.API/Zad.API.csproj"

Write-Host "Generating idempotent migration script to $Output ..."
Invoke-Expression $baseCommand
