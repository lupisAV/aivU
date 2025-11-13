Modelos de Datos
=================

Este módulo contiene todos los modelos Pydantic y PyTorch del sistema.

Modelos Pydantic
----------------

Exercise Data
~~~~~~~~~~~~~

.. automodule:: app.models.exercise
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: app.models.exercise.ExerciseData
   :members:
   :undoc-members:
   :show-inheritance:

Modelo para datos de ejercicios individuales.

**Campos**:

* ``sequence``: Lista de 30 frames, cada uno con 18 features
* ``label``: 0 (incorrecto) o 1 (correcto)
* ``user_id``: ID del usuario
* ``exercise_type``: Tipo de ejercicio (bicep_curl, shoulder_press, etc.)
* ``timestamp``: Timestamp de captura
* ``notes``: Notas opcionales

Session Data
~~~~~~~~~~~~

.. autoclass:: app.models.exercise.SessionData
   :members:
   :undoc-members:
   :show-inheritance:

Modelo para sesiones de entrenamiento completas.

**Campos**:

* ``session_id``: ID único de la sesión
* ``user_id``: ID del usuario
* ``start_time``: Inicio de la sesión
* ``end_time``: Fin de la sesión
* ``total_exercises``: Total de ejercicios realizados
* ``correct_exercises``: Ejercicios correctos
* ``incorrect_exercises``: Ejercicios incorrectos
* ``exercise_history``: Historial de ejercicios

Dataset Stats
~~~~~~~~~~~~~

.. autoclass:: app.models.exercise.DatasetStats
   :members:
   :undoc-members:
   :show-inheritance:

Estadísticas del dataset recolectado.

**Campos**:

* ``total_exercises``: Total de ejercicios
* ``correct_count``: Cantidad de ejercicios correctos
* ``incorrect_count``: Cantidad de ejercicios incorrectos
* ``exercise_types``: Distribución por tipo
* ``users``: Lista de usuarios únicos

Pose Buffer
~~~~~~~~~~~

.. automodule:: app.models.pose_buffer
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: app.models.pose_buffer.PoseBuffer
   :members:
   :undoc-members:
   :show-inheritance:

Buffer circular para acumular frames de keypoints.

**Métodos principales**:

* ``add_frame(keypoints)``: Agrega un frame al buffer
* ``get_sequence()``: Obtiene la secuencia completa de 30 frames
* ``is_full()``: Verifica si el buffer está lleno
* ``reset()``: Limpia el buffer
* ``get_frames_count()``: Obtiene el número actual de frames

**Ejemplo**:

.. code-block:: python

   buffer = PoseBuffer(capacity=30)
   
   # Agregar frames
   for frame in frames:
       buffer.add_frame(frame)
   
   # Verificar si está lleno
   if buffer.is_full():
       sequence = buffer.get_sequence()
       # Procesar secuencia
       buffer.reset()

Modelos PyTorch
----------------

LSTM Model
~~~~~~~~~~

.. automodule:: app.models.lstm_model
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: app.models.lstm_model.PoseLSTM
   :members:
   :undoc-members:
   :show-inheritance:

Red LSTM bidireccional para clasificación de ejercicios.

**Arquitectura**:

* Input: (batch, 30, 18)
* LSTM bidireccional: 2 capas, 128 hidden units
* Dropout: 0.3
* Fully connected: 256 → 128 → 2
* Output: (batch, 2) logits

**Parámetros**:

* ``input_size``: Tamaño de entrada (18 features)
* ``hidden_size``: Tamaño de capa oculta (128)
* ``num_layers``: Número de capas LSTM (2)
* ``num_classes``: Número de clases (2)
* ``dropout``: Tasa de dropout (0.3)

**Ejemplo**:

.. code-block:: python

   model = PoseLSTM(
       input_size=18,
       hidden_size=128,
       num_layers=2,
       num_classes=2,
       dropout=0.3
   )
   
   # Forward pass
   sequence = torch.randn(32, 30, 18)  # batch_size=32
   logits = model(sequence)  # (32, 2)
   
   # Predicción
   probs = torch.softmax(logits, dim=1)
   predictions = torch.argmax(probs, dim=1)

LSTM Light
~~~~~~~~~~

.. autoclass:: app.models.lstm_model.PoseLSTMLight
   :members:
   :undoc-members:
   :show-inheritance:

Versión ligera del modelo LSTM para inferencia rápida.

**Diferencias con PoseLSTM**:

* Hidden size: 64 (vs 128)
* 1 capa LSTM (vs 2)
* Menos parámetros (~80K vs ~330K)
* Inferencia más rápida

**Uso recomendado**: Dispositivos con recursos limitados o cuando se requiere
latencia mínima.

Validación de Modelos
----------------------

Todos los modelos Pydantic incluyen validación automática:

.. code-block:: python

   from app.models.exercise import ExerciseData
   
   # Válido
   exercise = ExerciseData(
       sequence=[[0.1] * 18] * 30,
       label=1,
       user_id="user123",
       exercise_type="bicep_curl"
   )
   
   # Inválido - lanzará ValidationError
   try:
       exercise = ExerciseData(
           sequence=[[0.1] * 18] * 20,  # Solo 20 frames
           label=2,  # Label inválido
           user_id="user123",
           exercise_type="invalid_type"
       )
   except ValidationError as e:
       print(e)

Serialización
-------------

Los modelos Pydantic se serializan automáticamente a JSON:

.. code-block:: python

   # A dict
   exercise_dict = exercise.model_dump()
   
   # A JSON
   exercise_json = exercise.model_dump_json()
   
   # Desde dict
   exercise = ExerciseData(**exercise_dict)
   
   # Desde JSON
   exercise = ExerciseData.model_validate_json(exercise_json)

Ver También
-----------

* :doc:`services` - Servicios que usan estos modelos
* :doc:`routes` - Endpoints que reciben/retornan estos modelos
* :doc:`../ml/lstm_model` - Detalles del modelo LSTM
