@echo off
setlocal
cd /d "%~dps0"
echo ========================================================
echo   Khoi dong Backend Spring Boot (Nhom 5)
echo   Thu muc: %CD%
echo ========================================================
echo   Dung "mvn package" + "java -jar" thay vi "spring-boot:run":
echo   spring-boot:run bi loi "Could not find or load main class"
echo   tren duong dan co dau tieng Viet/khoang trang (VD "Do an chuyen nganh").
echo ========================================================
call mvnw.cmd -DskipTests package
if errorlevel 1 (
    echo.
    echo [LOI] Build that bai, xem log o tren.
    exit /b 1
)
java -jar target\backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
