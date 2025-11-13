Modelo LSTM
===========

El modelo LSTM (Long Short-Term Memory) es el núcleo del sistema de clasificación de ejercicios.

Arquitectura
------------

El modelo utiliza una arquitectura LSTM bidireccional con múltiples capas:

.. code-block:: text

   Input: (batch, 30, 18)
      ↓
   LSTM Layer 1 (bidirectional)
      - Hidden size: 128
      - Output: (batch, 30, 256)
      ↓
   Dropout (0.3)
      ↓
   LSTM Layer 2 (bidirectional)
      - Hidden size: 128
      - Output: (batch, 30, 256)
      ↓
   Take last timestep: (batch, 256)
      ↓
   Fully Connected (256 → 128)
      ↓
   ReLU + Dropout (0.3)
      ↓
   Fully Connected (128 → 2)
      ↓
   Output: (batch, 2) logits

Componentes del Modelo
-----------------------

LSTM Bidireccional
~~~~~~~~~~~~~~~~~~

El modelo usa LSTM bidireccional para capturar patrones temporales en ambas direcciones:

* **Forward LSTM**: Procesa la secuencia de inicio a fin
* **Backward LSTM**: Procesa la secuencia de fin a inicio
* **Concatenación**: Combina ambas direcciones

**Ventajas**:

* Captura contexto completo de la secuencia
* Mejor comprensión de patrones temporales
* Mayor precisión en clasificación

Dropout
~~~~~~~

Se aplica dropout de 0.3 después de cada capa LSTM y en la capa fully connected:

* Previene overfitting
* Mejora generalización
* Regularización efectiva

Capas Fully Connected
~~~~~~~~~~~~~~~~~~~~~

Dos capas fully connected al final:

1. **FC1**: 256 → 128 con ReLU y Dropout
2. **FC2**: 128 → 2 (logits para clasificación binaria)

Parámetros del Modelo
----------------------

.. list-table::
   :header-rows: 1
   :widths: 30 20 50

   * - Parámetro
     - Valor
     - Descripción
   * - input_size
     - 18
     - Features por frame (6 keypoints × 3 coords)
   * - hidden_size
     - 128
     - Tamaño de capa oculta LSTM
   * - num_layers
     - 2
     - Número de capas LSTM
   * - num_classes
     - 2
     - Clases (correcto/incorrecto)
   * - dropout
     - 0.3
     - Tasa de dropout
   * - bidirectional
     - True
     - LSTM bidireccional
   * - Total params
     - ~330,000
     - Parámetros entrenables

Formato de Entrada
------------------

El modelo espera secuencias con el siguiente formato:

.. code-block:: python

   # Forma: (batch_size, sequence_length, input_size)
   input_shape = (32, 30, 18)
   
   # Donde:
   # - batch_size: Número de secuencias en el lote
   # - sequence_length: 30 frames
   # - input_size: 18 features (6 keypoints × 3 coords)

Keypoints Utilizados
~~~~~~~~~~~~~~~~~~~~

El modelo usa solo los keypoints de los brazos:

.. list-table::
   :header-rows: 1
   :widths: 20 30 50

   * - Index
     - Keypoint
     - Coordenadas (x, y, z)
   * - 11
     - Hombro izquierdo
     - [x₁, y₁, z₁]
   * - 12
     - Hombro derecho
     - [x₂, y₂, z₂]
   * - 13
     - Codo izquierdo
     - [x₃, y₃, z₃]
   * - 14
     - Codo derecho
     - [x₄, y₄, z₄]
   * - 15
     - Muñeca izquierda
     - [x₅, y₅, z₅]
   * - 16
     - Muñeca derecha
     - [x₆, y₆, z₆]

**Total**: 6 keypoints × 3 coordenadas = 18 features por frame

Formato de Salida
-----------------

El modelo produce logits para clasificación binaria:

.. code-block:: python

   # Logits: (batch_size, 2)
   logits = model(input_sequence)
   
   # Aplicar softmax para probabilidades
   probabilities = torch.softmax(logits, dim=1)
   
   # Ejemplo de salida:
   # probabilities = [[0.05, 0.95]]  # [incorrecto, correcto]
   
   # Predicción final
   prediction = torch.argmax(probabilities, dim=1)
   # prediction = [1]  # 1 = correcto

Clases
~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 20 30 50

   * - Índice
     - Clase
     - Descripción
   * - 0
     - Incorrecto
     - Ejercicio mal ejecutado
   * - 1
     - Correcto
     - Ejercicio bien ejecutado

Inicialización de Pesos
------------------------

El modelo usa inicialización Xavier/Glorot para mejor convergencia:

.. code-block:: python

   def init_weights(m):
       if isinstance(m, nn.Linear):
           nn.init.xavier_uniform_(m.weight)
           if m.bias is not None:
               nn.init.constant_(m.bias, 0)
       elif isinstance(m, nn.LSTM):
           for name, param in m.named_parameters():
               if 'weight_ih' in name:
                   nn.init.xavier_uniform_(param.data)
               elif 'weight_hh' in name:
                   nn.init.orthogonal_(param.data)
               elif 'bias' in name:
                   nn.init.constant_(param.data, 0)

**Ventajas**:

* Mejor convergencia inicial
* Evita gradientes que desaparecen/explotan
* Entrenamiento más estable

Función de Pérdida
------------------

El modelo se entrena con Cross Entropy Loss:

.. math::

   \mathcal{L} = -\sum_{i=1}^{C} y_i \log(\hat{y}_i)

Donde:

* :math:`C`: Número de clases (2)
* :math:`y_i`: Etiqueta verdadera (one-hot)
* :math:`\hat{y}_i`: Probabilidad predicha

**Características**:

* Penaliza predicciones incorrectas
* Funciona bien con softmax
* Estándar para clasificación

Optimizador
-----------

Se usa Adam optimizer con los siguientes parámetros:

.. code-block:: python

   optimizer = torch.optim.Adam(
       model.parameters(),
       lr=0.001,
       betas=(0.9, 0.999),
       eps=1e-08,
       weight_decay=0.0001
   )

**Ventajas de Adam**:

* Adaptive learning rate
* Momentum incorporado
* Funciona bien sin tuning extensivo

Learning Rate Scheduler
~~~~~~~~~~~~~~~~~~~~~~~

Se usa ReduceLROnPlateau para ajustar el learning rate:

.. code-block:: python

   scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
       optimizer,
       mode='min',
       factor=0.5,
       patience=5,
       verbose=True
   )

**Comportamiento**:

* Reduce LR cuando la pérdida se estanca
* Factor de reducción: 0.5
* Paciencia: 5 épocas

Métricas de Evaluación
-----------------------

El modelo se evalúa con múltiples métricas:

Accuracy
~~~~~~~~

.. math::

   \text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}

Precision
~~~~~~~~~

.. math::

   \text{Precision} = \frac{TP}{TP + FP}

Recall
~~~~~~

.. math::

   \text{Recall} = \frac{TP}{TP + FN}

F1-Score
~~~~~~~~

.. math::

   \text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}

ROC-AUC
~~~~~~~

Área bajo la curva ROC, mide la capacidad de discriminación del modelo.

Resultados Esperados
--------------------

Con datos sintéticos de entrenamiento:

.. list-table::
   :header-rows: 1
   :widths: 30 35 35

   * - Métrica
     - Valor Esperado
     - Objetivo
   * - Training Accuracy
     - > 95%
     - > 90%
   * - Validation Accuracy
     - > 90%
     - > 85%
   * - Test Accuracy
     - > 88%
     - > 85%
   * - F1-Score
     - > 0.88
     - > 0.85
   * - ROC-AUC
     - > 0.92
     - > 0.90

Con datos reales (después de recolección):

.. list-table::
   :header-rows: 1
   :widths: 30 35 35

   * - Métrica
     - Valor Esperado
     - Objetivo
   * - Training Accuracy
     - > 92%
     - > 88%
   * - Validation Accuracy
     - > 88%
     - > 85%
   * - Test Accuracy
     - > 86%
     - > 83%
   * - F1-Score
     - > 0.86
     - > 0.83
   * - ROC-AUC
     - > 0.90
     - > 0.88

Inferencia
----------

Ejemplo de uso del modelo para inferencia:

.. code-block:: python

   import torch
   import numpy as np
   from app.models.lstm_model import PoseLSTM
   
   # Cargar modelo
   model = PoseLSTM(
       input_size=18,
       hidden_size=128,
       num_layers=2,
       num_classes=2,
       dropout=0.3
   )
   
   checkpoint = torch.load('models/pose_lstm_best.pth')
   model.load_state_dict(checkpoint['model_state_dict'])
   model.eval()
   
   # Preparar entrada
   sequence = np.random.randn(30, 18)  # Secuencia normalizada
   input_tensor = torch.FloatTensor(sequence).unsqueeze(0)  # (1, 30, 18)
   
   # Inferencia
   with torch.no_grad():
       logits = model(input_tensor)
       probabilities = torch.softmax(logits, dim=1)
       prediction = torch.argmax(probabilities, dim=1)
   
   print(f"Predicción: {'correcto' if prediction.item() == 1 else 'incorrecto'}")
   print(f"Confianza: {probabilities[0][prediction].item():.2%}")

Optimizaciones
--------------

GPU Acceleration
~~~~~~~~~~~~~~~~

El modelo soporta aceleración GPU:

.. code-block:: python

   device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   model = model.to(device)
   
   # Inferencia en GPU
   input_tensor = input_tensor.to(device)
   logits = model(input_tensor)

**Speedup esperado**: 5-10x más rápido en GPU vs CPU

Mixed Precision
~~~~~~~~~~~~~~~

Para entrenamiento más rápido:

.. code-block:: python

   from torch.cuda.amp import autocast, GradScaler
   
   scaler = GradScaler()
   
   with autocast():
       logits = model(input_tensor)
       loss = criterion(logits, labels)
   
   scaler.scale(loss).backward()
   scaler.step(optimizer)
   scaler.update()

Model Quantization
~~~~~~~~~~~~~~~~~~

Para inferencia más rápida en producción:

.. code-block:: python

   # Quantización dinámica
   quantized_model = torch.quantization.quantize_dynamic(
       model,
       {nn.LSTM, nn.Linear},
       dtype=torch.qint8
   )
   
   # Modelo más pequeño y rápido

Limitaciones
------------

* **Datos sintéticos**: Modelo actual entrenado con datos sintéticos
* **Tipos de ejercicio**: Optimizado para ejercicios de brazos
* **Variabilidad**: Puede tener dificultades con variaciones extremas
* **Oclusiones**: No maneja bien oclusiones parciales

Mejoras Futuras
---------------

1. **Datos reales**: Reentrenar con 500+ ejercicios reales etiquetados
2. **Attention mechanism**: Agregar capa de atención para mejor interpretabilidad
3. **Multi-task learning**: Predecir tipo de ejercicio y corrección simultáneamente
4. **Transfer learning**: Usar modelos pre-entrenados en datasets de poses
5. **Ensemble**: Combinar múltiples modelos para mayor robustez

Ver También
-----------

* :doc:`training` - Proceso de entrenamiento
* :doc:`evaluation` - Evaluación del modelo
* :doc:`../api/services` - InferenceService para usar el modelo
