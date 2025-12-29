$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\ToDo App.lnk"
$IconPath = "d:\Personal\Code\ToDoList\public\icon.ico"

if (Test-Path $IconPath) {
    Write-Host "Icon found at: $IconPath"
} else {
    Write-Warning "Icon NOT found at: $IconPath"
}

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "d:\Personal\Code\ToDoList\run.bat"
$Shortcut.WorkingDirectory = "d:\Personal\Code\ToDoList"
$Shortcut.IconLocation = "$IconPath" 
$Shortcut.Save()

Write-Host "Shortcut 'ToDo App' created/updated on Desktop."
Write-Host "Target: $($Shortcut.TargetPath)"
Write-Host "Icon: $($Shortcut.IconLocation)"
