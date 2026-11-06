param([int]$Port = 8765, [int]$DebugPort = 9223)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$profile = Join-Path $root ('.browser-pwa-' + [DateTime]::UtcNow.Ticks)
$edge = Start-Process -FilePath 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--headless','--disable-gpu','--no-first-run','--no-default-browser-check',"--remote-debugging-port=$DebugPort","--user-data-dir=$profile","http://localhost:$Port/SMG/tests/pwa.html" -WindowStyle Hidden -PassThru
$socket = New-Object Net.WebSockets.ClientWebSocket
try {
    $target = $null
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        try {
            $targets = Invoke-RestMethod "http://localhost:$DebugPort/json"
            $target = $targets | Where-Object { $_.type -eq 'page' -and $_.url -like '*tests/pwa.html' } | Select-Object -First 1
        } catch {}
        if ($target) { break }
        Start-Sleep -Milliseconds 250
    }
    if (!$target) { throw 'Could not connect to the PWA test browser' }
    $null = $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    $id = 0
    for ($attempt = 0; $attempt -lt 180; $attempt++) {
        $id++
        $message = @{ id = $id; method = 'Runtime.evaluate'; params = @{ expression = "document.getElementById('results')?.textContent"; returnByValue = $true } } | ConvertTo-Json -Depth 5 -Compress
        $bytes = [Text.Encoding]::UTF8.GetBytes($message)
        $null = $socket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
        do {
            $stream = New-Object IO.MemoryStream
            do {
                $buffer = New-Object byte[] 65536
                $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
                $stream.Write($buffer, 0, $received.Count)
            } while (!$received.EndOfMessage)
            $reply = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
            $stream.Dispose()
        } while ($reply.id -ne $id)
        $result = $reply.result.result.value
        if ($result -and $result -ne 'RUNNING') {
            $result
            if ($result -match '(?m)^FAIL ') { exit 1 }
            exit 0
        }
        Start-Sleep -Milliseconds 500
    }
    throw 'PWA tests did not finish within 90 seconds'
} finally {
    $socket.Dispose()
    Stop-Process -Id $edge.Id -ErrorAction SilentlyContinue
}
