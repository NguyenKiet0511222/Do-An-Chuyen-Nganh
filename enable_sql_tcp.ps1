# Script bật TCP/IP cổng 1433 cho instance HADEPTRAI và MSSQLSERVER
# Cần quyền Administrator

Write-Host "Dang kiem tra quyen Administrator..." -ForegroundColor Cyan
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Dang yeu cau quyen Administrator (UAC)..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "Dang bat TCP/IP cho SQL Server instance HADEPTRAI..." -ForegroundColor Green

# 1. Bật giao thức TCP qua WMI ComputerManagement17
try {
    $p = Get-CimInstance -Namespace 'root\Microsoft\SqlServer\ComputerManagement17' -ClassName ServerNetworkProtocol -Filter "InstanceName = 'HADEPTRAI' and ProtocolName = 'Tcp'" -ErrorAction Stop
    Invoke-CimMethod -InputObject $p -MethodName SetEnable | Out-Null
    Write-Host "-> Da bat TCP/IP protocol thanh cong!" -ForegroundColor Green
} catch {
    Write-Host "-> WMI loi hoac da bat, tiep tuc kiem tra Registry..." -ForegroundColor Yellow
}

# 2. Set Registry TCP Port 1433 va xoa Dynamic Ports cho IPAll
$regPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.HADEPTRAI\MSSQLServer\SuperSocketNetLib\Tcp"
if (Test-Path $regPath) {
    Set-ItemProperty -Path $regPath -Name "Enabled" -Value 1
    Set-ItemProperty -Path "$regPath\IPAll" -Name "TcpPort" -Value "1433"
    Set-ItemProperty -Path "$regPath\IPAll" -Name "TcpDynamicPorts" -Value ""
    Write-Host "-> Da cau hinh Port 1433 cho IPAll thanh cong!" -ForegroundColor Green
}

# 3. Khoi dong lai service MSSQL$HADEPTRAI
Write-Host "Dang khoi dong lai service SQL Server (HADEPTRAI)..." -ForegroundColor Cyan
Restart-Service -Name "MSSQL`$HADEPTRAI" -Force
Write-Host "============================================================" -ForegroundColor Green
Write-Host "HOAN TAT: SQL Server HADEPTRAI da mo TCP/IP tai cong 1433!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Start-Sleep -Seconds 3
