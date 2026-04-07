Aplicación Principal
====================

Este módulo contiene la aplicación FastAPI principal y los endpoints WebSocket.

.. automodule:: app.main
   :members:
   :undoc-members:
   :show-inheritance:

FastAPI Application
-------------------

.. autodata:: app.main.app
   :annotation:

La instancia principal de FastAPI que maneja todas las rutas y WebSockets.

WebSocket Endpoints
-------------------

Pose Analysis WebSocket
~~~~~~~~~~~~~~~~~~~~~~~~

.. autofunction:: app.main.websocket_pose_analysis

Endpoint WebSocket para análisis de poses en tiempo real.

**URL**: ``ws://localhost:8000/ws/pose-analysis``

**Protocolo**:

Cliente envía frames:

.. code-block:: json

   {
     "type": "frame",
     "keypoints": [[x, y, z], ...]
   }

Servidor responde con estado del buffer o predicción:

.. code-block:: json

   {
     "type": "prediction",
     "classification": "correcto",
     "confidence": 0.95
   }

REST Endpoints
--------------

Health Check
~~~~~~~~~~~~

.. code-block:: http

   GET /health

Verifica el estado del servidor y del modelo LSTM.

**Respuesta**:

.. code-block:: json

   {
     "status": "healthy",
     "model_loaded": true,
     "timestamp": "2025-01-09T22:00:00"
   }

Model Information
~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /model/info

Obtiene información sobre el modelo LSTM cargado.

**Respuesta**:

.. code-block:: json

   {
     "model_type": "PoseLSTM",
     "input_size": 18,
     "hidden_size": 128,
     "num_layers": 2,
     "num_classes": 2,
     "total_parameters": 330000
   }

CORS Configuration
------------------

.. autodata:: app.main.origins
   :annotation:

Lista de orígenes permitidos para CORS.

Startup Events
--------------

.. autofunction:: app.main.startup_event

Evento ejecutado al iniciar el servidor. Carga el modelo LSTM.

Shutdown Events
---------------

.. autofunction:: app.main.shutdown_event

Evento ejecutado al detener el servidor. Limpia recursos.

Configuración
-------------

La aplicación se configura mediante variables de entorno y el módulo :mod:`app.config`.

Variables de entorno importantes:

* ``HOST``: Host del servidor (default: 0.0.0.0)
* ``PORT``: Puerto del servidor (default: 8000)
* ``DEBUG``: Modo debug (default: True)
* ``MODEL_PATH``: Ruta al modelo LSTM (default: models/pose_lstm_best.pth)
* ``CONFIDENCE_THRESHOLD``: Umbral de confianza (default: 0.7)

Ejemplo de Uso
--------------

Iniciar el servidor:

.. code-block:: bash

   python run.py

O directamente con uvicorn:

.. code-block:: bash

   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Conectar vía WebSocket:

.. code-block:: python

   import asyncio
   import websockets
   import json

   async def connect():
       uri = "ws://localhost:8000/ws/pose-analysis"
       async with websockets.connect(uri) as ws:
           frame = {
               "type": "frame",
               "keypoints": [[0.5, 0.3, 0.1]] * 6
           }
           await ws.send(json.dumps(frame))
           response = await ws.recv()
           print(json.loads(response))

   asyncio.run(connect())
