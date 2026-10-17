$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$taskName='PsychologyJane-News-Monday-Thursday'
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($existing){
 $dest=Join-Path $projectRoot ('backups\before-news-task-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
 New-Item -ItemType Directory -Path $dest -Force | Out-Null
 $xml=Export-ScheduledTask -TaskName $taskName
 $target=Join-Path $dest 'scheduled-task.xml'
 [IO.File]::WriteAllText($target,$xml,[Text.UTF8Encoding]::new($false))
 if([IO.File]::ReadAllText($target,[Text.Encoding]::UTF8) -ne $xml){throw 'Task backup verification failed'}
}
if((Get-TimeZone).Id -ne 'FLE Standard Time'){throw 'Expected Sofia timezone (FLE Standard Time); schedule not installed.'}
$runner=Join-Path $PSScriptRoot 'run-news.ps1'
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$runner+'"') -WorkingDirectory $projectRoot
$trigger=New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Thursday -At '09:00'
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 25) -MultipleInstances IgnoreNew -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 15)
$principal=New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Psychology Jane: verified Bulgarian psychology research news, Monday and Thursday 09:00 Sofia. Local computer and signed-in user required.' -Force | Select-Object TaskName,State
Get-ScheduledTaskInfo -TaskName $taskName | Select-Object NextRunTime,LastRunTime,LastTaskResult
