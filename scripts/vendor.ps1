<#
.SYNOPSIS
  Copies a Dashboard-Style build (dist/) into a project directory and records
  exactly which commit it is, so the copy can be verified later.

.DESCRIPTION
  Windows PowerShell 5.1 and PowerShell 7.

    .\vendor.ps1 <dest>                 download the latest main from GitHub
    .\vendor.ps1 <ref> <dest>           download a branch, tag or commit instead
    .\vendor.ps1 -From <path> <dest>    copy from a local checkout
    .\vendor.ps1 -Check <dest>          verify a vendored copy (exit 1 on mismatch)

  <dest> receives the files of dist/ plus VERSION (version, source, commit)
  and SHA256SUMS (every file in <dest>), written with LF line ends exactly
  like scripts/vendor.sh. <dest> is replaced as a whole and must be missing,
  empty or an earlier vendored copy.

.EXAMPLE
  .\vendor.ps1 vendor\dashboard-style

.EXAMPLE
  .\vendor.ps1 -From ..\Dashboard-Style vendor\dashboard-style

.EXAMPLE
  .\vendor.ps1 -Check vendor\dashboard-style
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)] [string] $Ref,
  [Parameter(Position = 1)] [string] $Dest,
  [string] $From,
  [string] $Check
)

$ErrorActionPreference = 'Stop'
$Repo = 'saschazesiger/Dashboard-Style'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

# [IO.File] resolves relative paths against .NET's current directory, which
# Set-Location does not move: work with absolute paths from here on.
function Get-FullPath([string] $Path) {
  if (-not $Path) { return $Path }
  return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
}
# One positional argument is <dest> (with -From, or for the latest main).
if (-not $Dest -and -not $Check) { $Dest = $Ref; $Ref = $null }
$Dest = Get-FullPath $Dest
$Check = Get-FullPath $Check

function Fail([string] $Message) {
  [Console]::Error.WriteLine("vendor.ps1: $Message")
  exit 1
}

# "<hash>  <path>" lines for every file below $Dir except SHA256SUMS,
# sorted by path in byte order (like the build and vendor.sh).
function Get-Sums([string] $Dir) {
  $root = (Resolve-Path -LiteralPath $Dir).Path.TrimEnd('\', '/')
  $files = Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object { $_.Name -ne 'SHA256SUMS' }
  $entries = foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
    New-Object PSObject -Property @{ Path = $relative; File = $file.FullName }
  }
  $sorted = [string[]]@($entries | ForEach-Object { $_.Path })
  [Array]::Sort($sorted, [StringComparer]::Ordinal)
  $byPath = @{}
  foreach ($entry in $entries) { $byPath[$entry.Path] = $entry.File }
  foreach ($path in $sorted) {
    $hash = (Get-FileHash -LiteralPath $byPath[$path] -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $path"
  }
}

function Test-Dir([string] $Dir) {
  $sumsFile = Join-Path $Dir 'SHA256SUMS'
  if (-not (Test-Path -LiteralPath $sumsFile)) { Fail "$sumsFile not found" }
  # A symbolic link or junction is never part of a copy (SHA256SUMS cannot cover it).
  $links = @(Get-ChildItem -LiteralPath $Dir -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint })
  if ($links.Count) {
    [Console]::Error.WriteLine("vendor.ps1: $Dir contains symbolic links or junctions: $(($links | ForEach-Object { $_.FullName }) -join ', ')")
    return $false
  }
  $expected = ([IO.File]::ReadAllText($sumsFile) -replace "`r", '').TrimEnd("`n")
  $actual = (@(Get-Sums $Dir) -join "`n")
  if ($expected -ne $actual) {
    $e = $expected -split "`n"
    $a = $actual -split "`n"
    [Console]::Error.WriteLine("vendor.ps1: $Dir does not match its SHA256SUMS:")
    Compare-Object $e $a | ForEach-Object { [Console]::Error.WriteLine("  $($_.SideIndicator) $($_.InputObject)") }
    return $false
  }
  return $true
}

# Whether $Dir is a copy this script wrote: VERSION starts with "version "
# and SHA256SUMS lists ds.css. Anything else is never deleted.
function Test-Vendored([string] $Dir) {
  $versionFile = Join-Path $Dir 'VERSION'
  $sumsFile = Join-Path $Dir 'SHA256SUMS'
  if (-not (Test-Path -LiteralPath $versionFile -PathType Leaf) -or -not (Test-Path -LiteralPath $sumsFile -PathType Leaf)) { return $false }
  if (-not ([IO.File]::ReadAllText($versionFile)).StartsWith('version ')) { return $false }
  return [bool](([IO.File]::ReadAllText($sumsFile) -replace "`r", '') -match '(?m)^[0-9a-f]{64}  ds\.css$')
}

function Get-Version([string] $Dir) {
  $pkg = [IO.File]::ReadAllText((Join-Path $Dir 'package.json'))
  if ($pkg -match '"version"\s*:\s*"([^"]+)"') { return $Matches[1] }
  Fail "no version in $Dir/package.json"
}

function Install-Dist([string] $Src, [string] $Target, [string] $Version, [string] $Source, [string] $Commit) {
  $dist = Join-Path $Src 'dist'
  if (-not (Test-Path -LiteralPath (Join-Path $dist 'ds.css'))) { Fail "$dist/ds.css not found (build it with npm run build)" }
  if (-not (Test-Dir $dist)) { Fail "$dist does not match its own SHA256SUMS (rebuild it)" }
  $occupied = (Test-Path -LiteralPath $Target -PathType Leaf) -or ((Test-Path -LiteralPath $Target) -and (Get-ChildItem -LiteralPath $Target -Force | Select-Object -First 1))
  if ($occupied -and -not (Test-Vendored $Target)) {
    Fail "$Target exists and is not a vendored copy (no VERSION, or SHA256SUMS without ds.css); refusing to replace it"
  }
  if (Test-Path -LiteralPath $Target) { Remove-Item -LiteralPath $Target -Recurse -Force }
  New-Item -ItemType Directory -Path $Target -Force | Out-Null
  Copy-Item -Path (Join-Path $dist '*') -Destination $Target -Recurse -Force
  [IO.File]::WriteAllText((Join-Path $Target 'VERSION'), "version $Version`nsource $Source`ncommit $Commit`n", $Utf8)
  $sums = (@(Get-Sums $Target) -join "`n") + "`n"
  [IO.File]::WriteAllText((Join-Path $Target 'SHA256SUMS'), $sums, $Utf8)
  Write-Output "Vendored Dashboard-Style $Version into $Target"
}

if ($Check) {
  if (-not (Test-Dir $Check)) { exit 1 }
  Write-Output "$Check matches its SHA256SUMS"
  exit 0
}

if ($From) {
  if (-not $Dest -or $Ref) { Fail 'usage: vendor.ps1 -From <path> <dest>' }
  $target = $Dest
  $src = (Resolve-Path -LiteralPath $From).Path
  $version = Get-Version $src
  $commit = 'none'
  # Only the checkout's own repository counts, not one it happens to sit in.
  # A plain copy (an unpacked archive) keeps its version, commit "none".
  $top = $null
  try { $top = (& git -C $src rev-parse --show-toplevel 2>$null) } catch { $top = $null }
  if ($top -and ([IO.Path]::GetFullPath($top.Trim()).TrimEnd('\', '/') -eq $src.TrimEnd('\', '/'))) {
    $head = $null
    try { $head = (& git -C $src rev-parse --verify -q HEAD 2>$null) } catch { $head = $null }
    if ($head) {
      $commit = $head.Trim()
      $dirty = (& git -C $src status --porcelain 2>$null)
      if ($dirty) { $commit = "$commit-modified" }
    } else {
      $version = "$version-dev"
    }
  }
  Install-Dist $src $target $version 'local' $commit
  exit 0
}

if (-not $Dest) { Get-Help $MyInvocation.MyCommand.Path; exit 2 }
if (-not $Ref) { $Ref = 'main' }

$work = Join-Path ([IO.Path]::GetTempPath()) ("ds-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $work | Out-Null
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  # Resolve the ref to a commit first and download that commit, so VERSION
  # names exactly what was copied even if main moves in between.
  $commit = (Invoke-WebRequest -Uri "https://api.github.com/repos/$Repo/commits/$Ref" -Headers @{ Accept = 'application/vnd.github.sha' } -UseBasicParsing).Content
  if ($commit -is [byte[]]) { $commit = [Text.Encoding]::ASCII.GetString($commit) }
  $commit = "$commit".Trim()
  if ($commit -notmatch '^[0-9a-f]{40}$') { Fail "unexpected answer resolving $($Ref): $commit" }
  $zip = Join-Path $work 'src.zip'
  $url = "https://github.com/$Repo/archive/$commit.zip"
  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
  Expand-Archive -LiteralPath $zip -DestinationPath $work
  $src = (Get-ChildItem -LiteralPath $work -Directory | Select-Object -First 1).FullName
  Install-Dist $src $Dest (Get-Version $src) "github:$Repo@$Ref" $commit
} finally {
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
