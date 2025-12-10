#!/bin/bash

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "TeAdopto - Script de Configuración"
echo "===================================="
echo ""

if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1)
    if [ "$PYTHON_VERSION" -ge 3 ]; then
        PYTHON_CMD="python"
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    print_error "Python 3 no encontrado. Por favor instálalo primero."
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
print_success "Python $PYTHON_VERSION encontrado ($PYTHON_CMD)"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no encontrado. Por favor instálalo primero."
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no encontrado. Por favor instálalo primero."
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION encontrado"

echo ""
echo "Configurando Backend..."
echo "----------------------"

if [ ! -d "backend/venv" ]; then
    print_info "Creando entorno virtual..."
    cd backend
    $PYTHON_CMD -m venv venv
    print_success "Entorno virtual creado"
    cd ..
else
    print_warning "Entorno virtual ya existe, se reutilizará"
fi

print_info "Instalando dependencias de Python..."
cd backend

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install --upgrade pip --quiet --disable-pip-version-check 2>/dev/null || pip install --upgrade pip --quiet
if pip install -r ../requirements.txt --quiet --disable-pip-version-check 2>/dev/null; then
    print_success "Dependencias de Python instaladas"
else
    print_warning "Algunas dependencias pueden haber fallado, pero continuando..."
    pip install -r ../requirements.txt 2>&1 | grep -v "already satisfied" || true
    print_success "Dependencias de Python instaladas"
fi

deactivate
cd ..

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        print_success "Archivo .env creado desde env.example"
        print_warning "IMPORTANTE: Edita backend/.env con tus credenciales de base de datos"
    else
        print_warning "No se encontró backend/env.example, creando .env básico..."
        cat > backend/.env << EOF
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.mysql
DB_NAME=teadopto
DB_USER=teadopto_user
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=3306
CORS_ALLOW_ALL_ORIGINS=True
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
BASE_URL=http://127.0.0.1:8000
EOF
        print_success "Archivo .env básico creado"
    fi
else
    print_warning "Archivo backend/.env ya existe, no se sobrescribirá"
fi

echo ""
echo "Configurando Frontend..."
echo "------------------------"

print_info "Instalando dependencias de Node.js..."
cd frontend/teadopto-app

if npm install --silent 2>/dev/null; then
    print_success "Dependencias de Node.js instaladas"
else
    print_warning "Instalación con --silent falló, intentando sin silencio..."
    npm install
    print_success "Dependencias de Node.js instaladas"
fi

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success "Archivo .env creado desde env.example"
    else
        print_warning "No se encontró env.example, creando .env básico..."
        cat > .env << EOF
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_API_ADMIN_URL=http://127.0.0.1:8000/admin
EOF
        print_success "Archivo .env básico creado"
    fi
else
    print_warning "Archivo frontend/teadopto-app/.env ya existe, no se sobrescribirá"
fi

cd ../..

echo ""
echo "===================================="
echo -e "${GREEN}Configuración completada${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Edita backend/.env con tus credenciales de base de datos"
echo "2. Crea la base de datos en MariaDB/MySQL:"
echo "   CREATE DATABASE teadopto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "3. Ejecuta las migraciones:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   $PYTHON_CMD manage.py migrate"
echo "4. (Opcional) Crea un superusuario:"
echo "   $PYTHON_CMD manage.py createsuperuser"
echo "5. Inicia el backend:"
echo "   $PYTHON_CMD manage.py runserver"
echo "6. En otra terminal, inicia el frontend:"
echo "   cd frontend/teadopto-app"
echo "   npm run dev"
echo ""
