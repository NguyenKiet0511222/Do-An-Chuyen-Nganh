# Script bật TCP/IP cổng 1433 cho tất cả các instance SQL Server
# Cần quyền Administrator

Write-Host "Dang kiem tra quyen Administrator..." -ForegroundColor Cyan
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Dang yeu cau quyen Administrator (UAC)..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "Dang bat TCP/IP cho cac SQL Server instance..." -ForegroundColor Green

# 1. Bật qua WMI (Thử cho MSSQLSERVER và SQLEXPRESS và HADEPTRAI)
$instances = @('MSSQLSERVER', 'SQLEXPRESS', 'HADEPTRAI')
foreach ($inst in $instances) {
    try {
        $p = Get-CimInstance -Namespace 'root\Microsoft\SqlServer\ComputerManagement17' -ClassName ServerNetworkProtocol -Filter "InstanceName = '$inst' and ProtocolName = 'Tcp'" -ErrorAction Stop
        Invoke-CimMethod -InputObject $p -MethodName SetEnable | Out-Null
        Write-Host "-> Da bat TCP/IP protocol cho instance $inst (WMI)!" -ForegroundColor Green
    } catch {
        # Bo qua
    }
}

# 2. Set Registry TCP Port 1433 va xoa Dynamic Ports cho IPAll
$regPaths = Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*\MSSQLServer\SuperSocketNetLib\Tcp" -ErrorAction SilentlyContinue
foreach ($reg in $regPaths) {
    $regPath = $reg.PSPath
    Set-ItemProperty -Path $regPath -Name "Enabled" -Value 1
    Set-ItemProperty -Path "$regPath\IPAll" -Name "TcpPort" -Value "1433"
    Set-ItemProperty -Path "$regPath\IPAll" -Name "TcpDynamicPorts" -Value ""
    Write-Host "-> Da cau hinh Port 1433 tai $regPath!" -ForegroundColor Green
}

# 3. Khoi dong lai service MSSQL
Write-Host "Dang khoi dong lai cac service SQL Server..." -ForegroundColor Cyan
Get-Service -Name "MSSQL*" | Where-Object {$_.Name -notlike "*FDHost*"} | Restart-Service -Force -ErrorAction SilentlyContinue

Write-Host "============================================================" -ForegroundColor Green
Write-Host "HOAN TAT: SQL Server da mo TCP/IP tai cong 1433!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Start-Sleep -Seconds 5
