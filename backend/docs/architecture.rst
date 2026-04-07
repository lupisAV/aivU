Arquitectura del Sistema
=========================

Esta sección describe la arquitectura completa del backend de aivU.

Visión General
--------------

El backend de aivU está construido con una arquitectura modular que separa claramente
las responsabilidades:

.. code-block:: text

   ┌─────────────────────────────────────────────────────────┐
   │                    Frontend (Angular)                    │
   │              MediaPipe + Canvas + WebSocket              │
   └────────────────┬────────────────────────────────────────┘
                    │ WebSocket (ws://)
                    │ REST API (http://)
   ┌────────────────▼────────────────────────────────────────┐
   │                   FastAPI Backend                        │
   │  ┌──────────────────────────────────────────────────┐   │
   │  │              WebSocket Handler                    │   │
   │  │         /ws/pose-analysis endpoint               │   │
   │  └──────────────┬───────────────────────────────────┘   │
   │                 │                                         │
   │  ┌──────────────▼───────────────────────────────────┐   │
   │  │            PoseBuffer (Circular)                  │   │
   │  │         Acumula 30 frames de keypoints           │   │
   │  └──────────────┬───────────────────────────────────┘   │
   │                 │                                         │
   │  ┌──────────────▼───────────────────────────────────┐   │
   │  │          PoseProcessor (NumPy)                    │   │
   │  │      Z-score + Min-Max Normalization             │   │
   │  └──────────────┬───────────────────────────────────┘   │
   │                 │                                         │
   │  ┌──────────────▼───────────────────────────────────┐   │
   │  │       InferenceService (PyTorch)                  │   │
   │  │     LSTM Model: (30,18) → (2,) logits            │   │
   │  └──────────────┬───────────────────────────────────┘   │
   │                 │                                         │
   │  ┌──────────────▼───────────────────────────────────┐   │
   │  │         DataStorageService                        │   │
   │  │    Guarda ejercicios (.npz + .json)              │   │
   │  └──────────────────────────────────────────────────┘   │
   │                                                           │
   │  ┌──────────────────────────────────────────────────┐   │
   │  │              REST API Routes                      │   │
   │  │  /api/data/exercise, /api/data/session, etc.    │   │
   │  └──────────────────────────────────────────────────┘   │
   └───────────────────────────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────────────┐
   │              Sistema de Archivos                         │
   │  data/exercises/  data/sessions/  data/dataset/         │
   │  models/pose_lstm_best.pth                              │
   └─────────────────────────────────────────────────────────┘

Componentes Principales
------------------------

1. FastAPI Application (``app/main.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Servidor ASGI que maneja:

* WebSocket para streaming en tiempo real
* REST API para operaciones CRUD
* CORS para comunicación con frontend
* Health checks y endpoints de información

**Características:**

* Inicialización automática del modelo LSTM
* Manejo de errores global
* Logging estructurado
* Documentación automática (Swagger/ReDoc)

2. WebSocket Handler
~~~~~~~~~~~~~~~~~~~~~

Endpoint: ``/ws/pose-analysis``

**Protocolo:**

Cliente envía:

.. code-block:: json

   {
     "type": "frame",
     "keypoints": [
       [x1, y1, z1],  // Hombro izquierdo (11)
       [x2, y2, z2],  // Hombro derecho (12)
       [x3, y3, z3],  // Codo izquierdo (13)
       [x4, y4, z4],  // Codo derecho (14)
       [x5, y5, z5],  // Muñeca izquierda (15)
       [x6, y6, z6]   // Muñeca derecha (16)
     ]
   }

Servidor responde:

.. code-block:: json

   {
     "type": "buffer_status",
     "frames_count": 15,
     "frames_needed": 30
   }

Cuando buffer lleno (30 frames):

.. code-block:: json

   {
     "type": "prediction",
     "classification": "correcto",
     "confidence": 0.95,
     "probabilities": {
       "incorrecto": 0.05,
       "correcto": 0.95
     }
   }

3. PoseBuffer (``app/models/pose_buffer.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Buffer circular que acumula frames de keypoints.

**Características:**

* Capacidad: 30 frames
* Thread-safe con locks
* Auto-reset después de predicción
* Validación de formato de entrada

**Métodos principales:**

* ``add_frame(keypoints)``: Agrega un frame
* ``get_sequence()``: Obtiene secuencia completa
* ``is_full()``: Verifica si está lleno
* ``reset()``: Limpia el buffer

4. PoseProcessor (``app/services/pose_processor.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Normaliza secuencias de keypoints usando NumPy.

**Pipeline de normalización:**

1. **Z-score normalization**:
   
   .. math::
   
      x_{norm} = \frac{x - \mu}{\sigma}

2. **Min-Max scaling**:
   
   .. math::
   
      x_{scaled} = \frac{x - x_{min}}{x_{max} - x_{min}}

**Ventajas:**

* Invariante a posición del usuario
* Invariante a escala
* Mejora convergencia del modelo

5. LSTM Model (``app/models/lstm_model.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Red neuronal recurrente para clasificación temporal.

**Arquitectura:**

.. code-block:: text

   Input: (batch, 30, 18)
      ↓
   LSTM Layer 1 (128 hidden, bidirectional)
      ↓
   Dropout (0.3)
      ↓
   LSTM Layer 2 (128 hidden, bidirectional)
      ↓
   Dropout (0.3)
      ↓
   Fully Connected (256 → 128)
      ↓
   ReLU + Dropout (0.3)
      ↓
   Fully Connected (128 → 2)
      ↓
   Output: (batch, 2) logits

**Parámetros:**

* Total: ~330K parámetros
* Hidden size: 128
* Num layers: 2
* Dropout: 0.3
* Bidirectional: True

6. InferenceService (``app/services/inference.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Servicio singleton para inferencia en tiempo real.

**Características:**

* Carga automática del modelo
* Caché de modelo en memoria
* Predicción por lotes
* Umbral de confianza configurable

**Métodos:**

* ``predict(sequence)``: Predicción individual
* ``predict_batch(sequences)``: Predicción por lotes
* ``load_model(path)``: Carga modelo desde checkpoint

7. DataStorageService (``app/services/data_storage.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Gestiona almacenamiento de ejercicios y sesiones.

**Estructura de datos:**

.. code-block:: text

   data/
   ├── exercises/
   │   ├── bicep_curl_20250109_220530.npz
   │   ├── bicep_curl_20250109_220530.json
   │   └── ...
   ├── sessions/
   │   ├── session_20250109_220000.json
   │   └── ...
   └── dataset/
       └── dataset_20250109_230000.npz

**Formatos:**

* ``.npz``: Arrays NumPy comprimidos (secuencias)
* ``.json``: Metadatos y estadísticas

8. REST API Routes (``app/routes/data.py``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Endpoints para gestión de datos:

* ``POST /api/data/exercise``: Guardar ejercicio
* ``POST /api/data/session``: Guardar sesión
* ``GET /api/data/exercises``: Listar ejercicios (con filtros)
* ``GET /api/data/sessions``: Listar sesiones
* ``GET /api/data/exercise/{id}``: Obtener ejercicio específico
* ``GET /api/data/session/{id}``: Obtener sesión específica
* ``GET /api/data/stats``: Estadísticas del dataset
* ``POST /api/data/export-dataset``: Exportar dataset completo

Flujo de Datos Completo
------------------------

1. **Captura** (Frontend)
   
   MediaPipe extrae 33 landmarks → Filtra 6 keypoints de brazos

2. **Transmisión** (WebSocket)
   
   Frontend envía frame → Backend recibe y valida

3. **Acumulación** (PoseBuffer)
   
   Buffer acumula frames → Cuando llega a 30, notifica

4. **Normalización** (PoseProcessor)
   
   Aplica Z-score + Min-Max → Secuencia lista para modelo

5. **Inferencia** (InferenceService)
   
   LSTM procesa secuencia → Genera logits → Aplica softmax

6. **Clasificación** (InferenceService)
   
   Compara probabilidades → Aplica umbral → Retorna clasificación

7. **Respuesta** (WebSocket)
   
   Backend envía predicción → Frontend actualiza UI

8. **Almacenamiento** (Opcional)
   
   Usuario etiqueta ejercicio → DataStorageService guarda

Patrones de Diseño
------------------

Singleton Pattern
~~~~~~~~~~~~~~~~~

Usado en:

* ``InferenceService``: Una sola instancia del modelo
* ``DataStorageService``: Un solo gestor de almacenamiento

**Ventajas:**

* Evita cargar modelo múltiples veces
* Gestión centralizada de recursos
* Thread-safe con locks

Dependency Injection
~~~~~~~~~~~~~~~~~~~~

FastAPI inyecta dependencias automáticamente:

.. code-block:: python

   @router.post("/exercise")
   async def save_exercise(
       data: ExerciseData,
       storage: DataStorageService = Depends(get_storage_service)
   ):
       # storage es inyectado automáticamente
       pass

Observer Pattern
~~~~~~~~~~~~~~~~

WebSocket implementa patrón observador:

* Cliente se suscribe al WebSocket
* Backend notifica cambios de estado
* Cliente reacciona a notificaciones

Consideraciones de Rendimiento
-------------------------------

Optimizaciones Implementadas
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Buffer Circular**: O(1) para agregar frames
2. **NumPy Vectorization**: Operaciones optimizadas
3. **PyTorch GPU**: Inferencia acelerada (si disponible)
4. **Async I/O**: FastAPI + uvicorn para concurrencia
5. **Batch Processing**: Predicciones por lotes cuando sea posible

Métricas Típicas
~~~~~~~~~~~~~~~~

* Latencia WebSocket: < 10ms
* Tiempo de inferencia: ~20-50ms (CPU) / ~5-10ms (GPU)
* Throughput: ~30-60 FPS
* Memoria: ~500MB (modelo cargado)

Escalabilidad
~~~~~~~~~~~~~

Para escalar horizontalmente:

1. Usar Redis para compartir estado entre instancias
2. Load balancer con sticky sessions para WebSocket
3. Separar inferencia en servicio dedicado
4. PostgreSQL para persistencia distribuida

Seguridad
---------

Medidas Implementadas
~~~~~~~~~~~~~~~~~~~~~~

* CORS configurado para orígenes específicos
* Validación de entrada con Pydantic
* Rate limiting (recomendado para producción)
* Sanitización de paths de archivos
* Manejo seguro de errores (sin exponer stack traces)

Recomendaciones Adicionales
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Implementar autenticación JWT
* HTTPS en producción
* Validar tamaño de payloads WebSocket
* Logs de auditoría
* Encriptación de datos sensibles

Próximos Pasos
--------------

* Ver :doc:`api/main` para detalles de implementación
* Consultar :doc:`ml/lstm_model` para el modelo
* Revisar :doc:`development/testing` para tests
