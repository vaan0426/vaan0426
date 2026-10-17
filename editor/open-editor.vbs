Option Explicit
Dim fso, shell, folder, runtime, candidate, nodePath, item, command
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
If Not fso.FileExists(folder & "\server.cjs") Then folder = fso.GetParentFolderName(folder)
runtime = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\OpenAI\Codex\runtimes\cua_node"
nodePath = ""
If fso.FolderExists(runtime) Then
 For Each item In fso.GetFolder(runtime).SubFolders
  candidate = item.Path & "\bin\node.exe"
  If fso.FileExists(candidate) Then nodePath = candidate
 Next
End If
If nodePath = "" Then
 MsgBox "Node.js was not found. Open Codex once and try again.", 48, "Site editor"
 WScript.Quit 1
End If
command = """" & nodePath & """ """ & folder & "\editor\launch.cjs""" & " --editor"
shell.Run command, 0, False
