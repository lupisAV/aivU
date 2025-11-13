Guía Rápida
============

Esta guía te ayudará a empezar a usar el backend de aivU en minutos.

Inicio Rápido
-------------

1. **Instalar y ejecutar** (ver :doc:`installation`)

2. **Conectar vía WebSocket**:

.. code-block:: python

   import asyncio
   import websockets
   import json

   async def test_connection():
       uri = "ws://localhost:8000/ws/pose-analysis"
       async with websockets.connect(uri) as websocket:
           # Enviar frame de prueba
           frame = {
               "type": "frame",
               "keypoints": [
                   [0.5, 0.3, 0.1],  # Hombro izquierdo
                   [0.5, 0.3, 0.1],  # Hombro derecho
                   [0.4, 0.5, 0.1],  # Codo izquierdo
                   [0.6, 0.5, 0.1],  # Codo derecho
                   [0.3, 0.7, 0.1],  # Muñeca izquierda
                   [0.7, 0.7, 0.1],  # Muñeca derecha
               ]
           }
           await websocket.send(json.dumps(frame))
           response = await websocket.recv()
           print(json.loads(response))

   asyncio.run(test_connection())

3. **Usar la API REST**:

.. code-block:: python

   import requests

   # Guardar un ejercicio
   response = requests.post(
       "http://localhost:8000/api/data/exercise",
       json={
           "sequence": [[0.1, 0.2, ...] * 30],  # 30 frames
           "label": 1,  # 1 = correcto, 0 = incorrecto
           "user_id": "user123",
           "exercise_type": "bicep_curl",
           "notes": "Ejercicio de prueba"
       }
   )
   print(response.json())

   # Obtener estadísticas
   stats = requests.get("http://localhost:8000/api/data/stats")
   print(stats.json())

Conceptos Clave
---------------

Buffer de Poses
~~~~~~~~~~~~~~~

El sistema acumula **30 frames** de keypoints antes de hacer una predicción:

* Cada frame contiene 6 keypoints (hombros, codos, muñecas)
* Cada keypoint tiene 3 coordenadas (x, y, z)
* Total: 30 frames × 18 features = secuencia de (30, 18)

Normalización
~~~~~~~~~~~~~

Los keypoints se normalizan automáticamente:

1. **Z-score**: Centra y escala los datos
2. **Min-Max**: Normaliza al rango [0, 1]

Esto asegura que el modelo funcione correctamente independientemente de la posición del usuario.

Predicción LSTM
~~~~~~~~~~~~~~~

El modelo LSTM analiza la secuencia temporal y clasifica:

* **Correcto (1)**: Ejercicio bien ejecutado
* **Incorrecto (0)**: Ejercicio con errores de forma

La respuesta incluye:

* ``classification``: "correcto" o "incorrecto"
* ``confidence``: Nivel de confianza (0-1)
* ``probabilities``: Probabilidades de cada clase

Flujo de Trabajo Típico
------------------------

1. **Captura de Video**
   
   Frontend captura video con MediaPipe y extrae keypoints

2. **Streaming WebSocket**
   
   Envía keypoints frame por frame al backend

3. **Acumulación**
   
   Backend acumula 30 frames en buffer circular

4. **Predicción**
   
   Cuando buffer está lleno, normaliza y ejecuta LSTM

5. **Respuesta**
   
   Backend envía clasificación al frontend

6. **Almacenamiento** (opcional)
   
   Guarda ejercicio con etiqueta para reentrenamiento

Ejemplos Prácticos
------------------

Guardar una Sesión Completa
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   session_data = {
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

   response = requests.post(
       "http://localhost:8000/api/data/session",
       json=session_data
   )

Exportar Dataset para Entrenamiento
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Exportar todos los ejercicios etiquetados
   response = requests.post(
       "http://localhost:8000/api/data/export-dataset",
       json={
           "user_id": "user123",  # Opcional: filtrar por usuario
           "exercise_type": "bicep_curl"  # Opcional: filtrar por tipo
       }
   )

   dataset_info = response.json()
   print(f"Dataset exportado: {dataset_info['file_path']}")
   print(f"Total muestras: {dataset_info['total_samples']}")

Listar Ejercicios con Filtros
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
       print(f"{ex['exercise_id']}: {ex['classification']} ({ex['confidence']})")

Próximos Pasos
--------------

* Lee la :doc:`architecture` para entender el sistema completo
* Explora la :doc:`api/main` para ver todos los endpoints
* Aprende sobre el :doc:`ml/lstm_model` para entender las predicciones
* Consulta :doc:`development/testing` para ejecutar tests
