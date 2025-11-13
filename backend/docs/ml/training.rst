Entrenamiento del Modelo
=========================

Esta sección describe el proceso completo de entrenamiento del modelo LSTM.

Preparación de Datos
--------------------

Dataset Sintético
~~~~~~~~~~~~~~~~~

Para pruebas iniciales, se genera un dataset sintético:

.. code-block:: python

   from training.dataset import create_synthetic_dataset
   
   # Generar 2000 muestras
   sequences, labels = create_synthetic_dataset(
       num_samples=2000,
       sequence_length=30,
       input_size=18
   )
   
   print(f"Secuencias: {sequences.shape}")  # (2000, 30, 18)
   print(f"Etiquetas: {labels.shape}")      # (2000,)

Dataset Real
~~~~~~~~~~~~

Para entrenar con datos reales recolectados:

.. code-block:: python

   from app.services.data_storage import DataStorageService
   import numpy as np
   
   # Exportar dataset
   storage = DataStorageService()
   dataset_path = storage.export_dataset_for_training()
   
   # Cargar dataset
   data = np.load(dataset_path)
   sequences = data['sequences']  # (N, 30, 18)
   labels = data['labels']        # (N,)
   metadata = data['metadata']

División del Dataset
~~~~~~~~~~~~~~~~~~~~

El dataset se divide en train/validation/test:

.. code-block:: python

   from training.dataset import split_dataset
   
   train_data, val_data, test_data = split_dataset(
       sequences,
       labels,
       train_ratio=0.7,
       val_ratio=0.15,
       test_ratio=0.15
   )

**Proporciones**:

* Training: 70% (1400 muestras)
* Validation: 15% (300 muestras)
* Test: 15% (300 muestras)

DataLoaders
~~~~~~~~~~~

Crear DataLoaders para entrenamiento eficiente:

.. code-block:: python

   from training.dataset import create_dataloaders
   
   train_loader, val_loader, test_loader = create_dataloaders(
       train_data,
       val_data,
       test_data,
       batch_size=32,
       shuffle=True
   )

Configuración de Entrenamiento
-------------------------------

Hiperparámetros
~~~~~~~~~~~~~~~

.. code-block:: python

   config = {
       # Modelo
       'input_size': 18,
       'hidden_size': 128,
       'num_layers': 2,
       'num_classes': 2,
       'dropout': 0.3,
       
       # Entrenamiento
       'batch_size': 32,
       'num_epochs': 50,
       'learning_rate': 0.001,
       'weight_decay': 0.0001,
       
       # Scheduler
       'scheduler_factor': 0.5,
       'scheduler_patience': 5,
       
       # Early stopping
       'early_stopping_patience': 10,
       
       # Checkpoints
       'save_best': True,
       'save_every': 5
   }

Inicialización del Modelo
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from app.models.lstm_model import PoseLSTM
   import torch
   
   device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   
   model = PoseLSTM(
       input_size=config['input_size'],
       hidden_size=config['hidden_size'],
       num_layers=config['num_layers'],
       num_classes=config['num_classes'],
       dropout=config['dropout']
   ).to(device)
   
   print(f"Modelo en: {device}")
   print(f"Parámetros: {sum(p.numel() for p in model.parameters()):,}")

Función de Pérdida y Optimizador
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Pérdida
   criterion = torch.nn.CrossEntropyLoss()
   
   # Optimizador
   optimizer = torch.optim.Adam(
       model.parameters(),
       lr=config['learning_rate'],
       weight_decay=config['weight_decay']
   )
   
   # Scheduler
   scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
       optimizer,
       mode='min',
       factor=config['scheduler_factor'],
       patience=config['scheduler_patience'],
       verbose=True
   )

Proceso de Entrenamiento
-------------------------

Loop de Entrenamiento
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from training.train_lstm import Trainer
   
   trainer = Trainer(
       model=model,
       train_loader=train_loader,
       val_loader=val_loader,
       criterion=criterion,
       optimizer=optimizer,
       scheduler=scheduler,
       device=device,
       config=config
   )
   
   # Entrenar
   history = trainer.train(num_epochs=config['num_epochs'])

Epoch Loop
~~~~~~~~~~

Cada época consiste en:

1. **Training Phase**:
   
   .. code-block:: python
   
      model.train()
      for batch_idx, (sequences, labels) in enumerate(train_loader):
          # Forward pass
          logits = model(sequences)
          loss = criterion(logits, labels)
          
          # Backward pass
          optimizer.zero_grad()
          loss.backward()
          
          # Gradient clipping
          torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
          
          # Update weights
          optimizer.step()

2. **Validation Phase**:
   
   .. code-block:: python
   
      model.eval()
      with torch.no_grad():
          for sequences, labels in val_loader:
              logits = model(sequences)
              loss = criterion(logits, labels)
              
              # Calcular métricas
              predictions = torch.argmax(logits, dim=1)
              accuracy = (predictions == labels).float().mean()

3. **Scheduler Step**:
   
   .. code-block:: python
   
      scheduler.step(val_loss)

4. **Save Checkpoint**:
   
   .. code-block:: python
   
      if val_loss < best_val_loss:
          torch.save({
              'epoch': epoch,
              'model_state_dict': model.state_dict(),
              'optimizer_state_dict': optimizer.state_dict(),
              'val_loss': val_loss,
              'val_accuracy': val_accuracy
          }, 'models/pose_lstm_best.pth')

Gradient Clipping
~~~~~~~~~~~~~~~~~

Para evitar explosión de gradientes:

.. code-block:: python

   torch.nn.utils.clip_grad_norm_(
       model.parameters(),
       max_norm=1.0
   )

**Efecto**: Limita la norma de los gradientes a 1.0

Early Stopping
~~~~~~~~~~~~~~

Detiene el entrenamiento si no hay mejora:

.. code-block:: python

   if val_loss < best_val_loss:
       best_val_loss = val_loss
       patience_counter = 0
   else:
       patience_counter += 1
   
   if patience_counter >= early_stopping_patience:
       print("Early stopping triggered")
       break

Monitoreo del Entrenamiento
----------------------------

Métricas por Época
~~~~~~~~~~~~~~~~~~

.. code-block:: text

   Epoch 1/50
   ├─ Train Loss: 0.6234
   ├─ Train Acc:  65.23%
   ├─ Val Loss:   0.5891
   ├─ Val Acc:    68.45%
   └─ LR:         0.001000
   
   Epoch 2/50
   ├─ Train Loss: 0.4567
   ├─ Train Acc:  78.91%
   ├─ Val Loss:   0.4234
   ├─ Val Acc:    81.23%
   └─ LR:         0.001000

Historial de Entrenamiento
~~~~~~~~~~~~~~~~~~~~~~~~~~~

El historial se guarda en JSON:

.. code-block:: json

   {
     "train_loss": [0.6234, 0.4567, ...],
     "train_accuracy": [0.6523, 0.7891, ...],
     "val_loss": [0.5891, 0.4234, ...],
     "val_accuracy": [0.6845, 0.8123, ...],
     "learning_rates": [0.001, 0.001, ...]
   }

Visualización
~~~~~~~~~~~~~

.. code-block:: python

   import matplotlib.pyplot as plt
   import json
   
   # Cargar historial
   with open('models/pose_lstm_history.json', 'r') as f:
       history = json.load(f)
   
   # Plot pérdida
   plt.figure(figsize=(12, 4))
   
   plt.subplot(1, 2, 1)
   plt.plot(history['train_loss'], label='Train')
   plt.plot(history['val_loss'], label='Validation')
   plt.xlabel('Epoch')
   plt.ylabel('Loss')
   plt.legend()
   plt.title('Training and Validation Loss')
   
   plt.subplot(1, 2, 2)
   plt.plot(history['train_accuracy'], label='Train')
   plt.plot(history['val_accuracy'], label='Validation')
   plt.xlabel('Epoch')
   plt.ylabel('Accuracy')
   plt.legend()
   plt.title('Training and Validation Accuracy')
   
   plt.tight_layout()
   plt.savefig('training_curves.png')

Checkpoints
-----------

Tipos de Checkpoints
~~~~~~~~~~~~~~~~~~~~

1. **Best Model** (``pose_lstm_best.pth``):
   
   Guardado cuando val_loss mejora

2. **Final Model** (``pose_lstm_final.pth``):
   
   Guardado al finalizar entrenamiento

3. **Periodic Checkpoints** (``pose_lstm_epoch_X.pth``):
   
   Guardado cada N épocas

Formato de Checkpoint
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   checkpoint = {
       'epoch': epoch,
       'model_state_dict': model.state_dict(),
       'optimizer_state_dict': optimizer.state_dict(),
       'scheduler_state_dict': scheduler.state_dict(),
       'train_loss': train_loss,
       'val_loss': val_loss,
       'val_accuracy': val_accuracy,
       'config': config
   }

Cargar Checkpoint
~~~~~~~~~~~~~~~~~

.. code-block:: python

   checkpoint = torch.load('models/pose_lstm_best.pth')
   
   model.load_state_dict(checkpoint['model_state_dict'])
   optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
   
   start_epoch = checkpoint['epoch'] + 1
   best_val_loss = checkpoint['val_loss']

Reanudar Entrenamiento
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Cargar checkpoint
   checkpoint = torch.load('models/pose_lstm_best.pth')
   model.load_state_dict(checkpoint['model_state_dict'])
   optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
   
   # Continuar entrenamiento
   trainer.train(
       num_epochs=100,
       start_epoch=checkpoint['epoch'] + 1
   )

Entrenamiento con Datos Reales
-------------------------------

Workflow Completo
~~~~~~~~~~~~~~~~~

1. **Recolectar datos** (500+ ejercicios etiquetados):
   
   .. code-block:: python
   
      # Frontend: Usuario realiza ejercicios y los etiqueta
      # Backend: Guarda en data/exercises/

2. **Exportar dataset**:
   
   .. code-block:: python
   
      storage = DataStorageService()
      dataset_path = storage.export_dataset_for_training()

3. **Modificar script de entrenamiento**:
   
   .. code-block:: python
   
      # En training/train_lstm.py
      # Cambiar de datos sintéticos a reales
      data = np.load('data/dataset/dataset_latest.npz')
      sequences = data['sequences']
      labels = data['labels']

4. **Entrenar modelo**:
   
   .. code-block:: bash
   
      python training/train_lstm.py

5. **Evaluar modelo**:
   
   .. code-block:: bash
   
      python training/evaluate.py

6. **Reemplazar modelo en producción**:
   
   .. code-block:: bash
   
      cp models/pose_lstm_best.pth models/pose_lstm_production.pth

Mejores Prácticas
-----------------

Data Augmentation
~~~~~~~~~~~~~~~~~

Para mejorar generalización:

.. code-block:: python

   def augment_sequence(sequence):
       # Ruido gaussiano
       noise = np.random.normal(0, 0.01, sequence.shape)
       augmented = sequence + noise
       
       # Flip horizontal
       if np.random.rand() > 0.5:
           augmented = flip_horizontal(augmented)
       
       # Time warping
       if np.random.rand() > 0.5:
           augmented = time_warp(augmented)
       
       return augmented

Balanceo de Clases
~~~~~~~~~~~~~~~~~~

Si hay desbalance:

.. code-block:: python

   from torch.utils.data import WeightedRandomSampler
   
   # Calcular pesos
   class_counts = np.bincount(labels)
   class_weights = 1.0 / class_counts
   sample_weights = class_weights[labels]
   
   # Crear sampler
   sampler = WeightedRandomSampler(
       weights=sample_weights,
       num_samples=len(sample_weights),
       replacement=True
   )
   
   # Usar en DataLoader
   train_loader = DataLoader(
       train_dataset,
       batch_size=32,
       sampler=sampler
   )

Regularización
~~~~~~~~~~~~~~

Técnicas adicionales:

* **L2 regularization**: weight_decay en optimizer
* **Dropout**: Ya implementado (0.3)
* **Batch normalization**: Considerar agregar
* **Label smoothing**: Para evitar overconfidence

Troubleshooting
---------------

Overfitting
~~~~~~~~~~~

**Síntomas**: Train accuracy >> Val accuracy

**Soluciones**:

* Aumentar dropout
* Agregar más datos
* Data augmentation
* Reducir complejidad del modelo

Underfitting
~~~~~~~~~~~~

**Síntomas**: Train accuracy y Val accuracy bajas

**Soluciones**:

* Aumentar complejidad del modelo
* Entrenar más épocas
* Reducir regularización
* Verificar calidad de datos

Gradientes que Explotan
~~~~~~~~~~~~~~~~~~~~~~~~

**Síntomas**: Loss = NaN, gradientes muy grandes

**Soluciones**:

* Gradient clipping (ya implementado)
* Reducir learning rate
* Verificar inicialización de pesos

Convergencia Lenta
~~~~~~~~~~~~~~~~~~

**Síntomas**: Loss disminuye muy lentamente

**Soluciones**:

* Aumentar learning rate
* Usar learning rate warmup
* Verificar normalización de datos
* Probar otro optimizador (AdamW, SGD)

Ver También
-----------

* :doc:`lstm_model` - Arquitectura del modelo
* :doc:`evaluation` - Evaluación del modelo
* :doc:`../api/services` - Servicios de inferencia
