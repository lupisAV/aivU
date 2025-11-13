Instalación
===========

Requisitos del Sistema
----------------------

* Python 3.11 o superior
* pip (gestor de paquetes de Python)
* Git
* 4GB RAM mínimo (8GB recomendado para entrenamiento)
* GPU NVIDIA con CUDA (opcional, para entrenamiento acelerado)

Instalación Rápida
------------------

1. Clonar el repositorio
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   git clone https://github.com/tu-usuario/aivU.git
   cd aivU/backend

2. Crear entorno virtual
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate

3. Instalar dependencias
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   pip install -r requirements.txt

4. Configurar variables de entorno
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Crea un archivo ``.env`` basado en ``.env.example``:

.. code-block:: bash

   cp .env.example .env

Edita el archivo ``.env`` con tu configuración:

.. code-block:: ini

   # Configuración del servidor
   HOST=0.0.0.0
   PORT=8000
   DEBUG=True

   # Configuración del modelo
   MODEL_PATH=models/pose_lstm_best.pth
   CONFIDENCE_THRESHOLD=0.7

   # Configuración de datos
   DATA_DIR=data/

5. Iniciar el servidor
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   python run.py

El servidor estará disponible en ``http://localhost:8000``

Verificación de la Instalación
-------------------------------

Accede a la documentación interactiva de la API:

* Swagger UI: http://localhost:8000/docs
* ReDoc: http://localhost:8000/redoc

Ejecuta los tests:

.. code-block:: bash

   python test_components.py

Instalación para Desarrollo
----------------------------

Si vas a desarrollar o entrenar modelos, instala dependencias adicionales:

.. code-block:: bash

   pip install pytest pytest-asyncio pytest-cov black flake8 mypy

Solución de Problemas
----------------------

PyTorch no se instala correctamente
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Si tienes problemas con PyTorch, instálalo manualmente:

.. code-block:: bash

   # CPU only
   pip install torch torchvision torchaudio

   # CUDA 11.8
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

Error de permisos en Windows
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Ejecuta el terminal como administrador o usa:

.. code-block:: bash

   python -m pip install --user -r requirements.txt

Puerto 8000 ocupado
~~~~~~~~~~~~~~~~~~~

Cambia el puerto en ``.env`` o usa:

.. code-block:: bash

   uvicorn app.main:app --port 8001
