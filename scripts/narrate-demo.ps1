param([Parameter(Mandatory=$true)][string]$TextFile,[Parameter(Mandatory=$true)][string]$OutputFile)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $speech.SetOutputToWaveFile([System.IO.Path]::GetFullPath($OutputFile))
  $speech.Speak([System.IO.File]::ReadAllText([System.IO.Path]::GetFullPath($TextFile)))
} finally { $speech.Dispose() }
