param([switch]$DryRun)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$nodeCommand=Get-Command node.exe -ErrorAction SilentlyContinue
if($nodeCommand){$nodePath=$nodeCommand.Source}else{
 $nodePath=Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\runtimes\cua_node\*\bin\node.exe') -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if(-not $nodePath){throw 'Node runtime not found. See docs/NEWS-AUTOMATION.md.'}
Set-Location -LiteralPath $projectRoot
if($DryRun){& $nodePath --use-system-ca (Join-Path $PSScriptRoot 'news-runner.cjs') --dry-run}else{& $nodePath --use-system-ca (Join-Path $PSScriptRoot 'news-runner.cjs')}
exit $LASTEXITCODE
