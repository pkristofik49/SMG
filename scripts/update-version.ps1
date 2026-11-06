$ErrorActionPreference = 'Stop'
$root = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'Run versioning inside the Git repository' }
git diff --quiet -- js/version.js sw.js commit.json
if ($LASTEXITCODE -ne 0) { throw 'Stage changes to js/version.js and sw.js before committing so versioning does not stage unrelated edits' }
$trackedVersion = git ls-tree --name-only HEAD -- js/version.js
$version = '1.000'
if ($trackedVersion) {
    $previous = (git show HEAD:js/version.js) -join "`n"
    if ($previous -notmatch "ArcadeVersion = '(\d+)\.(\d{3})';") { throw 'Invalid committed application version' }
    $number = [long]$Matches[1] * 1000 + [long]$Matches[2] + 1
    $version = '{0}.{1:D3}' -f [long][Math]::Floor($number / 1000), [long]($number % 1000)
}
$workerPath = Join-Path $root 'sw.js'
$worker = [IO.File]::ReadAllText($workerPath)
if ($worker -notmatch "const RELEASE = '[^']+';") { throw 'Service worker release declaration not found' }
$worker = [regex]::Replace($worker, "const RELEASE = '[^']+';", "const RELEASE = '$version';")
$versionSource = "/* The pre-commit hook derives this value from the previous committed version. */`nglobalThis.ArcadeVersion = '$version';`n"
[IO.File]::WriteAllText((Join-Path $root 'js/version.js'), $versionSource, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText($workerPath, $worker, [Text.UTF8Encoding]::new($false))
$metadataPath = Join-Path $root 'commit.json'
$metadata = [IO.File]::ReadAllText($metadataPath)
$metadata = [regex]::Replace($metadata, '"version":"[^"]+"', ('"version":"' + $version + '"'))
[IO.File]::WriteAllText($metadataPath, $metadata, [Text.UTF8Encoding]::new($false))
git add -- js/version.js sw.js commit.json
if ($LASTEXITCODE -ne 0) { throw 'Could not stage application version' }
Write-Output "Application version: $version"
