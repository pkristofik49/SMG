$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fixture = Join-Path $root ('.browser-version-' + [DateTime]::UtcNow.Ticks)
$null = [IO.Directory]::CreateDirectory($fixture)
git -C $fixture init --quiet
git -C $fixture config user.name 'Version test'
git -C $fixture config user.email 'version-test@example.invalid'
git -C $fixture config core.autocrlf false
[IO.File]::WriteAllText((Join-Path $fixture 'seed.txt'), 'Initial fixture')
git -C $fixture add seed.txt
git -C $fixture commit --quiet -m 'Initialize test fixture'
foreach ($relative in @('js/version.js', 'sw.js', '.githooks/pre-commit', 'scripts/update-version.ps1')) {
    $target = Join-Path $fixture $relative
    $null = [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))
    [IO.File]::Copy((Join-Path $root $relative), $target)
}
git -C $fixture config core.hooksPath .githooks
git -C $fixture add .
git -C $fixture commit --quiet -m 'Start application versioning'
if ($LASTEXITCODE -ne 0) { throw 'Initial version commit failed' }
if ([IO.File]::ReadAllText((Join-Path $fixture 'js/version.js')) -notmatch "'1.000'") { throw 'Initial version must be 1.000' }
'PASS Initial commit starts at 1.000'
git -C $fixture commit --quiet --allow-empty -m 'Increment application version'
if ($LASTEXITCODE -ne 0) { throw 'Version increment failed' }
if ([IO.File]::ReadAllText((Join-Path $fixture 'js/version.js')) -notmatch "'1.001'") { throw 'Second version must be 1.001' }
if ([IO.File]::ReadAllText((Join-Path $fixture 'sw.js')) -notmatch "RELEASE = '1.001'") { throw 'Worker release must match the application version' }
'PASS Next commit increments once and synchronizes the PWA cache'
[IO.File]::AppendAllText((Join-Path $fixture 'sw.js'), "`n// An unstaged fixture change.`n")
$savedErrorPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$rejected = git -C $fixture commit --quiet --allow-empty -m 'Reject unstaged worker changes' 2>&1
$rejectedCode = $LASTEXITCODE
$ErrorActionPreference = $savedErrorPreference
if ($rejectedCode -eq 0) { throw 'Unstaged worker changes should stop the hook' }
if ([IO.File]::ReadAllText((Join-Path $fixture 'js/version.js')) -notmatch "'1.001'") { throw 'A rejected commit must not consume a version number' }
'PASS Unstaged worker edits stop the commit without consuming a version'
git -C $fixture add sw.js
git -C $fixture commit --quiet -m 'Retry after staging the worker'
if ($LASTEXITCODE -ne 0) { throw 'Commit retry failed' }
if ([IO.File]::ReadAllText((Join-Path $fixture 'js/version.js')) -notmatch "'1.002'") { throw 'Retried version must be 1.002' }
if (git -C $fixture status --porcelain) { throw 'Versioning left uncommitted changes' }
'PASS Retried commit increments exactly once and leaves a clean tree'
