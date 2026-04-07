Rutas API
==========

Este módulo contiene todas las rutas REST de la API.

Data Routes
-----------

.. automodule:: app.routes.data
   :members:
   :undoc-members:
   :show-inheritance:

Endpoints para gestión de datos de ejercicios y sesiones.

Guardar Ejercicio
~~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /api/data/exercise

Guarda un ejercicio con su secuencia y etiqueta.

**Request Body**:

.. code-block:: json

   {
     "sequence": [[0.1, 0.2, ...] × 30],
     "label": 1,
     "user_id": "user123",
     "exercise_type": "bicep_curl",
     "timestamp": "2025-01-09T22:00:00",
     "notes": "Ejercicio bien ejecutado"
   }

**Response**:

.. code-block:: json

   {
     "exercise_id": "bicep_curl_20250109_220000",
     "message": "Ejercicio guardado exitosamente"
   }

**Códigos de Estado**:

* ``200``: Ejercicio guardado exitosamente
* ``400``: Datos inválidos
* ``500``: Error del servidor

**Ejemplo**:

.. code-block:: python

   import requests
   
   exercise_data = {
       "sequence": [[0.1] * 18] * 30,
       "label": 1,
       "user_id": "user123",
       "exercise_type": "bicep_curl",
       "notes": "Primer ejercicio"
   }
   
   response = requests.post(
       "http://localhost:8000/api/data/exercise",
       json=exercise_data
   )
   
   print(response.json())

Guardar Sesión
~~~~~~~~~~~~~~

.. code-block:: http

   POST /api/data/session

Guarda una sesión completa de entrenamiento.

**Request Body**:

.. code-block:: json

   {
     "session_id": "session_123",
     "user_id": "user123",
     "start_time": "2025-01-09T22:00:00",
     "end_time": "2025-01-09T22:30:00",
     "total_exercises": 25,
     "correct_exercises": 20,
     "incorrect_exercises": 5,
     "exercise_history": [
       {
         "exercise_id": "ex_001",
         "classification": "correcto",
         "confidence": 0.95,
         "timestamp": "2025-01-09T22:05:00"
       }
     ]
   }

**Response**:

.. code-block:: json

   {
     "session_id": "session_123",
     "message": "Sesión guardada exitosamente"
   }

Listar Ejercicios
~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /api/data/exercises

Lista ejercicios con filtros opcionales.

**Query Parameters**:

* ``user_id`` (opcional): Filtrar por usuario
* ``exercise_type`` (opcional): Filtrar por tipo
* ``label`` (opcional): Filtrar por etiqueta (0 o 1)
* ``limit`` (opcional): Limitar resultados (default: 100)

**Response**:

.. code-block:: json

   [
     {
       "exercise_id": "bicep_curl_20250109_220000",
       "user_id": "user123",
       "exercise_type": "bicep_curl",
       "label": 1,
       "classification": "correcto",
       "timestamp": "2025-01-09T22:00:00",
       "notes": "Buen ejercicio"
     }
   ]

**Ejemplo**:

.. code-block:: python

   # Obtener últimos 10 ejercicios correctos de bicep curl
   response = requests.get(
       "http://localhost:8000/api/data/exercises",
       params={
           "exercise_type": "bicep_curl",
           "label": 1,
           "limit": 10
       }
   )
   
   exercises = response.json()
   for ex in exercises:
       print(f"{ex['exercise_id']}: {ex['classification']}")

Listar Sesiones
~~~~~~~~~~~~~~~

.. code-block:: http

   GET /api/data/sessions

Lista todas las sesiones guardadas.

**Query Parameters**:

* ``user_id`` (opcional): Filtrar por usuario
* ``limit`` (opcional): Limitar resultados

**Response**:

.. code-block:: json

   [
     {
       "session_id": "session_123",
       "user_id": "user123",
       "start_time": "2025-01-09T22:00:00",
       "end_time": "2025-01-09T22:30:00",
       "total_exercises": 25,
       "correct_exercises": 20,
       "incorrect_exercises": 5,
       "success_rate": 0.8
     }
   ]

Obtener Ejercicio
~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /api/data/exercise/{exercise_id}

Obtiene un ejercicio específico con su secuencia completa.

**Path Parameters**:

* ``exercise_id``: ID del ejercicio

**Response**:

.. code-block:: json

   {
     "exercise_id": "bicep_curl_20250109_220000",
     "user_id": "user123",
     "exercise_type": "bicep_curl",
     "label": 1,
     "classification": "correcto",
     "sequence": [[0.1, 0.2, ...] × 30],
     "timestamp": "2025-01-09T22:00:00",
     "notes": "Buen ejercicio"
   }

**Códigos de Estado**:

* ``200``: Ejercicio encontrado
* ``404``: Ejercicio no encontrado

Obtener Sesión
~~~~~~~~~~~~~~

.. code-block:: http

   GET /api/data/session/{session_id}

Obtiene una sesión específica con su historial completo.

**Path Parameters**:

* ``session_id``: ID de la sesión

**Response**:

.. code-block:: json

   {
     "session_id": "session_123",
     "user_id": "user123",
     "start_time": "2025-01-09T22:00:00",
     "end_time": "2025-01-09T22:30:00",
     "total_exercises": 25,
     "correct_exercises": 20,
     "incorrect_exercises": 5,
     "exercise_history": [...]
   }

Estadísticas del Dataset
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /api/data/stats

Obtiene estadísticas del dataset recolectado.

**Response**:

.. code-block:: json

   {
     "total_exercises": 500,
     "correct_count": 300,
     "incorrect_count": 200,
     "exercise_types": {
       "bicep_curl": 200,
       "shoulder_press": 150,
       "lateral_raise": 100,
       "front_raise": 50
     },
     "users": ["user123", "user456"],
     "date_range": {
       "earliest": "2025-01-01T00:00:00",
       "latest": "2025-01-09T22:00:00"
     }
   }

**Ejemplo**:

.. code-block:: python

   response = requests.get("http://localhost:8000/api/data/stats")
   stats = response.json()
   
   print(f"Total: {stats['total_exercises']}")
   print(f"Tasa de éxito: {stats['correct_count'] / stats['total_exercises']:.2%}")

Exportar Dataset
~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /api/data/export-dataset

Exporta el dataset completo en formato .npz para entrenamiento.

**Request Body** (opcional):

.. code-block:: json

   {
     "user_id": "user123",
     "exercise_type": "bicep_curl"
   }

**Response**:

.. code-block:: json

   {
     "file_path": "data/dataset/dataset_20250109_230000.npz",
     "total_samples": 500,
     "correct_samples": 300,
     "incorrect_samples": 200,
     "timestamp": "2025-01-09T23:00:00"
   }

**Ejemplo**:

.. code-block:: python

   # Exportar todo el dataset
   response = requests.post("http://localhost:8000/api/data/export-dataset")
   dataset_info = response.json()
   
   # Cargar dataset exportado
   import numpy as np
   data = np.load(dataset_info['file_path'])
   X = data['sequences']  # (N, 30, 18)
   y = data['labels']     # (N,)
   
   print(f"Forma de X: {X.shape}")
   print(f"Forma de y: {y.shape}")

Manejo de Errores
-----------------

Todos los endpoints manejan errores consistentemente:

Error 400 - Bad Request
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: json

   {
     "detail": "Secuencia debe tener 30 frames"
   }

Error 404 - Not Found
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: json

   {
     "detail": "Ejercicio no encontrado"
   }

Error 500 - Internal Server Error
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: json

   {
     "detail": "Error al guardar ejercicio"
   }

Validación de Datos
-------------------

Todos los endpoints validan datos con Pydantic:

.. code-block:: python

   from pydantic import ValidationError
   
   try:
       response = requests.post(
           "http://localhost:8000/api/data/exercise",
           json={
               "sequence": [[0.1] * 18] * 20,  # Solo 20 frames
               "label": 2,  # Label inválido
               "user_id": "user123"
           }
       )
   except requests.exceptions.HTTPError as e:
       print(e.response.json())
       # {"detail": [{"loc": ["sequence"], "msg": "debe tener 30 frames"}]}

Rate Limiting
-------------

Para producción, se recomienda implementar rate limiting:

.. code-block:: python

   from slowapi import Limiter
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   
   @router.post("/exercise")
   @limiter.limit("10/minute")
   async def save_exercise(request: Request, data: ExerciseData):
       # Máximo 10 requests por minuto
       pass

CORS
----

Los endpoints están configurados con CORS para permitir requests desde el frontend:

.. code-block:: python

   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:4200"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

Autenticación
-------------

Para producción, se recomienda implementar autenticación JWT:

.. code-block:: python

   from fastapi import Depends, HTTPException
   from fastapi.security import HTTPBearer
   
   security = HTTPBearer()
   
   async def verify_token(credentials = Depends(security)):
       token = credentials.credentials
       # Verificar token
       if not is_valid_token(token):
           raise HTTPException(status_code=401, detail="Token inválido")
       return token
   
   @router.post("/exercise")
   async def save_exercise(
       data: ExerciseData,
       token: str = Depends(verify_token)
   ):
       # Endpoint protegido
       pass

Ver También
-----------

* :doc:`models` - Modelos usados en los endpoints
* :doc:`services` - Servicios usados por los endpoints
* :doc:`../development/testing` - Tests de los endpoints
