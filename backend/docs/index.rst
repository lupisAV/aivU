Documentación de aivU Backend
==============================

**aivU** es una aplicación de entrenamiento físico con IA que utiliza visión por computadora 
para analizar ejercicios en tiempo real mediante MediaPipe y un modelo LSTM.

.. image:: https://img.shields.io/badge/Python-3.11+-blue.svg
   :target: https://www.python.org/downloads/
   :alt: Python Version

.. image:: https://img.shields.io/badge/FastAPI-0.109+-green.svg
   :target: https://fastapi.tiangolo.com/
   :alt: FastAPI

.. image:: https://img.shields.io/badge/PyTorch-2.0+-red.svg
   :target: https://pytorch.org/
   :alt: PyTorch

Características Principales
----------------------------

* 🎥 **Análisis en Tiempo Real**: WebSocket para streaming de poses
* 🧠 **Modelo LSTM**: Clasificación de ejercicios correctos/incorrectos
* 📊 **Recolección de Datos**: Sistema completo de almacenamiento de ejercicios y sesiones
* 📈 **Estadísticas**: Métricas de rendimiento y progreso del usuario
* 🔄 **API REST**: Endpoints para gestión de datos y exportación de datasets

Contenido
---------

.. toctree::
   :maxdepth: 2
   :caption: Guías:

   installation
   quickstart
   architecture

.. toctree::
   :maxdepth: 3
   :caption: API Reference:

   api/main
   api/models
   api/services
   api/routes

.. toctree::
   :maxdepth: 2
   :caption: Machine Learning:

   ml/lstm_model
   ml/training
   ml/evaluation

.. toctree::
   :maxdepth: 2
   :caption: Desarrollo:

   development/setup
   development/testing
   development/contributing

Índices y Tablas
----------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
