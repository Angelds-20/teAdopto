# TeAdopto

Plataforma para conectar refugios de animales con personas que buscan adoptar mascotas.

## Requisitos

- Python 3.8+
- Node.js 16+
- MariaDB/MySQL 10.3+

## Instalación rápida

**Linux/Mac:**
```bash
chmod +x setup.sh && ./setup.sh
```

**Windows:**
```cmd
setup.bat
```

## Configuración en un nuevo PC

### 1. Crear base de datos

Conecta a MySQL/MariaDB y ejecuta:

```sql
CREATE DATABASE teadopto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'teadopto_user'@'localhost' IDENTIFIED BY 'tu_contraseña_aqui';
GRANT ALL PRIVILEGES ON teadopto.* TO 'teadopto_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configurar backend

Crea el archivo `backend/.env`:

```bash
cd backend
cp env.example .env
```

Edita `backend/.env` y cambia:
- `DB_PASSWORD=tu_contraseña_aqui` (la misma que usaste en CREATE USER)
- `SECRET_KEY=genera-uno-nuevo` (opcional, pero recomendado)

Para generar un SECRET_KEY:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Instalar dependencias

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```

**Frontend:**
```bash
cd frontend/teadopto-app
npm install
```

### 4. Ejecutar migraciones

```bash
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser  # opcional
```

## Ejecutar

**Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend/teadopto-app
npm run dev
```

## Problemas comunes

- **mysqlclient no instala:** Usa PyMySQL (ya está en requirements.txt)
- **Error de conexión a BD:** Verifica que la base de datos existe y las credenciales en `.env` son correctas
- **No conecta frontend/backend:** Revisa que ambos estén corriendo y `VITE_API_BASE_URL` en frontend `.env`
