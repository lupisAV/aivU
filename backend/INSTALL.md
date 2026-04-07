# Guía de Instalación - aivU Backend

## 📋 Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

## 🚀 Instalación Paso a Paso

### 1. Verificar Python

```bash
python --version
```

Debe mostrar Python 3.8 o superior.

### 2. Navegar a la carpeta del backend

```bash
cd c:\Users\danie\OneDrive\Escritorio\aivU\backend
```

### 3. Activar el entorno virtual

El entorno virtual ya está creado. Solo necesitas activarlo:

**Windows (PowerShell):**
```bash
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```bash
.\venv\Scripts\activate.bat
```

Deberías ver `(venv)` al inicio de tu línea de comandos.

### 4. Instalar dependencias

```bash
pip install -r requirements.txt
```

Esto instalará:
- FastAPI
- Uvicorn
- WebSockets
- NumPy
- Pydantic
- Y otras dependencias necesarias

### 5. Verificar instalación

```bash
pip list
```

Deberías ver todas las dependencias instaladas.

## ▶️ Ejecutar el Servidor

### Opción 1: Usando uvicorn directamente

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Opción 2: Usando el script run.py

```bash
python run.py
```

### Verificar que está corriendo

Abre tu navegador en:
- **API Root**: http://localhost:8000
- **Documentación**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

Deberías ver:
```json
{
  "app": "aivU Backend API",
  "version": "1.0.0",
  "status": "running"
}
```

## 🧪 Probar el WebSocket

### Opción 1: Script de prueba incluido

```bash
python test_websocket.py
```

Este script enviará 30 frames simulados y mostrará el progreso.

### Opción 2: Desde el navegador

1. Abre http://localhost:8000/docs
2. Busca el endpoint WebSocket
3. Usa la interfaz interactiva de FastAPI

## 🔧 Solución de Problemas

### Error: "No module named 'app'"

Asegúrate de estar en la carpeta `backend` y que el entorno virtual esté activado.

### Error: "Address already in use"

El puerto 8000 está ocupado. Usa otro puerto:

```bash
uvicorn app.main:app --reload --port 8001
```

### Error: "Cannot connect to WebSocket"

1. Verifica que el servidor esté corriendo
2. Revisa que el puerto sea el correcto (8000)
3. Verifica que no haya firewall bloqueando

### Error de CORS

Si el frontend Angular no puede conectarse, verifica que `http://localhost:4200` esté en `CORS_ORIGINS` en `app/config.py`.

## 📦 Estructura de Archivos Creados

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 ✅ FastAPI + WebSocket
│   ├── config.py               ✅ Configuración
│   ├── models/
│   │   ├── __init__.py
│   │   └── pose_buffer.py      ✅ Buffer de 30 frames
│   ├── services/
│   │   ├── __init__.py
│   │   └── pose_processor.py   ✅ Normalización
│   └── utils/
│       └── __init__.py
├── venv/                       ✅ Entorno virtual
├── .env.example                ✅ Ejemplo de configuración
├── .gitignore                  ✅ Archivos ignorados
├── requirements.txt            ✅ Dependencias
├── run.py                      ✅ Script de ejecución
├── test_websocket.py           ✅ Script de prueba
├── README.md                   ✅ Documentación
└── INSTALL.md                  ✅ Esta guía
```

## ✅ Checklist de Verificación

- [ ] Python 3.8+ instalado
- [ ] Entorno virtual activado (ver `(venv)` en terminal)
- [ ] Dependencias instaladas (`pip list` muestra fastapi, uvicorn, etc.)
- [ ] Servidor corriendo en http://localhost:8000
- [ ] Health check responde correctamente
- [ ] WebSocket acepta conexiones en ws://localhost:8000/ws/pose-analysis

## 🎯 Próximos Pasos

Una vez que el servidor esté corriendo correctamente:

1. **Fase 2**: Implementar modelo LSTM con PyTorch
2. **Fase 3**: Conectar con el frontend Angular
3. **Fase 4**: Integrar PostgreSQL

## 📞 Soporte

Si encuentras problemas, verifica:
1. Logs del servidor en la terminal
2. Documentación en http://localhost:8000/docs
3. README.md para más detalles
