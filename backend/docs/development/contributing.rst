Guía de Contribución
=====================

¡Gracias por tu interés en contribuir a aivU! Esta guía te ayudará a hacer contribuciones efectivas.

Código de Conducta
------------------

* Sé respetuoso y profesional
* Acepta críticas constructivas
* Enfócate en lo mejor para el proyecto
* Ayuda a otros contribuyentes

Cómo Contribuir
---------------

Reportar Bugs
~~~~~~~~~~~~~

Antes de reportar un bug:

1. Verifica que no esté ya reportado en Issues
2. Asegúrate de usar la última versión
3. Intenta reproducir el bug

Template para reportar bugs:

.. code-block:: markdown

   **Descripción del Bug**
   Descripción clara y concisa del bug.

   **Pasos para Reproducir**
   1. Ir a '...'
   2. Hacer clic en '...'
   3. Ver error

   **Comportamiento Esperado**
   Lo que esperabas que sucediera.

   **Comportamiento Actual**
   Lo que realmente sucedió.

   **Screenshots**
   Si aplica, agrega screenshots.

   **Entorno**
   - OS: [e.g. Windows 11]
   - Python: [e.g. 3.11.5]
   - FastAPI: [e.g. 0.109.0]

Sugerir Mejoras
~~~~~~~~~~~~~~~

Template para sugerencias:

.. code-block:: markdown

   **¿Tu sugerencia está relacionada con un problema?**
   Descripción clara del problema.

   **Solución Propuesta**
   Descripción de la solución que te gustaría.

   **Alternativas Consideradas**
   Otras soluciones que consideraste.

   **Contexto Adicional**
   Cualquier otro contexto relevante.

Pull Requests
~~~~~~~~~~~~~

Proceso:

1. Fork el repositorio
2. Crea una rama desde ``develop``
3. Haz tus cambios
4. Escribe/actualiza tests
5. Actualiza documentación
6. Haz commit siguiendo convenciones
7. Push a tu fork
8. Crea Pull Request

Estándares de Código
---------------------

Estilo de Código
~~~~~~~~~~~~~~~~

Seguimos **PEP 8** con algunas modificaciones:

* Línea máxima: 100 caracteres
* Usar comillas simples para strings
* 2 líneas en blanco entre clases/funciones top-level

.. code-block:: python

   # Bueno ✓
   def calculate_accuracy(predictions: np.ndarray, labels: np.ndarray) -> float:
       """Calcula accuracy de predicciones."""
       correct = (predictions == labels).sum()
       total = len(labels)
       return correct / total


   # Malo ✗
   def calculate_accuracy(predictions,labels):
       correct=(predictions==labels).sum()
       total=len(labels)
       return correct/total

Type Hints
~~~~~~~~~~

Usar type hints en todas las funciones:

.. code-block:: python

   from typing import List, Dict, Optional, Tuple
   import numpy as np

   def process_sequence(
       sequence: np.ndarray,
       normalize: bool = True
   ) -> Tuple[np.ndarray, Dict[str, float]]:
       """Procesa secuencia de keypoints."""
       pass

Docstrings
~~~~~~~~~~

Usar formato Google:

.. code-block:: python

   def train_model(
       model: nn.Module,
       train_loader: DataLoader,
       num_epochs: int
   ) -> Dict[str, List[float]]:
       """Entrena el modelo LSTM.

       Args:
           model: Modelo PyTorch a entrenar
           train_loader: DataLoader con datos de entrenamiento
           num_epochs: Número de épocas

       Returns:
           Diccionario con historial de entrenamiento:
           - train_loss: Lista de pérdidas de entrenamiento
           - val_loss: Lista de pérdidas de validación

       Raises:
           ValueError: Si num_epochs es negativo

       Example:
           >>> model = PoseLSTM(18, 128, 2, 2)
           >>> history = train_model(model, train_loader, 50)
           >>> print(history['train_loss'])
       """
       pass

Imports
~~~~~~~

Orden de imports:

1. Standard library
2. Third-party
3. Local

.. code-block:: python

   # Standard library
   import os
   import json
   from typing import List, Dict

   # Third-party
   import numpy as np
   import torch
   from fastapi import FastAPI

   # Local
   from app.models.lstm_model import PoseLSTM
   from app.services.inference import InferenceService

Nombres
~~~~~~~

.. code-block:: python

   # Variables y funciones: snake_case
   user_id = "user123"
   def calculate_accuracy():
       pass

   # Clases: PascalCase
   class PoseProcessor:
       pass

   # Constantes: UPPER_SNAKE_CASE
   MAX_BUFFER_SIZE = 30
   DEFAULT_LEARNING_RATE = 0.001

   # Privado: prefijo _
   def _internal_function():
       pass

Testing
-------

Requisitos
~~~~~~~~~~

* Todos los PRs deben incluir tests
* Cobertura mínima: 80%
* Tests deben pasar antes de merge

Escribir Tests
~~~~~~~~~~~~~~

.. code-block:: python

   import pytest
   from app.services.pose_processor import PoseProcessor

   @pytest.fixture
   def processor():
       return PoseProcessor()

   def test_normalize_sequence_valid_input(processor):
       """Test normalización con entrada válida."""
       # Arrange
       sequence = np.random.randn(30, 18)
       
       # Act
       normalized = processor.normalize_sequence(sequence)
       
       # Assert
       assert normalized.shape == (30, 18)
       assert normalized.min() >= 0
       assert normalized.max() <= 1

Ejecutar Tests
~~~~~~~~~~~~~~

.. code-block:: bash

   # Todos los tests
   pytest

   # Con cobertura
   pytest --cov=app tests/

   # Tests específicos
   pytest tests/test_services/

Documentación
-------------

Actualizar Docs
~~~~~~~~~~~~~~~

Si tu PR afecta la documentación:

1. Actualiza archivos ``.rst`` relevantes
2. Regenera documentación: ``cd docs && make html``
3. Verifica cambios en navegador

Agregar Nuevas Secciones
~~~~~~~~~~~~~~~~~~~~~~~~~

1. Crear archivo ``.rst`` en directorio apropiado
2. Agregar a ``index.rst`` en toctree
3. Regenerar documentación

Commits
-------

Convenciones
~~~~~~~~~~~~

Formato:

.. code-block:: text

   <tipo>(<scope>): <descripción>

   [cuerpo opcional]

   [footer opcional]

Tipos:

* ``feat``: Nueva funcionalidad
* ``fix``: Corrección de bug
* ``docs``: Documentación
* ``style``: Formateo, sin cambios de código
* ``refactor``: Refactorización
* ``test``: Tests
* ``chore``: Mantenimiento

Ejemplos:

.. code-block:: bash

   git commit -m "feat(inference): agregar batch prediction"
   git commit -m "fix(buffer): corregir overflow en buffer circular"
   git commit -m "docs(api): actualizar documentación de endpoints"
   git commit -m "test(services): agregar tests para PoseProcessor"

Mensajes Descriptivos
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Bueno ✓
   git commit -m "feat(lstm): agregar attention mechanism al modelo"

   # Malo ✗
   git commit -m "update"
   git commit -m "fix bug"
   git commit -m "changes"

Pull Requests
-------------

Template
~~~~~~~~

.. code-block:: markdown

   ## Descripción
   Descripción clara de los cambios.

   ## Tipo de Cambio
   - [ ] Bug fix
   - [ ] Nueva funcionalidad
   - [ ] Breaking change
   - [ ] Documentación

   ## Checklist
   - [ ] Tests agregados/actualizados
   - [ ] Documentación actualizada
   - [ ] Código sigue estándares
   - [ ] Tests pasan localmente
   - [ ] Commits siguen convenciones

   ## Screenshots (si aplica)

   ## Notas Adicionales

Revisión de Código
~~~~~~~~~~~~~~~~~~~

Criterios:

* Código sigue estándares
* Tests adecuados
* Documentación clara
* Sin código comentado
* Sin TODOs sin issue asociado
* Performance aceptable

Responder a Comentarios
~~~~~~~~~~~~~~~~~~~~~~~~

* Sé receptivo a feedback
* Explica tus decisiones
* Haz cambios solicitados
* Marca conversaciones como resueltas

Áreas de Contribución
----------------------

Backend
~~~~~~~

* Mejorar modelo LSTM
* Agregar nuevos tipos de ejercicio
* Optimizar inferencia
* Mejorar normalización
* Agregar más métricas

Frontend
~~~~~~~~

* Mejorar UI/UX
* Agregar visualizaciones
* Optimizar captura de video
* Agregar más estadísticas

Machine Learning
~~~~~~~~~~~~~~~~

* Experimentar con arquitecturas
* Implementar data augmentation
* Mejorar dataset
* Agregar transfer learning

Documentación
~~~~~~~~~~~~~

* Mejorar guías
* Agregar ejemplos
* Traducir documentación
* Crear tutoriales

Testing
~~~~~~~

* Aumentar cobertura
* Agregar tests de integración
* Agregar tests de performance
* Mejorar fixtures

Recursos
--------

* Documentación: https://docs.aivu.com
* Issues: https://github.com/tu-usuario/aivU/issues
* Discussions: https://github.com/tu-usuario/aivU/discussions
* Discord: https://discord.gg/aivu

Preguntas Frecuentes
--------------------

¿Cómo empiezo?
~~~~~~~~~~~~~~

1. Lee la documentación
2. Configura entorno de desarrollo
3. Busca issues con label "good first issue"
4. Pregunta en Discord si tienes dudas

¿Cuánto tiempo toma la revisión?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generalmente 1-3 días. Si no hay respuesta en 1 semana, menciona a los maintainers.

¿Puedo trabajar en múltiples issues?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sí, pero enfócate en terminar uno antes de empezar otro.

¿Qué pasa si mi PR es rechazado?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Recibirás feedback sobre qué mejorar. Puedes hacer cambios y volver a enviar.

Contacto
--------

* Email: dev@aivu.com
* Discord: https://discord.gg/aivu
* Twitter: @aivU_dev

¡Gracias por contribuir a aivU! 🚀
