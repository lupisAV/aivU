Evaluación del Modelo
======================

Esta sección describe cómo evaluar el modelo LSTM entrenado.

Script de Evaluación
---------------------

Uso Básico
~~~~~~~~~~

.. code-block:: bash

   python training/evaluate.py

Esto generará:

* Métricas de clasificación
* Matriz de confusión
* Curva ROC
* Gráficas comparativas
* Reporte en JSON

Métricas Principales
--------------------

Accuracy
~~~~~~~~

Proporción de predicciones correctas:

.. math::

   \text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}

**Interpretación**:

* > 90%: Excelente
* 85-90%: Muy bueno
* 80-85%: Bueno
* < 80%: Necesita mejora

Precision
~~~~~~~~~

Proporción de predicciones positivas correctas:

.. math::

   \text{Precision} = \frac{TP}{TP + FP}

**Interpretación**:

* Alta precision: Pocas falsas alarmas
* Importante cuando el costo de FP es alto

Recall (Sensitivity)
~~~~~~~~~~~~~~~~~~~~

Proporción de positivos reales detectados:

.. math::

   \text{Recall} = \frac{TP}{TP + FN}

**Interpretación**:

* Alto recall: Detecta la mayoría de casos positivos
* Importante cuando el costo de FN es alto

F1-Score
~~~~~~~~

Media armónica de precision y recall:

.. math::

   \text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}

**Interpretación**:

* Balance entre precision y recall
* Útil cuando las clases están desbalanceadas

ROC-AUC
~~~~~~~

Área bajo la curva ROC:

.. math::

   \text{AUC} = \int_0^1 \text{TPR}(t) \, d(\text{FPR}(t))

**Interpretación**:

* 1.0: Clasificador perfecto
* 0.9-1.0: Excelente
* 0.8-0.9: Muy bueno
* 0.7-0.8: Bueno
* 0.5: Random (inútil)

Matriz de Confusión
-------------------

Visualización
~~~~~~~~~~~~~

.. code-block:: text

                   Predicted
                 Incorrecto  Correcto
   Actual  Incorrecto    TN        FP
           Correcto      FN        TP

Interpretación
~~~~~~~~~~~~~~

* **True Negatives (TN)**: Ejercicios incorrectos correctamente clasificados
* **False Positives (FP)**: Ejercicios incorrectos clasificados como correctos
* **False Negatives (FN)**: Ejercicios correctos clasificados como incorrectos
* **True Positives (TP)**: Ejercicios correctos correctamente clasificados

Ejemplo
~~~~~~~

.. code-block:: python

   from sklearn.metrics import confusion_matrix
   import seaborn as sns
   import matplotlib.pyplot as plt
   
   # Calcular matriz
   cm = confusion_matrix(y_true, y_pred)
   
   # Visualizar
   plt.figure(figsize=(8, 6))
   sns.heatmap(
       cm,
       annot=True,
       fmt='d',
       cmap='Blues',
       xticklabels=['Incorrecto', 'Correcto'],
       yticklabels=['Incorrecto', 'Correcto']
   )
   plt.ylabel('Actual')
   plt.xlabel('Predicho')
   plt.title('Matriz de Confusión')
   plt.savefig('evaluation/confusion_matrix.png')

Curva ROC
---------

Descripción
~~~~~~~~~~~

La curva ROC muestra la relación entre:

* **TPR (True Positive Rate)**: Recall
* **FPR (False Positive Rate)**: 1 - Specificity

Generación
~~~~~~~~~~

.. code-block:: python

   from sklearn.metrics import roc_curve, auc
   import matplotlib.pyplot as plt
   
   # Calcular curva ROC
   fpr, tpr, thresholds = roc_curve(y_true, y_scores)
   roc_auc = auc(fpr, tpr)
   
   # Visualizar
   plt.figure(figsize=(8, 6))
   plt.plot(fpr, tpr, color='darkorange', lw=2,
            label=f'ROC curve (AUC = {roc_auc:.2f})')
   plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--',
            label='Random classifier')
   plt.xlim([0.0, 1.0])
   plt.ylim([0.0, 1.05])
   plt.xlabel('False Positive Rate')
   plt.ylabel('True Positive Rate')
   plt.title('Receiver Operating Characteristic (ROC) Curve')
   plt.legend(loc="lower right")
   plt.grid(alpha=0.3)
   plt.savefig('evaluation/roc_curve.png')

Interpretación
~~~~~~~~~~~~~~

* **Curva cerca de la esquina superior izquierda**: Buen clasificador
* **Curva cerca de la diagonal**: Clasificador aleatorio
* **AUC alto**: Mejor capacidad de discriminación

Classification Report
---------------------

Reporte Completo
~~~~~~~~~~~~~~~~

.. code-block:: python

   from sklearn.metrics import classification_report
   
   report = classification_report(
       y_true,
       y_pred,
       target_names=['Incorrecto', 'Correcto'],
       digits=4
   )
   
   print(report)

Ejemplo de Salida
~~~~~~~~~~~~~~~~~

.. code-block:: text

                 precision    recall  f1-score   support

    Incorrecto     0.8750    0.9000    0.8873       150
      Correcto     0.9000    0.8750    0.8873       150

      accuracy                         0.8875       300
     macro avg     0.8875    0.8875    0.8873       300
  weighted avg     0.8875    0.8875    0.8873       300

Métricas por Clase
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from sklearn.metrics import precision_recall_fscore_support
   
   precision, recall, f1, support = precision_recall_fscore_support(
       y_true,
       y_pred,
       average=None
   )
   
   for i, class_name in enumerate(['Incorrecto', 'Correcto']):
       print(f"{class_name}:")
       print(f"  Precision: {precision[i]:.4f}")
       print(f"  Recall:    {recall[i]:.4f}")
       print(f"  F1-Score:  {f1[i]:.4f}")
       print(f"  Support:   {support[i]}")

Evaluación Completa
-------------------

Script de Evaluación
~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import torch
   import numpy as np
   from sklearn.metrics import (
       accuracy_score,
       precision_recall_fscore_support,
       confusion_matrix,
       roc_auc_score,
       classification_report
   )
   
   def evaluate_model(model, test_loader, device):
       model.eval()
       
       all_predictions = []
       all_labels = []
       all_probabilities = []
       
       with torch.no_grad():
           for sequences, labels in test_loader:
               sequences = sequences.to(device)
               labels = labels.to(device)
               
               # Forward pass
               logits = model(sequences)
               probabilities = torch.softmax(logits, dim=1)
               predictions = torch.argmax(probabilities, dim=1)
               
               # Guardar resultados
               all_predictions.extend(predictions.cpu().numpy())
               all_labels.extend(labels.cpu().numpy())
               all_probabilities.extend(probabilities[:, 1].cpu().numpy())
       
       # Convertir a arrays
       y_true = np.array(all_labels)
       y_pred = np.array(all_predictions)
       y_scores = np.array(all_probabilities)
       
       # Calcular métricas
       accuracy = accuracy_score(y_true, y_pred)
       precision, recall, f1, _ = precision_recall_fscore_support(
           y_true, y_pred, average='binary'
       )
       roc_auc = roc_auc_score(y_true, y_scores)
       cm = confusion_matrix(y_true, y_pred)
       
       # Reporte
       report = {
           'accuracy': float(accuracy),
           'precision': float(precision),
           'recall': float(recall),
           'f1_score': float(f1),
           'roc_auc': float(roc_auc),
           'confusion_matrix': cm.tolist(),
           'classification_report': classification_report(
               y_true, y_pred, target_names=['Incorrecto', 'Correcto']
           )
       }
       
       return report

Guardar Resultados
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import json
   
   # Evaluar
   report = evaluate_model(model, test_loader, device)
   
   # Guardar en JSON
   with open('evaluation/pose_lstm_metrics.json', 'w') as f:
       json.dump(report, f, indent=2)
   
   # Imprimir resumen
   print(f"Accuracy:  {report['accuracy']:.4f}")
   print(f"Precision: {report['precision']:.4f}")
   print(f"Recall:    {report['recall']:.4f}")
   print(f"F1-Score:  {report['f1_score']:.4f}")
   print(f"ROC-AUC:   {report['roc_auc']:.4f}")

Visualizaciones
---------------

Comparación de Métricas
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import matplotlib.pyplot as plt
   
   metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']
   values = [
       report['accuracy'],
       report['precision'],
       report['recall'],
       report['f1_score'],
       report['roc_auc']
   ]
   
   plt.figure(figsize=(10, 6))
   bars = plt.bar(metrics, values, color=['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'])
   plt.ylim([0, 1])
   plt.ylabel('Score')
   plt.title('Métricas de Evaluación del Modelo')
   plt.grid(axis='y', alpha=0.3)
   
   # Agregar valores en las barras
   for bar in bars:
       height = bar.get_height()
       plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.3f}',
                ha='center', va='bottom')
   
   plt.tight_layout()
   plt.savefig('evaluation/metrics_comparison.png')

Distribución de Confianza
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   plt.figure(figsize=(12, 5))
   
   # Confianza para predicciones correctas
   plt.subplot(1, 2, 1)
   correct_mask = y_pred == y_true
   plt.hist(y_scores[correct_mask], bins=20, alpha=0.7, color='green')
   plt.xlabel('Confianza')
   plt.ylabel('Frecuencia')
   plt.title('Distribución de Confianza - Predicciones Correctas')
   
   # Confianza para predicciones incorrectas
   plt.subplot(1, 2, 2)
   incorrect_mask = y_pred != y_true
   plt.hist(y_scores[incorrect_mask], bins=20, alpha=0.7, color='red')
   plt.xlabel('Confianza')
   plt.ylabel('Frecuencia')
   plt.title('Distribución de Confianza - Predicciones Incorrectas')
   
   plt.tight_layout()
   plt.savefig('evaluation/confidence_distribution.png')

Análisis de Errores
-------------------

Identificar Casos Difíciles
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Encontrar predicciones incorrectas con alta confianza
   incorrect_mask = y_pred != y_true
   high_confidence_errors = y_scores[incorrect_mask] > 0.8
   
   print(f"Errores con alta confianza: {high_confidence_errors.sum()}")
   
   # Analizar estos casos
   error_indices = np.where(incorrect_mask)[0]
   for idx in error_indices[:5]:  # Primeros 5 errores
       print(f"\nEjercicio {idx}:")
       print(f"  Etiqueta real: {y_true[idx]}")
       print(f"  Predicción: {y_pred[idx]}")
       print(f"  Confianza: {y_scores[idx]:.4f}")

Análisis por Tipo de Ejercicio
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Si tienes metadatos de tipo de ejercicio:

.. code-block:: python

   from collections import defaultdict
   
   metrics_by_type = defaultdict(lambda: {'correct': 0, 'total': 0})
   
   for i, (pred, true, ex_type) in enumerate(zip(y_pred, y_true, exercise_types)):
       metrics_by_type[ex_type]['total'] += 1
       if pred == true:
           metrics_by_type[ex_type]['correct'] += 1
   
   # Imprimir accuracy por tipo
   for ex_type, metrics in metrics_by_type.items():
       accuracy = metrics['correct'] / metrics['total']
       print(f"{ex_type}: {accuracy:.2%} ({metrics['correct']}/{metrics['total']})")

Cross-Validation
----------------

K-Fold Cross-Validation
~~~~~~~~~~~~~~~~~~~~~~~

Para evaluación más robusta:

.. code-block:: python

   from sklearn.model_selection import KFold
   
   kfold = KFold(n_splits=5, shuffle=True, random_state=42)
   
   fold_results = []
   
   for fold, (train_idx, val_idx) in enumerate(kfold.split(sequences)):
       print(f"\nFold {fold + 1}/5")
       
       # Dividir datos
       train_sequences = sequences[train_idx]
       train_labels = labels[train_idx]
       val_sequences = sequences[val_idx]
       val_labels = labels[val_idx]
       
       # Entrenar modelo
       model = train_model(train_sequences, train_labels)
       
       # Evaluar
       report = evaluate_model(model, val_sequences, val_labels)
       fold_results.append(report)
   
   # Promediar resultados
   avg_accuracy = np.mean([r['accuracy'] for r in fold_results])
   std_accuracy = np.std([r['accuracy'] for r in fold_results])
   
   print(f"\nAccuracy promedio: {avg_accuracy:.4f} ± {std_accuracy:.4f}")

Benchmarking
------------

Comparación con Baseline
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Baseline: Clasificador aleatorio
   random_predictions = np.random.randint(0, 2, size=len(y_true))
   random_accuracy = accuracy_score(y_true, random_predictions)
   
   # Baseline: Clasificador mayoritario
   majority_class = np.bincount(y_true).argmax()
   majority_predictions = np.full(len(y_true), majority_class)
   majority_accuracy = accuracy_score(y_true, majority_predictions)
   
   print(f"Random classifier:   {random_accuracy:.4f}")
   print(f"Majority classifier: {majority_accuracy:.4f}")
   print(f"LSTM model:          {report['accuracy']:.4f}")

Comparación con Otros Modelos
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   models_comparison = {
       'Random Forest': 0.82,
       'SVM': 0.85,
       'Simple LSTM': 0.87,
       'Bidirectional LSTM': report['accuracy'],
       'LSTM + Attention': 0.91  # Modelo futuro
   }
   
   plt.figure(figsize=(10, 6))
   plt.barh(list(models_comparison.keys()), list(models_comparison.values()))
   plt.xlabel('Accuracy')
   plt.title('Comparación de Modelos')
   plt.xlim([0.7, 1.0])
   plt.grid(axis='x', alpha=0.3)
   plt.tight_layout()
   plt.savefig('evaluation/models_comparison.png')

Reporte Final
-------------

Generar Reporte Completo
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   def generate_evaluation_report(model, test_loader, device, output_dir='evaluation'):
       import os
       os.makedirs(output_dir, exist_ok=True)
       
       # Evaluar modelo
       report = evaluate_model(model, test_loader, device)
       
       # Guardar métricas
       with open(f'{output_dir}/metrics.json', 'w') as f:
           json.dump(report, f, indent=2)
       
       # Generar visualizaciones
       plot_confusion_matrix(report['confusion_matrix'], output_dir)
       plot_roc_curve(y_true, y_scores, output_dir)
       plot_metrics_comparison(report, output_dir)
       
       # Generar reporte en texto
       with open(f'{output_dir}/report.txt', 'w') as f:
           f.write("=== Reporte de Evaluación del Modelo ===\n\n")
           f.write(f"Accuracy:  {report['accuracy']:.4f}\n")
           f.write(f"Precision: {report['precision']:.4f}\n")
           f.write(f"Recall:    {report['recall']:.4f}\n")
           f.write(f"F1-Score:  {report['f1_score']:.4f}\n")
           f.write(f"ROC-AUC:   {report['roc_auc']:.4f}\n\n")
           f.write("Classification Report:\n")
           f.write(report['classification_report'])
       
       print(f"Reporte guardado en {output_dir}/")

Ver También
-----------

* :doc:`lstm_model` - Arquitectura del modelo
* :doc:`training` - Proceso de entrenamiento
* :doc:`../api/services` - Servicios de inferencia
