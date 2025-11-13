Servicios
==========

Este módulo contiene los servicios principales del backend.

Pose Processor
--------------

.. automodule:: app.services.pose_processor
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: app.services.pose_processor.PoseProcessor
   :members:
   :undoc-members:
   :show-inheritance:

Servicio para normalización de secuencias de keypoints.

Métodos de Normalización
~~~~~~~~~~~~~~~~~~~~~~~~~

Z-Score Normalization
^^^^^^^^^^^^^^^^^^^^^

.. automethod:: app.services.pose_processor.PoseProcessor.normalize_zscore

Normaliza usando media y desviación estándar:

.. math::

   x_{norm} = \frac{x - \mu}{\sigma}

**Ventajas**:

* Centra los datos en 0
* Escala según la varianza
* Útil para datos con distribución normal

Min-Max Normalization
^^^^^^^^^^^^^^^^^^^^^

.. automethod:: app.services.pose_processor.PoseProcessor.normalize_minmax

Normaliza al rango [0, 1]:

.. math::

   x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}

**Ventajas**:

* Rango fijo [0, 1]
* Preserva relaciones
* Útil para redes neuronales

Pipeline Completo
^^^^^^^^^^^^^^^^^

.. automethod:: app.services.pose_processor.PoseProcessor.normalize_sequence

Aplica ambas normalizaciones en secuencia:

1. Z-score normalization
2. Min-Max scaling

**Ejemplo**:

.. code-block:: python

   from app.services.pose_processor import PoseProcessor
   import numpy as np
   
   processor = PoseProcessor()
   
   # Secuencia raw: (30, 18)
   raw_sequence = np.random.randn(30, 18)
   
   # Normalizar
   normalized = processor.normalize_sequence(raw_sequence)
   
   # Verificar rango
   assert normalized.min() >= 0
   assert normalized.max() <= 1

Inference Service
-----------------

.. automodule:: app.services.inference
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: app.services.inference.InferenceService
   :members:
   :undoc-members:
   :show-inheritance:

Servicio singleton para inferencia con el modelo LSTM.

Singleton Pattern
~~~~~~~~~~~~~~~~~

El servicio usa el patrón Singleton para asegurar una sola instancia:

.. code-block:: python

   # Siempre retorna la misma instancia
   service1 = InferenceService()
   service2 = InferenceService()
   assert service1 is service2

Métodos Principales
~~~~~~~~~~~~~~~~~~~

Cargar Modelo
^^^^^^^^^^^^^

.. automethod:: app.services.inference.InferenceService.load_model

Carga el modelo LSTM desde un checkpoint:

.. code-block:: python

   service = InferenceService()
   service.load_model("models/pose_lstm_best.pth")

Predicción Individual
^^^^^^^^^^^^^^^^^^^^^

.. automethod:: app.services.inference.InferenceService.predict

Realiza predicción en una secuencia:

.. code-block:: python

   sequence = np.random.randn(30, 18)
   result = service.predict(sequence)
   
   print(result)
   # {
   #   "classification": "correcto",
   #   "confidence": 0.95,
   #   "probabilities": {"incorrecto": 0.05, "correcto": 0.95}
   # }

Predicción por Lotes
^^^^^^^^^^^^^^^^^^^^

.. automethod:: app.services.inference.InferenceService.predict_batch

Procesa múltiples secuencias eficientemente:

.. code-block:: python

   sequences = [np.random.randn(30, 18) for _ in range(10)]
   results = service.predict_batch(sequences)
   
   for result in results:
       print(f"{result['classification']}: {result['confidence']:.2f}")

Configuración
~~~~~~~~~~~~~

Umbral de Confianza
^^^^^^^^^^^^^^^^^^^

El servicio usa un umbral de confianza configurable:

.. code-block:: python

   service = InferenceService()
   service.confidence_threshold = 0.8  # Más estricto
   
   # Si confidence < 0.8, puede marcar como incierto
   result = service.predict(sequence)

Dispositivo (CPU/GPU)
^^^^^^^^^^^^^^^^^^^^^

El servicio detecta automáticamente GPU:

.. code-block:: python

   service = InferenceService()
   print(service.device)  # "cuda" o "cpu"
   
   # Forzar CPU
   service.device = torch.device("cpu")

Data Storage Service
--------------------

.. automodule:: app.services.data_storage
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: app.services.data_storage.DataStorageService
   :members:
   :undoc-members:
   :show-inheritance:

Servicio para almacenamiento de ejercicios y sesiones.

Estructura de Archivos
~~~~~~~~~~~~~~~~~~~~~~~

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

Métodos de Guardado
~~~~~~~~~~~~~~~~~~~

Guardar Ejercicio
^^^^^^^^^^^^^^^^^

.. automethod:: app.services.data_storage.DataStorageService.save_exercise

Guarda un ejercicio en formato .npz (NumPy) y .json (metadatos):

.. code-block:: python

   from app.services.data_storage import DataStorageService
   from app.models.exercise import ExerciseData
   
   storage = DataStorageService()
   
   exercise = ExerciseData(
       sequence=[[0.1] * 18] * 30,
       label=1,
       user_id="user123",
       exercise_type="bicep_curl",
       notes="Buen ejercicio"
   )
   
   exercise_id = storage.save_exercise(exercise)
   print(f"Guardado: {exercise_id}")

Guardar Sesión
^^^^^^^^^^^^^^

.. automethod:: app.services.data_storage.DataStorageService.save_session

Guarda una sesión completa:

.. code-block:: python

   from app.models.exercise import SessionData
   
   session = SessionData(
       session_id="session_123",
       user_id="user123",
       start_time="2025-01-09T22:00:00",
       end_time="2025-01-09T22:30:00",
       total_exercises=25,
       correct_exercises=20,
       incorrect_exercises=5,
       exercise_history=[]
   )
   
   session_id = storage.save_session(session)

Métodos de Consulta
~~~~~~~~~~~~~~~~~~~~

Listar Ejercicios
^^^^^^^^^^^^^^^^^

.. automethod:: app.services.data_storage.DataStorageService.list_exercises

Lista ejercicios con filtros opcionales:

.. code-block:: python

   # Todos los ejercicios
   all_exercises = storage.list_exercises()
   
   # Filtrar por usuario
   user_exercises = storage.list_exercises(user_id="user123")
   
   # Filtrar por tipo y etiqueta
   correct_biceps = storage.list_exercises(
       exercise_type="bicep_curl",
       label=1,
       limit=10
   )

Obtener Ejercicio
^^^^^^^^^^^^^^^^^

.. automethod:: app.services.data_storage.DataStorageService.get_exercise

Obtiene un ejercicio específico:

.. code-block:: python

   exercise = storage.get_exercise("bicep_curl_20250109_220530")
   print(exercise["label"])  # 1
   print(exercise["sequence"].shape)  # (30, 18)

Estadísticas
~~~~~~~~~~~~

.. automethod:: app.services.data_storage.DataStorageService.get_dataset_stats

Obtiene estadísticas del dataset:

.. code-block:: python

   stats = storage.get_dataset_stats()
   print(f"Total: {stats['total_exercises']}")
   print(f"Correctos: {stats['correct_count']}")
   print(f"Incorrectos: {stats['incorrect_count']}")
   print(f"Tipos: {stats['exercise_types']}")

Exportación
~~~~~~~~~~~

.. automethod:: app.services.data_storage.DataStorageService.export_dataset_for_training

Exporta dataset completo para entrenamiento:

.. code-block:: python

   dataset_path = storage.export_dataset_for_training(
       user_id="user123",  # Opcional
       exercise_type="bicep_curl"  # Opcional
   )
   
   # Cargar dataset
   import numpy as np
   data = np.load(dataset_path)
   X = data['sequences']  # (N, 30, 18)
   y = data['labels']     # (N,)
   metadata = data['metadata']

Thread Safety
~~~~~~~~~~~~~

El servicio es thread-safe usando locks:

.. code-block:: python

   import threading
   
   def save_exercises():
       storage = DataStorageService()
       for i in range(100):
           exercise = create_exercise(i)
           storage.save_exercise(exercise)
   
   # Múltiples threads pueden guardar simultáneamente
   threads = [threading.Thread(target=save_exercises) for _ in range(5)]
   for t in threads:
       t.start()
   for t in threads:
       t.join()

Manejo de Errores
-----------------

Todos los servicios manejan errores apropiadamente:

.. code-block:: python

   from app.services.inference import InferenceService
   
   service = InferenceService()
   
   try:
       service.load_model("modelo_inexistente.pth")
   except FileNotFoundError:
       print("Modelo no encontrado")
   
   try:
       result = service.predict(np.random.randn(20, 18))  # Tamaño incorrecto
   except ValueError as e:
       print(f"Error: {e}")

Ver También
-----------

* :doc:`models` - Modelos usados por los servicios
* :doc:`routes` - Endpoints que usan estos servicios
* :doc:`../ml/training` - Entrenamiento del modelo LSTM
