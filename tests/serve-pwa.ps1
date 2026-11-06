param([int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
$offline = $false
$release = 'v1'
$failAsset = $false
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        $path = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
        try {
            if ($path -eq '/__pwa-test__/stop') { $response.Close(); break }
            if ($path -eq '/__pwa-test__/offline') { $offline = $true; $response.Close(); continue }
            if ($path -eq '/__pwa-test__/online') { $offline = $false; $response.Close(); continue }
            if ($path -eq '/__pwa-test__/release') {
                $release = $context.Request.QueryString['version']
                $failAsset = $context.Request.QueryString['fail'] -eq 'true'
                $response.Close(); continue
            }
            if ($offline -or ($failAsset -and $path -eq '/SMG/themes.css')) { $response.StatusCode = 503; $response.Close(); continue }
            if (!$path.StartsWith('/SMG/')) { $response.StatusCode = 404; $response.Close(); continue }
            $relative = $path.Substring(5)
            if (!$relative) { $relative = 'index.html' }
            $filePath = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
            if (!$filePath.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar) -or $relative -match '(^|[/\\])\.' -or ![IO.File]::Exists($filePath)) { $response.StatusCode = 404; $response.Close(); continue }
            $response.Headers['Cache-Control'] = 'no-store'
            $response.ContentType = switch ([IO.Path]::GetExtension($filePath)) {
                '.html' { 'text/html; charset=utf-8' }
                '.js' { 'text/javascript; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.webmanifest' { 'application/manifest+json; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png' { 'image/png' }
                default { 'application/octet-stream' }
            }
            if ($relative -eq 'commit.json') {
                $metadata = [IO.File]::ReadAllText($filePath) -replace '^---[\s\S]*?---\s*', ''
                $hash = git -C $projectRoot rev-parse HEAD
                $metadata = $metadata.Replace('{{ site.github.build_revision }}', $hash)
                $body = [Text.Encoding]::UTF8.GetBytes($metadata)
            } elseif ($relative -eq 'sw.js') {
                $worker = [regex]::Replace([IO.File]::ReadAllText($filePath), "const RELEASE = '[^']+';", "const RELEASE = '$release';")
                $body = [Text.Encoding]::UTF8.GetBytes($worker)
            } else { $body = [IO.File]::ReadAllBytes($filePath) }
            $response.ContentLength64 = $body.Length
            $response.OutputStream.Write($body, 0, $body.Length)
            $response.Close()
        } catch { $response.Abort() }
    }
} finally { $listener.Close() }
