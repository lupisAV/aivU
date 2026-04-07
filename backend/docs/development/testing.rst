Testing
=======

Guía completa de testing para el backend de aivU.

Configuración de Tests
----------------------

Instalar Dependencias
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   pip install pytest pytest-asyncio pytest-cov

Estructura de Tests
~~~~~~~~~~~~~~~~~~~

.. code-block:: text

   tests/
   ├── __init__.py
   ├── conftest.py              # Fixtures compartidos
   ├── test_models/
   │   ├── test_pose_buffer.py
   │   └── test_lstm_model.py
   ├── test_services/
   │   ├── test_pose_processor.py
   │   ├── test_inference.py
   │   └── test_data_storage.py
   └── test_routes/
       └── test_data_routes.py

Ejecutar Tests
--------------

Comandos Básicos
~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Todos los tests
   pytest

   # Tests específicos
   pytest tests/test_services/test_inference.py

   # Con verbose
   pytest -v

   # Con cobertura
   pytest --cov=app tests/

   # Generar reporte HTML de cobertura
   pytest --cov=app --cov-report=html tests/

Tests Unitarios
---------------

Test PoseBuffer
~~~~~~~~~~~~~~~

.. code-block:: python

   # tests/test_models/test_pose_buffer.py
   import pytest
   import numpy as np
   from app.models.pose_buffer import PoseBuffer

   def test_pose_buffer_initialization():
       buffer = PoseBuffer(capacity=30)
       assert buffer.capacity == 30
       assert buffer.get_frames_count() == 0
       assert not buffer.is_full()

   def test_pose_buffer_add_frame():
       buffer = PoseBuffer(capacity=30)
       keypoints = np.random.randn(6, 3).tolist()
       
       buffer.add_frame(keypoints)
       assert buffer.get_frames_count() == 1

   def test_pose_buffer_full():
       buffer = PoseBuffer(capacity=30)
       
       for i in range(30):
           keypoints = np.random.randn(6, 3).tolist()
           buffer.add_frame(keypoints)
       
       assert buffer.is_full()
       assert buffer.get_frames_count() == 30

   def test_pose_buffer_get_sequence():
       buffer = PoseBuffer(capacity=30)
       
       for i in range(30):
           keypoints = np.random.randn(6, 3).tolist()
           buffer.add_frame(keypoints)
       
       sequence = buffer.get_sequence()
       assert sequence.shape == (30, 18)

   def test_pose_buffer_reset():
       buffer = PoseBuffer(capacity=30)
       
       for i in range(15):
           keypoints = np.random.randn(6, 3).tolist()
           buffer.add_frame(keypoints)
       
       buffer.reset()
       assert buffer.get_frames_count() == 0

Test PoseProcessor
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # tests/test_services/test_pose_processor.py
   import pytest
   import numpy as np
   from app.services.pose_processor import PoseProcessor

   @pytest.fixture
   def processor():
       return PoseProcessor()

   @pytest.fixture
   def sample_sequence():
       return np.random.randn(30, 18)

   def test_normalize_zscore(processor, sample_sequence):
       normalized = processor.normalize_zscore(sample_sequence)
       
       # Verificar media cercana a 0
       assert np.abs(normalized.mean()) < 0.1
       
       # Verificar std cercana a 1
       assert np.abs(normalized.std() - 1.0) < 0.1

   def test_normalize_minmax(processor, sample_sequence):
       normalized = processor.normalize_minmax(sample_sequence)
       
       # Verificar rango [0, 1]
       assert normalized.min() >= 0
       assert normalized.max() <= 1

   def test_normalize_sequence(processor, sample_sequence):
       normalized = processor.normalize_sequence(sample_sequence)
       
       # Verificar forma
       assert normalized.shape == sample_sequence.shape
       
       # Verificar rango
       assert normalized.min() >= 0
       assert normalized.max() <= 1

Test InferenceService
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # tests/test_services/test_inference.py
   import pytest
   import numpy as np
   import torch
   from app.services.inference import InferenceService
   from app.models.lstm_model import PoseLSTM

   @pytest.fixture
   def inference_service():
       service = InferenceService()
       
       # Crear modelo de prueba
       model = PoseLSTM(
           input_size=18,
           hidden_size=64,
           num_layers=1,
           num_classes=2,
           dropout=0.3
       )
       
       service.model = model
       service.model.eval()
       
       return service

   def test_predict(inference_service):
       sequence = np.random.randn(30, 18)
       result = inference_service.predict(sequence)
       
       assert 'classification' in result
       assert 'confidence' in result
       assert 'probabilities' in result
       assert result['classification'] in ['correcto', 'incorrecto']
       assert 0 <= result['confidence'] <= 1

   def test_predict_batch(inference_service):
       sequences = [np.random.randn(30, 18) for _ in range(5)]
       results = inference_service.predict_batch(sequences)
       
       assert len(results) == 5
       for result in results:
           assert 'classification' in result
           assert 'confidence' in result

Tests de Integración
--------------------

Test WebSocket
~~~~~~~~~~~~~~

.. code-block:: python

   # tests/test_integration/test_websocket.py
   import pytest
   from fastapi.testclient import TestClient
   from app.main import app

   @pytest.fixture
   def client():
       return TestClient(app)

   def test_websocket_connection(client):
       with client.websocket_connect("/ws/pose-analysis") as websocket:
           # Enviar frame
           frame_data = {
               "type": "frame",
               "keypoints": [[0.5, 0.3, 0.1]] * 6
           }
           websocket.send_json(frame_data)
           
           # Recibir respuesta
           response = websocket.receive_json()
           
           assert "type" in response
           assert response["type"] in ["buffer_status", "prediction"]

Test Data Routes
~~~~~~~~~~~~~~~~

.. code-block:: python

   # tests/test_routes/test_data_routes.py
   import pytest
   from fastapi.testclient import TestClient
   from app.main import app

   @pytest.fixture
   def client():
       return TestClient(app)

   def test_save_exercise(client):
       exercise_data = {
           "sequence": [[0.1] * 18] * 30,
           "label": 1,
           "user_id": "test_user",
           "exercise_type": "bicep_curl",
           "notes": "Test exercise"
       }
       
       response = client.post("/api/data/exercise", json=exercise_data)
       
       assert response.status_code == 200
       assert "exercise_id" in response.json()

   def test_list_exercises(client):
       response = client.get("/api/data/exercises")
       
       assert response.status_code == 200
       assert isinstance(response.json(), list)

   def test_get_stats(client):
       response = client.get("/api/data/stats")
       
       assert response.status_code == 200
       data = response.json()
       assert "total_exercises" in data
       assert "correct_count" in data

Fixtures
--------

Fixtures Compartidos
~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # tests/conftest.py
   import pytest
   import numpy as np
   from app.models.lstm_model import PoseLSTM

   @pytest.fixture
   def sample_keypoints():
       """Genera keypoints de ejemplo."""
       return np.random.randn(6, 3).tolist()

   @pytest.fixture
   def sample_sequence():
       """Genera secuencia de ejemplo."""
       return np.random.randn(30, 18)

   @pytest.fixture
   def test_model():
       """Crea modelo de prueba."""
       model = PoseLSTM(
           input_size=18,
           hidden_size=64,
           num_layers=1,
           num_classes=2,
           dropout=0.3
       )
       model.eval()
       return model

   @pytest.fixture
   def temp_data_dir(tmp_path):
       """Crea directorio temporal para datos."""
       data_dir = tmp_path / "data"
       data_dir.mkdir()
       (data_dir / "exercises").mkdir()
       (data_dir / "sessions").mkdir()
       (data_dir / "dataset").mkdir()
       return data_dir

Mocking
-------

Mock de Modelo
~~~~~~~~~~~~~~

.. code-block:: python

   from unittest.mock import Mock, patch

   def test_inference_with_mock():
       with patch('app.services.inference.InferenceService') as MockService:
           mock_service = MockService.return_value
           mock_service.predict.return_value = {
               'classification': 'correcto',
               'confidence': 0.95,
               'probabilities': {'incorrecto': 0.05, 'correcto': 0.95}
           }
           
           # Usar mock
           result = mock_service.predict(np.random.randn(30, 18))
           assert result['classification'] == 'correcto'

Mock de Storage
~~~~~~~~~~~~~~~

.. code-block:: python

   def test_save_exercise_with_mock():
       with patch('app.services.data_storage.DataStorageService') as MockStorage:
           mock_storage = MockStorage.return_value
           mock_storage.save_exercise.return_value = "exercise_123"
           
           # Usar mock
           exercise_id = mock_storage.save_exercise(exercise_data)
           assert exercise_id == "exercise_123"

Cobertura de Código
-------------------

Generar Reporte
~~~~~~~~~~~~~~~

.. code-block:: bash

   # Ejecutar tests con cobertura
   pytest --cov=app --cov-report=html --cov-report=term tests/

   # Abrir reporte HTML
   # Windows: start htmlcov/index.html
   # Linux: xdg-open htmlcov/index.html

Configuración
~~~~~~~~~~~~~

.. code-block:: ini

   # .coveragerc
   [run]
   source = app
   omit =
       */tests/*
       */venv/*
       */__pycache__/*

   [report]
   exclude_lines =
       pragma: no cover
       def __repr__
       raise AssertionError
       raise NotImplementedError
       if __name__ == .__main__.:

Objetivo de Cobertura
~~~~~~~~~~~~~~~~~~~~~

* **Mínimo**: 80%
* **Objetivo**: 90%
* **Ideal**: 95%+

Tests de Performance
--------------------

Test de Latencia
~~~~~~~~~~~~~~~~

.. code-block:: python

   import time

   def test_inference_latency(inference_service):
       sequence = np.random.randn(30, 18)
       
       start = time.time()
       result = inference_service.predict(sequence)
       latency = time.time() - start
       
       # Verificar latencia < 100ms
       assert latency < 0.1

Test de Throughput
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   def test_inference_throughput(inference_service):
       sequences = [np.random.randn(30, 18) for _ in range(100)]
       
       start = time.time()
       results = inference_service.predict_batch(sequences)
       duration = time.time() - start
       
       throughput = len(sequences) / duration
       
       # Verificar throughput > 10 predicciones/segundo
       assert throughput > 10

Continuous Integration
----------------------

GitHub Actions
~~~~~~~~~~~~~~

.. code-block:: yaml

   # .github/workflows/tests.yml
   name: Tests

   on: [push, pull_request]

   jobs:
     test:
       runs-on: ubuntu-latest
       
       steps:
       - uses: actions/checkout@v2
       
       - name: Set up Python
         uses: actions/setup-python@v2
         with:
           python-version: '3.11'
       
       - name: Install dependencies
         run: |
           pip install -r requirements.txt
           pip install pytest pytest-cov
       
       - name: Run tests
         run: |
           pytest --cov=app tests/
       
       - name: Upload coverage
         uses: codecov/codecov-action@v2

Mejores Prácticas
-----------------

Principios
~~~~~~~~~~

1. **AAA Pattern**: Arrange, Act, Assert
2. **DRY**: Don't Repeat Yourself (usar fixtures)
3. **FIRST**: Fast, Independent, Repeatable, Self-validating, Timely
4. **Test one thing**: Un test por funcionalidad

Nomenclatura
~~~~~~~~~~~~

.. code-block:: python

   def test_<función>_<escenario>_<resultado_esperado>():
       pass

   # Ejemplos:
   def test_predict_valid_sequence_returns_classification():
       pass

   def test_save_exercise_invalid_data_raises_error():
       pass

Documentación de Tests
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   def test_inference_with_normalized_sequence():
       """Test que verifica predicción con secuencia normalizada.
       
       Given: Una secuencia normalizada de 30 frames
       When: Se llama a predict()
       Then: Retorna clasificación válida con confianza
       """
       pass

Ver También
-----------

* :doc:`setup` - Configuración de desarrollo
* :doc:`contributing` - Guía de contribución
* :doc:`../api/services` - Servicios a testear
