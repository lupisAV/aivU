# aivU Backend

Backend de aivU - Sistema de entrenamiento físico con IA que utiliza visión por computadora para analizar ejercicios en tiempo real.

## 🚀 Características

- **Análisis en Tiempo Real**: WebSocket para streaming de poses con MediaPipe
- **Modelo LSTM**: Clasificación de ejercicios correctos/incorrectos
- **Recolección de Datos**: Sistema completo de almacenamiento de ejercicios y sesiones
- **API REST**: Endpoints para gestión de datos y exportación de datasets
- **Documentación Completa**: Generada con Sphinx

## 📋 Requisitos

- Python 3.11+
- pip
- 4GB RAM mínimo (8GB recomendado para entrenamiento)
- GPU NVIDIA con CUDA (opcional, para entrenamiento acelerado)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aivU.git
cd aivU/backend
```

### 2. Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Editar .env con tu configuración
```

### 5. Iniciar el servidor

```bash
python run.py
```

El servidor estará disponible en `http://localhost:8000`

## 📚 Documentación

### Ver Documentación

La documentación completa está disponible en formato HTML generada con Sphinx.

**Generar y abrir documentación:**

```bash
# Opción 1: Script automático (recomendado)
python generate_docs.py --open

# Opción 2: Manual
cd docs
make.bat html              # Windows
make html                  # Linux/Mac
start _build/html/index.html  # Windows
```

### Contenido de la Documentación

- **Guías de Instalación y Uso**
- **Arquitectura del Sistema**
- **API Reference** (autodocumentada desde el código)
- **Documentación del Modelo LSTM**
- **Guías de Entrenamiento y Evaluación**
- **Guías de Desarrollo y Testing**

Ver [DOCUMENTATION.md](DOCUMENTATION.md) para más detalles.

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest

# Con cobertura
pytest --cov=app tests/

# Tests específicos
pytest tests/test_services/test_inference.py
```

## 📡 API Endpoints

### WebSocket

- `ws://localhost:8000/ws/pose-analysis` - Análisis de poses en tiempo real

### REST API

- `GET /health` - Health check
- `GET /model/info` - Información del modelo
- `POST /api/data/exercise` - Guardar ejercicio
- `POST /api/data/session` - Guardar sesión
- `GET /api/data/exercises` - Listar ejercicios
- `GET /api/data/sessions` - Listar sesiones
- `GET /api/data/stats` - Estadísticas del dataset
- `POST /api/data/export-dataset` - Exportar dataset

**Documentación interactiva:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🏗️ Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py              # Aplicación FastAPI
│   ├── config.py            # Configuración
│   ├── models/              # Modelos Pydantic y PyTorch
│   ├── services/            # Lógica de negocio
│   └── routes/              # Endpoints API
├── training/                # Scripts de entrenamiento
├── data/                    # Datos recolectados
├── models/                  # Modelos entrenados
├── docs/                    # Documentación Sphinx
├── tests/                   # Tests
├── requirements.txt         # Dependencias
├── requirements-dev.txt     # Dependencias de desarrollo
├── generate_docs.py         # Script para generar docs
└── run.py                   # Script para iniciar servidor
```

## 🤖 Modelo LSTM

El modelo utiliza una arquitectura LSTM bidireccional:

- **Input**: (30, 18) - 30 frames de 6 keypoints (hombros, codos, muñecas)
- **LSTM**: 2 capas, 128 hidden units, bidireccional
- **Output**: 2 clases (correcto/incorrecto)
- **Parámetros**: ~330K

Ver documentación completa del modelo en `docs/ml/lstm_model.rst`

## 📊 Entrenamiento

```bash
# Entrenar con datos sintéticos
python training/train_lstm.py

# Evaluar modelo
python training/evaluate.py
```

Para entrenar con datos reales:

1. Recolectar 500+ ejercicios etiquetados desde el frontend
2. Exportar dataset: `POST /api/data/export-dataset`
3. Modificar `training/train_lstm.py` para usar datos reales
4. Entrenar y evaluar

## 🛠️ Desarrollo

### Instalar dependencias de desarrollo

```bash
pip install -r requirements-dev.txt
```

### Herramientas

- **Linting**: `flake8 app/`
- **Formateo**: `black app/`
- **Type checking**: `mypy app/`
- **Pre-commit hooks**: `pre-commit install`

Ver [docs/development/setup.rst](docs/development/setup.rst) para más detalles.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee [docs/development/contributing.rst](docs/development/contributing.rst) para detalles sobre:

- Código de conducta
- Proceso de pull requests
- Estándares de código
- Guías de testing

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## 🔗 Enlaces

- **Frontend**: [../src](../src)
- **Documentación**: Ejecuta `python generate_docs.py --open`
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/aivU/issues)

## 📞 Soporte

- Email: dev@aivu.com
- Discord: https://discord.gg/aivu
- Documentación: Genera con `python generate_docs.py --open`

---

Desarrollado con ❤️ por el equipo de aivU
