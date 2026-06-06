Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$ProgressPreference = 'SilentlyContinue'

# ============================================================
# SCRIPT DE ACTUALIZACION DE APP JARDINES SANTA ANA
# ============================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.ini"
$script:splashAction = "Continue"

# ============================================================
# SPLASH SCREEN
# ============================================================

function Show-Splash {
    $logoPath = Join-Path $scriptDir "logo-cementerio.png"

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Jardines - Comprobando actualizaciones"
    $form.Size = New-Object System.Drawing.Size(380, 270)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.ControlBox = $false
    $form.TopMost = $true

    if (Test-Path $logoPath) {
        try {
            $logo = [System.Drawing.Image]::FromFile($logoPath)
            $logoBox = New-Object System.Windows.Forms.PictureBox
            $logoBox.Image = $logo
            $logoBox.SizeMode = "Zoom"
            $logoBox.Size = New-Object System.Drawing.Size(200, 100)
            $logoBox.Location = New-Object System.Drawing.Point(90, 25)
            $form.Controls.Add($logoBox)
        }
        catch { }
    }

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Comprobando actualizaciones..."
    $label.Location = New-Object System.Drawing.Point(30, 155)
    $label.Size = New-Object System.Drawing.Size(310, 25)
    $label.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
    $label.TextAlign = "MiddleCenter"
    $form.Controls.Add($label)

    $btnConfig = New-Object System.Windows.Forms.Button
    $btnConfig.Text = "Configuración"
    $btnConfig.Location = New-Object System.Drawing.Point(135, 195)
    $btnConfig.Size = New-Object System.Drawing.Size(105, 30)
    $btnConfig.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $btnConfig.Add_Click({
        $script:splashAction = "Config"
        $form.Close()
    })
    $form.Controls.Add($btnConfig)

    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 2500
    $timer.Add_Tick({
        $timer.Stop()
        $form.Close()
    })
    $timer.Start()

    $form.ShowDialog() | Out-Null
    if ($logo) { $logo.Dispose() }
}

# ============================================================
# HELPER FUNCTIONS
# ============================================================

function Read-Config {
    if (-not (Test-Path $configPath)) {
        $defaults = @"
[Settings]
BackendURL=http://localhost/jardines-backend/public/api
AppPath=%LOCALAPPDATA%\Jardines
ExeName=Jardines Santa Ana.exe
"@
        Set-Content -Path $configPath -Value $defaults -Encoding UTF8
        $result = [System.Windows.Forms.MessageBox]::Show(
            "Se ha creado el archivo de configuración con valores por defecto:`n`n  BackendURL: http://localhost/jardines-backend/public/api`n  AppPath: %LOCALAPPDATA%\Jardines`n  ExeName: Jardines Santa Ana.exe`n`n`¿Desea continuar con estos valores?`n(Seleccione 'No' para editar el archivo manualmente.)",
            "Configuración inicial",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($result -eq "No") {
            Start-Process notepad.exe $configPath
            exit
        }
    }

    $config = @{}
    $content = Get-Content -Path $configPath -Encoding UTF8
    foreach ($line in $content) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^\[.+\]$' -or $trimmed -eq '' -or $trimmed -match '^[;#]') { continue }
        if ($trimmed -match '^(.+?)\s*=\s*(.+)$') {
            $config[$matches[1]] = $matches[2]
        }
    }
    return $config
}

function Expand-PathVariables($path) {
    return [Environment]::ExpandEnvironmentVariables($path)
}

function Get-RemoteVersion($backendUrl) {
    try {
        $url = "$backendUrl/configuracion/version"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
        if ($response -and $response.filename -and $response.download_url) {
            $filename = $response.filename
            if ($filename -match '^(v\d+\.\d+\.\d+)\.zip$') {
                return @{ success = $true; version = $matches[1]; downloadUrl = $response.download_url }
            }
        }
        return @{ success = $false; error = "El servidor no devolvió un nombre de versión válido." }
    }
    catch {
        $errMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $errMsg = "HTTP $statusCode - $errMsg"
        }
        return @{ success = $false; error = $errMsg }
    }
}

function Get-LocalVersion($appPath) {
    $versionFile = Join-Path $appPath "app-version.txt"
    if (Test-Path $versionFile) {
        $content = (Get-Content -Path $versionFile -Encoding UTF8).Trim()
        if ($content -match '^v\d+\.\d+\.\d+$') {
            return $content
        }
    }
    return $null
}

function Compare-Versions($v1, $v2) {
    $v1 = $v1 -replace '^v', ''
    $v2 = $v2 -replace '^v', ''
    $parts1 = [int[]]($v1 -split '\.')
    $parts2 = [int[]]($v2 -split '\.')
    for ($i = 0; $i -lt 3; $i++) {
        if ($parts1[$i] -gt $parts2[$i]) { return 1 }
        if ($parts1[$i] -lt $parts2[$i]) { return -1 }
    }
    return 0
}

function Install-App($appPath, $exeName, $downloadUrl, $version) {
    $tempZip = Join-Path $env:TEMP "jardines-update.zip"
    $tempExtract = Join-Path $env:TEMP "jardines-extract"

    if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }

    if (-not (Test-Path $appPath)) {
        New-Item -ItemType Directory -Path $appPath -Force | Out-Null
    }

    $script:downloadError = $null

    $dlForm = New-Object System.Windows.Forms.Form
    $dlForm.Text = "Jardines - Actualizando"
    $dlForm.Size = New-Object System.Drawing.Size(380, 140)
    $dlForm.StartPosition = "CenterScreen"
    $dlForm.FormBorderStyle = "FixedDialog"
    $dlForm.MaximizeBox = $false
    $dlForm.MinimizeBox = $false
    $dlForm.ControlBox = $false
    $dlForm.TopMost = $true

    $dlLabel = New-Object System.Windows.Forms.Label
    $dlLabel.Text = "Descargando actualizaci´on..."
    $dlLabel.Location = New-Object System.Drawing.Point(20, 18)
    $dlLabel.Size = New-Object System.Drawing.Size(330, 25)
    $dlLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $dlLabel.TextAlign = "MiddleCenter"
    $dlForm.Controls.Add($dlLabel)

    $dlProgress = New-Object System.Windows.Forms.ProgressBar
    $dlProgress.Location = New-Object System.Drawing.Point(20, 55)
    $dlProgress.Size = New-Object System.Drawing.Size(330, 25)
    $dlProgress.Style = "Marquee"
    $dlForm.Controls.Add($dlProgress)

    $wc = New-Object System.Net.WebClient

    $wc.Add_DownloadProgressChanged({
        if ($_.TotalBytesToReceive -gt 0) {
            $dlProgress.Style = "Blocks"
            $dlProgress.Maximum = 100
            $pct = [int](($_.BytesReceived / $_.TotalBytesToReceive) * 100)
            $dlProgress.Value = $pct
            $dlLabel.Text = "Descargando... $pct%"
        }
    })

    $wc.Add_DownloadFileCompleted({
        if ($_.Error -ne $null) {
            $script:downloadError = $_.Error.Message
        }
        $dlForm.Close()
    })

    try {
        $wc.DownloadFileAsync($downloadUrl, $tempZip)
        $dlForm.ShowDialog() | Out-Null
    }
    finally {
        $wc.Dispose()
    }

    if ($script:downloadError) {
        [System.Windows.Forms.MessageBox]::Show(
            "Error al descargar la actualizaci´on:`n$script:downloadError",
            "Error de descarga",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
        return $false
    }

    if (-not (Test-Path $tempZip)) {
        [System.Windows.Forms.MessageBox]::Show(
            "Error al descargar la actualización.",
            "Error de descarga",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
        return $false
    }

    $dlProgress.Style = "Marquee"
    $dlLabel.Text = "Extrayendo archivos..."
    $dlForm.Show()
    [System.Windows.Forms.Application]::DoEvents()

    try {
        Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    }
    catch {
        $dlForm.Close()
        [System.Windows.Forms.MessageBox]::Show(
            "Error al extraer el archivo ZIP.",
            "Error de extracción",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
        return $false
    }

    $innerFolder = Get-ChildItem -Path $tempExtract -Directory | Where-Object { $_.Name -like "Jardines*" } | Select-Object -First 1

    if (-not $innerFolder) {
        $dlForm.Close()
        [System.Windows.Forms.MessageBox]::Show(
            "No se encontró la carpeta 'Jardines*' dentro del ZIP.",
            "Error de estructura",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        return $false
    }

    $dlLabel.Text = "Instalando componentes..."
    $dlProgress.Style = "Marquee"
    [System.Windows.Forms.Application]::DoEvents()

    try {
        Copy-Item -Path "$($innerFolder.FullName)\*" -Destination $appPath -Recurse -Force
    }
    catch {
        $dlForm.Close()
        [System.Windows.Forms.MessageBox]::Show(
            "Error al copiar archivos al destino.",
            "Error de instalación",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        return $false
    }

    Set-Content -Path (Join-Path $appPath "app-version.txt") -Value $version -Encoding UTF8

    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue

    $dlForm.Close()

    return $true
}

function Start-App($appPath, $exeName) {
    $exePath = Join-Path $appPath $exeName
    if (Test-Path $exePath) {
        Start-Process -FilePath $exePath
    }
}

# ============================================================
# MAIN
# ============================================================

Show-Splash
if ($script:splashAction -eq "Config") {
    if (Test-Path $configPath) {
        Start-Process notepad.exe $configPath
    }
    else {
        Read-Config | Out-Null
    }
    exit
}

$config = Read-Config
$backendUrl = $config["BackendURL"]
$appPath = Expand-PathVariables($config["AppPath"])
$exeName = $config["ExeName"]

do {
    $remote = Get-RemoteVersion $backendUrl
    if ($remote.success) { break }

    $result = [System.Windows.Forms.MessageBox]::Show(
        "No se pudo consultar la versión en el servidor:`n`n$($remote.error)`n`nSi = Reintentar`nNo = Abrir versión local`nCancelar = Editar configuración",
        "Error de conexión",
        [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )

    if ($result -eq "Cancel") {
        Start-Process notepad.exe $configPath
        exit
    }
    if ($result -eq "No") {
        $localVersion = Get-LocalVersion $appPath
        if ($localVersion) {
            Start-App $appPath $exeName
            exit
        }
        [System.Windows.Forms.MessageBox]::Show(
            "No hay una versión local instalada.",
            "Error",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
        exit
    }
} while ($true)

$localVersion = Get-LocalVersion $appPath

if (-not $localVersion) {
    $result = [System.Windows.Forms.MessageBox]::Show(
        "La aplicación no está instalada.`n`nVersión disponible: $($remote.version)`n`n¿Desea instalarla ahora?",
        "Aplicación no instalada",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )
    if ($result -eq "Yes") {
        $installed = Install-App $appPath $exeName $remote.downloadUrl $remote.version
        if ($installed) {
            [System.Windows.Forms.MessageBox]::Show(
                "Instalación completada. Versión: $($remote.version)",
                "Instalación exitosa",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Information
            ) | Out-Null
            Start-App $appPath $exeName
        }
    }
    exit
}

$cmp = Compare-Versions $remote.version $localVersion

if ($cmp -gt 0) {
    $result = [System.Windows.Forms.MessageBox]::Show(
        "Nueva versión disponible:`n`n  Actual: $localVersion`n  Nueva:  $($remote.version)`n`n¿Desea actualizar ahora?",
        "Actualización disponible",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )
    if ($result -eq "Yes") {
        $installed = Install-App $appPath $exeName $remote.downloadUrl $remote.version
    }
    Start-App $appPath $exeName
}
else {
    Start-App $appPath $exeName
}
