@echo off
setlocal enabledelayedexpansion

echo TeAdopto - Script de Configuración
echo ====================================
echo.

if not exist "backend\" (
    echo [ERROR] Ejecuta este script desde la raiz del proyecto
    exit /b 1
)

if not exist "frontend\" (
    echo [ERROR] Ejecuta este script desde la raiz del proyecto
    exit /b 1
)
set PYTHON_CMD=
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version 2>&1 | findstr /R "Python 3" >nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
    )
)

if not defined PYTHON_CMD (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python3
    )
)

if not defined PYTHON_CMD (
    echo [ERROR] Python 3 no encontrado. Por favor instalalo primero.
    exit /b 1
)

for /f "tokens=2" %%i in ('%PYTHON_CMD% --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python !PYTHON_VERSION! encontrado (%PYTHON_CMD%)

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Por favor instalalo primero.
    exit /b 1
)
for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js !NODE_VERSION! encontrado

REM Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm no encontrado. Por favor instalalo primero.
    exit /b 1
)
for /f %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm !NPM_VERSION! encontrado

echo.
echo Configurando Backend...
echo ----------------------

if not exist "backend\venv" (
    echo [INFO] Creando entorno virtual...
    cd backend
    %PYTHON_CMD% -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo crear el entorno virtual
        cd ..
        exit /b 1
    )
    echo [OK] Entorno virtual creado
    cd ..
) else (
    echo [AVISO] Entorno virtual ya existe, se reutilizara
)

echo [INFO] Instalando dependencias de Python...
cd backend

if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] El entorno virtual no se creo correctamente
    cd ..
    exit /b 1
)

call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo activar el entorno virtual
    cd ..
    exit /b 1
)

python -m pip install --upgrade pip --quiet --disable-pip-version-check >nul 2>&1
if %errorlevel% neq 0 (
    python -m pip install --upgrade pip --quiet >nul 2>&1
)
pip install -r ..\requirements.txt --quiet --disable-pip-version-check >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Algunas dependencias pueden haber fallado, reintentando...
    pip install -r ..\requirements.txt >nul 2>&1
)
echo [OK] Dependencias de Python instaladas

deactivate
cd ..

if not exist "backend\.env" (
    if exist "backend\env.example" (
        copy backend\env.example backend\.env >nul
        echo [OK] Archivo .env creado desde env.example
        echo [AVISO] IMPORTANTE: Edita backend\.env con tus credenciales de base de datos
    ) else (
        echo [AVISO] No se encontro backend\env.example, creando .env basico...
        (
            echo SECRET_KEY=django-insecure-change-this-in-production
            echo DEBUG=True
            echo ALLOWED_HOSTS=localhost,127.0.0.1
            echo DB_ENGINE=django.db.backends.mysql
            echo DB_NAME=teadopto
            echo DB_USER=teadopto_user
            echo DB_PASSWORD=your_password_here
            echo DB_HOST=localhost
            echo DB_PORT=3306
            echo CORS_ALLOW_ALL_ORIGINS=True
            echo JWT_ACCESS_TOKEN_LIFETIME=60
            echo JWT_REFRESH_TOKEN_LIFETIME=1440
            echo BASE_URL=http://127.0.0.1:8000
        ) > backend\.env
        echo [OK] Archivo .env basico creado
    )
) else (
    echo [AVISO] Archivo backend\.env ya existe, no se sobrescribira
)

echo.
echo Configurando Frontend...
echo ------------------------

echo [INFO] Instalando dependencias de Node.js...
cd frontend\teadopto-app

npm install --silent >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Instalacion con --silent fallo, intentando sin silencio...
    npm install >nul 2>&1
)
echo [OK] Dependencias de Node.js instaladas

if not exist ".env" (
    if exist "env.example" (
        copy env.example .env >nul
        echo [OK] Archivo .env creado desde env.example
    ) else (
        echo [AVISO] No se encontro env.example, creando .env basico...
        (
            echo VITE_API_BASE_URL=http://127.0.0.1:8000/api
            echo VITE_API_ADMIN_URL=http://127.0.0.1:8000/admin
        ) > .env
        echo [OK] Archivo .env basico creado
    )
) else (
    echo [AVISO] Archivo frontend\teadopto-app\.env ya existe, no se sobrescribira
)

cd ..\..

echo.
echo ====================================
echo [OK] Configuracion completada
echo.
echo Proximos pasos:
echo 1. Edita backend\.env con tus credenciales de base de datos
echo 2. Crea la base de datos en MariaDB/MySQL
echo 3. Ejecuta las migraciones:
echo    cd backend
echo    venv\Scripts\activate
echo    %PYTHON_CMD% manage.py migrate
echo 4. (Opcional) Crea un superusuario:
echo    %PYTHON_CMD% manage.py createsuperuser
echo 5. Inicia el backend:
echo    %PYTHON_CMD% manage.py runserver
echo 6. En otra terminal, inicia el frontend:
echo    cd frontend\teadopto-app
echo    npm run dev
echo.

pause
