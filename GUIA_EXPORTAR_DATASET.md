# 📦 Guía Completa: Exportar Dataset

## ✅ Ahora Tienes un Botón Fácil!

He agregado un botón en la sección de Comparación para exportar el dataset con un solo click.

---

## 🎯 Cómo Exportar Dataset (SUPER FÁCIL)

### Paso 1: Ve a la Sección de Comparación

```
http://localhost:4200/comparison
```

### Paso 2: Click en el Botón

Verás un botón morado grande que dice:

```
📦 Exportar Dataset para Entrenamiento
```

### Paso 3: Espera

El botón mostrará:
```
⏳ Exportando...
```

### Paso 4: ¡Listo!

Verás un mensaje verde con la información:

```
✅ Dataset exportado exitosamente!
📊 Total: 3 ejercicios
📈 Shape: 3 × 30 × 18
✓ Correctos: 2
✗ Incorrectos: 1
📁 Archivo: data\dataset\dataset_20251104_023500.npz
```

---

## 📊 ¿Qué Hace el Botón?

### Internamente ejecuta:

```
POST http://localhost:8000/api/data/export-dataset
```

### El backend:

1. **Lee todos los ejercicios** de `data/exercises/`
2. **Junta las secuencias** en un solo array
3. **Junta las etiquetas** en un solo array
4. **Guarda el archivo** en `data/dataset/dataset_XXXXX.npz`

### Resultado:

```python
# Archivo: data/dataset/dataset_20251104_023500.npz
{
    'sequences': array(3, 30, 18),  # 3 ejercicios, 30 frames, 18 valores
    'labels': array([1, 1, 0])      # Etiquetas: correcto, correcto, incorrecto
}
```

---

## 🎓 Entrenar con el Dataset Exportado

### Paso 1: Crear Script de Entrenamiento

Crea: `backend/train_with_real_data.py`

```python
import numpy as np
from training.dataset import split_dataset, create_dataloaders
from training.train_lstm import Trainer
from app.models.lstm_model import PoseLSTM

# 1. Cargar dataset exportado (usa el nombre del archivo que te dio el botón)
data = np.load('data/dataset/dataset_20251104_023500.npz')
sequences = data['sequences']
labels = data['labels']

print(f"📊 Dataset cargado:")
print(f"   Total: {len(sequences)} ejercicios")
print(f"   Correctos: {np.sum(labels == 1)}")
print(f"   Incorrectos: {np.sum(labels == 0)}")
print(f"   Shape: {sequences.shape}")

# 2. Verificar que tengas suficientes datos
if len(sequences) < 50:
    print("\n⚠️ ADVERTENCIA: Tienes muy pocos datos!")
    print("   Recomendado: mínimo 100 ejercicios")
    print("   Ideal: 500+ ejercicios")
    response = input("\n¿Continuar de todos modos? (s/n): ")
    if response.lower() != 's':
        exit()

# 3. Dividir dataset (70% train, 15% val, 15% test)
train_data, val_data, test_data = split_dataset(sequences, labels)

print(f"\n📈 División del dataset:")
print(f"   Train: {len(train_data[0])} ejercicios")
print(f"   Val: {len(val_data[0])} ejercicios")
print(f"   Test: {len(test_data[0])} ejercicios")

# 4. Crear dataloaders
train_loader, val_loader, test_loader = create_dataloaders(
    train_data,
    val_data,
    test_data,
    batch_size=16  # Batch pequeño si tienes pocos datos
)

# 5. Crear modelo
model = PoseLSTM(
    input_size=18,
    hidden_size=128,
    num_layers=2,
    num_classes=2
)

print(f"\n🤖 Modelo creado:")
print(f"   Parámetros: {sum(p.numel() for p in model.parameters())}")

# 6. Entrenar
print("\n🚀 Iniciando entrenamiento...")
trainer = Trainer(model, device='cpu')

history = trainer.train(
    train_loader=train_loader,
    val_loader=val_loader,
    num_epochs=50,  # Más épocas si tienes pocos datos
    learning_rate=0.001
)

print("\n✅ Entrenamiento completado!")
print(f"   Mejor accuracy: {max(history['val_accuracy']):.2%}")
print(f"   Modelo guardado en: models/pose_lstm_best.pth")

# 7. Evaluar en test set
print("\n📊 Evaluando en test set...")
from training.evaluate import evaluate_model

metrics = evaluate_model(
    model_path='models/pose_lstm_best.pth',
    test_loader=test_loader
)

print(f"\n📈 Métricas finales:")
print(f"   Accuracy: {metrics['accuracy']:.2%}")
print(f"   Precision: {metrics['precision']:.2%}")
print(f"   Recall: {metrics['recall']:.2%}")
print(f"   F1-Score: {metrics['f1']:.2%}")
```

### Paso 2: Ejecutar el Entrenamiento

```bash
cd backend
.\venv\Scripts\Activate.ps1
python train_with_real_data.py
```

### Paso 3: Reiniciar Backend

```bash
# Detener el backend actual (Ctrl+C)
# Luego reiniciar:
python run.py
```

El backend cargará automáticamente el nuevo modelo desde `models/pose_lstm_best.pth`.

---

## 🎯 Respuesta a tu Pregunta sobre Dataset Público

### ❌ NO es recomendable usar dataset público

**Razones:**

1. **Formato incompatible**
   - Datasets públicos: 25-33 keypoints
   - Tu sistema: 6 keypoints específicos

2. **Ejercicios diferentes**
   - Datasets públicos: poses generales
   - Tu sistema: ejercicios de brazos específicos

3. **Más trabajo adaptarlo que recolectar**
   - Adaptar: escribir scripts, convertir formatos, limpiar datos
   - Recolectar: solo hacer ejercicios y guardar

### ✅ Mejor opción: Recolectar tus propios datos

**Ventajas:**

- ✅ Formato correcto desde el inicio
- ✅ Ejercicios específicos que necesitas
- ✅ Control total sobre la calidad
- ✅ Puedes definir qué es "correcto" e "incorrecto"

**Tiempo estimado:**

```
10 ejercicios = 5 minutos
50 ejercicios = 25 minutos
100 ejercicios = 50 minutos
500 ejercicios = 4 horas (en varios días)
```

---

## 📋 Plan Recomendado

### Semana 1: Primeros 100 Ejercicios

**Día 1-2:** 50 ejercicios
- 25 correctos
- 25 incorrectos

**Día 3:** Exportar y entrenar
```
1. Click en "Exportar Dataset"
2. Ejecutar train_with_real_data.py
3. Reiniciar backend
4. Probar el modelo
```

**Día 4-5:** 50 ejercicios más
- 25 correctos
- 25 incorrectos

**Día 6:** Entrenar modelo v2
- Comparar con v1
- Ver mejora en precisión

### Semana 2-4: Llegar a 500

Repetir el proceso hasta tener:
- 250 correctos
- 250 incorrectos
- Precisión >85%

---

## 🔍 Verificar que el Dataset se Exportó

### Opción 1: Ver el archivo

```bash
# En PowerShell
ls backend\data\dataset\

# Deberías ver:
# dataset_20251104_023500.npz
```

### Opción 2: Cargar en Python

```python
import numpy as np

data = np.load('backend/data/dataset/dataset_20251104_023500.npz')
print(f"Sequences shape: {data['sequences'].shape}")
print(f"Labels shape: {data['labels'].shape}")
print(f"Labels: {data['labels']}")
```

---

## ✅ Resumen

### Para Exportar Dataset:

1. **Ve a:** `http://localhost:4200/comparison`
2. **Click en:** "📦 Exportar Dataset para Entrenamiento"
3. **Espera** el mensaje de confirmación
4. **Listo!** El archivo está en `backend/data/dataset/`

### Para Entrenar:

1. **Crea** el script `train_with_real_data.py`
2. **Ejecuta:** `python train_with_real_data.py`
3. **Reinicia** el backend
4. **Prueba** el nuevo modelo

### NO necesitas:

- ❌ Mover archivos manualmente
- ❌ Usar dataset público
- ❌ Escribir código complejo
- ❌ Entender POST requests

### SÍ necesitas:

- ✅ Recolectar 100+ ejercicios
- ✅ Click en el botón de exportar
- ✅ Ejecutar el script de entrenamiento
- ✅ Paciencia para recolectar datos de calidad

---

**🎯 Tu próximo paso:** Recolecta más ejercicios (especialmente incorrectos) hasta tener al menos 50-100 en total, luego exporta y entrena tu primer modelo con datos reales!
