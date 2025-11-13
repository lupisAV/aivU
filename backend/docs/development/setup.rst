Configuración de Desarrollo
============================

Esta guía te ayudará a configurar tu entorno de desarrollo para contribuir al proyecto aivU.

Requisitos Previos
------------------

Software Necesario
~~~~~~~~~~~~~~~~~~

* Python 3.11+
* Git
* pip y virtualenv
* Visual Studio Code (recomendado) o tu IDE favorito
* CUDA Toolkit (opcional, para GPU)

Conocimientos Recomendados
~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Python intermedio/avanzado
* FastAPI y async/await
* PyTorch básico
* WebSockets
* NumPy

Configuración Inicial
---------------------

1. Clonar el Repositorio
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   git clone https://github.com/tu-usuario/aivU.git
   cd aivU/backend

2. Crear Entorno Virtual
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate

3. Instalar Dependencias
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Dependencias principales
   pip install -r requirements.txt

   # Dependencias de desarrollo
   pip install -r requirements-dev.txt

4. Configurar Variables de Entorno
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Copiar archivo de ejemplo
   cp .env.example .env

   # Editar .env con tus configuraciones
   # Windows: notepad .env
   # Linux/Mac: nano .env

Estructura del Proyecto
------------------------

.. code-block:: text

   backend/
   ├── app/
   │   ├── __init__.py
   │   ├── main.py              # Aplicación FastAPI
   │   ├── config.py            # Configuración
   │   ├── models/              # Modelos Pydantic y PyTorch
   │   │   ├── exercise.py
   │   │   ├── pose_buffer.py
   │   │   └── lstm_model.py
   │   ├── services/            # Lógica de negocio
   │   │   ├── pose_processor.py
   │   │   ├── inference.py
   │   │   └── data_storage.py
   │   └── routes/              # Endpoints API
   │       └── data.py
   ├── training/                # Scripts de entrenamiento
   │   ├── dataset.py
   │   ├── train_lstm.py
   │   └── evaluate.py
   ├── data/                    # Datos recolectados
   │   ├── exercises/
   │   ├── sessions/
   │   └── dataset/
   ├── models/                  # Modelos entrenados
   │   └── pose_lstm_best.pth
   ├── evaluation/              # Resultados de evaluación
   ├── docs/                    # Documentación Sphinx
   ├── tests/                   # Tests unitarios
   ├── requirements.txt         # Dependencias principales
   ├── requirements-dev.txt     # Dependencias de desarrollo
   ├── run.py                   # Script para iniciar servidor
   └── README.md

Configuración del IDE
---------------------

Visual Studio Code
~~~~~~~~~~~~~~~~~~

Extensiones recomendadas:

.. code-block:: json

   {
     "recommendations": [
       "ms-python.python",
       "ms-python.vscode-pylance",
       "ms-python.black-formatter",
       "ms-python.flake8",
       "ms-python.mypy-type-checker",
       "ms-toolsai.jupyter"
     ]
   }

Configuración de settings.json:

.. code-block:: json

   {
     "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
     "python.linting.enabled": true,
     "python.linting.flake8Enabled": true,
     "python.formatting.provider": "black",
     "editor.formatOnSave": true,
     "python.testing.pytestEnabled": true,
     "python.testing.pytestArgs": [
       "tests"
     ]
   }

PyCharm
~~~~~~~

1. Abrir proyecto: ``File > Open > backend/``
2. Configurar intérprete: ``Settings > Project > Python Interpreter``
3. Seleccionar virtualenv: ``venv/bin/python``
4. Habilitar pytest: ``Settings > Tools > Python Integrated Tools > Testing``

Herramientas de Desarrollo
---------------------------

Linting
~~~~~~~

Usamos **flake8** para linting:

.. code-block:: bash

   # Verificar código
   flake8 app/ training/

   # Configuración en setup.cfg
   [flake8]
   max-line-length = 100
   exclude = venv,.git,__pycache__
   ignore = E203,W503

Formateo
~~~~~~~~

Usamos **black** para formateo automático:

.. code-block:: bash

   # Formatear todo el código
   black app/ training/

   # Verificar sin modificar
   black --check app/

   # Configuración en pyproject.toml
   [tool.black]
   line-length = 100
   target-version = ['py311']

Type Checking
~~~~~~~~~~~~~

Usamos **mypy** para verificación de tipos:

.. code-block:: bash

   # Verificar tipos
   mypy app/

   # Configuración en mypy.ini
   [mypy]
   python_version = 3.11
   warn_return_any = True
   warn_unused_configs = True
   disallow_untyped_defs = True

Testing
~~~~~~~

Usamos **pytest** para tests:

.. code-block:: bash

   # Ejecutar todos los tests
   pytest

   # Con cobertura
   pytest --cov=app tests/

   # Tests específicos
   pytest tests/test_inference.py

Pre-commit Hooks
~~~~~~~~~~~~~~~~

Configurar hooks para verificar código antes de commit:

.. code-block:: bash

   # Instalar pre-commit
   pip install pre-commit

   # Instalar hooks
   pre-commit install

   # Ejecutar manualmente
   pre-commit run --all-files

Configuración en ``.pre-commit-config.yaml``:

.. code-block:: yaml

   repos:
     - repo: https://github.com/psf/black
       rev: 23.12.0
       hooks:
         - id: black
     - repo: https://github.com/pycqa/flake8
       rev: 6.1.0
       hooks:
         - id: flake8
     - repo: https://github.com/pre-commit/mirrors-mypy
       rev: v1.7.1
       hooks:
         - id: mypy

Workflow de Desarrollo
-----------------------

1. Crear Rama
~~~~~~~~~~~~~

.. code-block:: bash

   git checkout -b feature/nueva-funcionalidad

2. Desarrollar
~~~~~~~~~~~~~~

.. code-block:: bash

   # Hacer cambios
   # Ejecutar tests
   pytest

   # Verificar linting
   flake8 app/

   # Formatear código
   black app/

3. Commit
~~~~~~~~~

.. code-block:: bash

   git add .
   git commit -m "feat: agregar nueva funcionalidad"

Convenciones de commits:

* ``feat:``: Nueva funcionalidad
* ``fix:``: Corrección de bug
* ``docs:``: Documentación
* ``style:``: Formateo
* ``refactor:``: Refactorización
* ``test:``: Tests
* ``chore:``: Mantenimiento

4. Push y Pull Request
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   git push origin feature/nueva-funcionalidad

Luego crear Pull Request en GitHub.

Debugging
---------

FastAPI Debugger
~~~~~~~~~~~~~~~~

Configurar debugger en VS Code (``.vscode/launch.json``):

.. code-block:: json

   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "FastAPI",
         "type": "python",
         "request": "launch",
         "module": "uvicorn",
         "args": [
           "app.main:app",
           "--reload",
           "--host", "0.0.0.0",
           "--port", "8000"
         ],
         "jinja": true,
         "justMyCode": false
       }
     ]
   }

PyTorch Debugger
~~~~~~~~~~~~~~~~

Para debuggear el modelo:

.. code-block:: python

   # Agregar breakpoints
   import pdb; pdb.set_trace()

   # O usar ipdb para mejor experiencia
   import ipdb; ipdb.set_trace()

Logging
~~~~~~~

Configurar logging para desarrollo:

.. code-block:: python

   import logging

   logging.basicConfig(
       level=logging.DEBUG,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   )

   logger = logging.getLogger(__name__)
   logger.debug("Mensaje de debug")

Variables de Entorno
--------------------

Archivo ``.env`` para desarrollo:

.. code-block:: ini

   # Servidor
   HOST=0.0.0.0
   PORT=8000
   DEBUG=True
   RELOAD=True

   # Modelo
   MODEL_PATH=models/pose_lstm_best.pth
   CONFIDENCE_THRESHOLD=0.7

   # Datos
   DATA_DIR=data/

   # Logging
   LOG_LEVEL=DEBUG

   # CORS
   ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4201

Documentación
-------------

Generar Documentación
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Instalar dependencias
   pip install sphinx sphinx-rtd-theme

   # Generar HTML
   cd docs
   make html

   # Abrir en navegador
   # Windows: start _build/html/index.html
   # Linux: xdg-open _build/html/index.html
   # Mac: open _build/html/index.html

Actualizar Documentación
~~~~~~~~~~~~~~~~~~~~~~~~~

1. Editar archivos ``.rst`` en ``docs/``
2. Regenerar: ``make html``
3. Verificar cambios en navegador

Docstrings
~~~~~~~~~~

Usar formato Google:

.. code-block:: python

   def funcion_ejemplo(param1: int, param2: str) -> bool:
       """Descripción breve de la función.

       Descripción más detallada si es necesaria.

       Args:
           param1: Descripción del parámetro 1
           param2: Descripción del parámetro 2

       Returns:
           Descripción del valor de retorno

       Raises:
           ValueError: Cuando param1 es negativo

       Example:
           >>> funcion_ejemplo(5, "test")
           True
       """
       pass

Solución de Problemas
---------------------

Puerto Ocupado
~~~~~~~~~~~~~~

.. code-block:: bash

   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -i :8000
   kill -9 <PID>

Dependencias Conflictivas
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Recrear entorno virtual
   deactivate
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

Modelo No Carga
~~~~~~~~~~~~~~~

.. code-block:: python

   # Verificar que el archivo existe
   import os
   print(os.path.exists('models/pose_lstm_best.pth'))

   # Verificar checkpoint
   import torch
   checkpoint = torch.load('models/pose_lstm_best.pth')
   print(checkpoint.keys())

Ver También
-----------

* :doc:`testing` - Guía de testing
* :doc:`contributing` - Guía de contribución
* :doc:`../api/main` - API reference
