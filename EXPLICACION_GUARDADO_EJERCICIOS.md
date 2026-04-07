# 📊 ¿Qué Pasa al Guardar un Ejercicio?

## 🔄 Flujo Completo de Guardado

### Paso 1: Usuario Realiza Ejercicio

```
MediaPipe captura keypoints (30 FPS)
    ↓
ExerciseCameraComponent acumula frames
    ↓
frameBuffer: [frame1, frame2, ..., frame30]
    ↓
Cada frame: [18 valores] = 6 keypoints × 3 coordenadas (x, y, z)
```

**Ejemplo de un frame:**
```javascript
[
  0.5, 0.3, 0.1,  // Hombro izquierdo (x, y, z)
  0.4, 0.3, 0.1,  // Hombro derecho
  0.6, 0.5, 0.2,  // Codo izquierdo
  0.3, 0.5, 0.2,  // Codo derecho
  0.7, 0.7, 0.3,  // Muñeca izquierda
  0.2, 0.7, 0.3   // Muñeca derecha
]
```

**Secuencia completa (30 frames):**
```javascript
currentSequence = [
  [0.5, 0.3, 0.1, ...],  // Frame 1
  [0.5, 0.3, 0.1, ...],  // Frame 2
  ...
  [0.6, 0.4, 0.2, ...]   // Frame 30
]
// Shape: (30, 18)
```

---

### Paso 2: Usuario Presiona "Guardar Ejercicio"

```
Usuario click en botón verde 💾
    ↓
ExerciseOverlayComponent.openSaveModal()
    ↓
showSaveModal = true
    ↓
Modal aparece con opciones
```

---

### Paso 3: Usuario Etiqueta el Ejercicio

**En el Modal:**

```
┌─────────────────────────────────┐
│ ¿El ejercicio fue realizado     │
│ correctamente?                  │
│                                 │
│  [✓ Correcto]  [✗ Incorrecto]  │
│                                 │
│  Tipo: [Curl de Bíceps ▼]      │
│  Notas: [Buena forma]           │
│                                 │
│  [Cancelar]  [Guardar]          │
└─────────────────────────────────┘
```

**Usuario selecciona:**
- ✓ **Correcto** → `label = 1`
- ✗ **Incorrecto** → `label = 0`

---

### Paso 4: Datos se Envían al Backend

```typescript
// Frontend prepara los datos
const exerciseData = {
  sequence: currentSequence,        // (30, 18)
  label: 1,                         // 0 o 1
  user_id: "user_1730698800000",
  exercise_type: "bicep_curl",
  metadata: {
    notes: "Buena forma",
    session_id: "session_1730698800000",
    timestamp: "2025-11-04T02:15:00",
    confidence: 0.9598
  }
}

// Se envía al backend
POST http://localhost:8000/api/data/exercise
```

---

### Paso 5: Backend Procesa y Guarda

#### A. Validación
```python
# Backend valida el shape
if sequence.shape != (30, 18):
    return Error("Shape inválido")
```

#### B. Generación de ID Único
```python
timestamp = datetime.now()
exercise_id = f"bicep_curl_20251104_021500_123456"
```

#### C. Guardado en Formato .npz (NumPy Comprimido)
```python
# Guarda la secuencia en formato binario eficiente
np.savez_compressed(
    'data/exercises/bicep_curl_20251104_021500_123456.npz',
    sequence=sequence,  # Array (30, 18)
    label=np.array([1]) # 0 o 1
)
```

**Ventajas del .npz:**
- ✅ Comprimido (ahorra espacio)
- ✅ Rápido de cargar
- ✅ Perfecto para entrenar modelos
- ✅ Mantiene precisión numérica

#### D. Guardado en Formato .json (Metadatos)
```python
# Guarda metadatos legibles
{
  "exercise_id": "bicep_curl_20251104_021500_123456",
  "label": 1,
  "label_name": "correcto",
  "user_id": "user_1730698800000",
  "exercise_type": "bicep_curl",
  "timestamp": "2025-11-04T02:15:00.123456",
  "sequence": [[0.5, 0.3, ...], ...],  // También en JSON
  "metadata": {
    "notes": "Buena forma",
    "session_id": "session_1730698800000",
    "confidence": 0.9598
  }
}
```

**Ventajas del .json:**
- ✅ Legible por humanos
- ✅ Fácil de inspeccionar
- ✅ Útil para debugging
- ✅ Contiene toda la información

---

### Paso 6: Confirmación al Usuario

```
Backend responde:
{
  "success": true,
  "message": "Ejercicio guardado exitosamente",
  "exercise_id": "bicep_curl_20251104_021500_123456",
  "saved_path": "data/exercises/bicep_curl_20251104_021500_123456.npz"
}

Frontend muestra:
alert("Ejercicio guardado exitosamente!\nID: bicep_curl_20251104_021500_123456")

Modal se cierra
```

---

## 📁 Estructura de Archivos Guardados

```
backend/data/exercises/
├── bicep_curl_20251104_021500_123456.npz    (2.4 KB)
├── bicep_curl_20251104_021500_123456.json   (15.6 KB)
├── bicep_curl_20251104_021530_789012.npz
├── bicep_curl_20251104_021530_789012.json
└── ...
```

---

## 🎯 ¿Para Qué Sirven Estos Datos?

### 1. Entrenar el Modelo con Datos Reales

**Actualmente:**
- Modelo entrenado con datos sintéticos
- Accuracy: ~50-60%

**Con tus datos reales:**
```python
# Cargar todos los ejercicios guardados
data = np.load('data/dataset/dataset_20251104.npz')
sequences = data['sequences']  # (500, 30, 18)
labels = data['labels']        # (500,)

# Entrenar modelo
model = PoseLSTM()
trainer.train(sequences, labels)

# Resultado esperado:
# Accuracy: >85% ✅
```

### 2. Mejorar la Precisión Iterativamente

```
Recolectar 100 ejercicios
    ↓
Entrenar modelo v2
    ↓
Evaluar: 70% accuracy
    ↓
Recolectar 200 ejercicios más
    ↓
Entrenar modelo v3
    ↓
Evaluar: 85% accuracy ✅
    ↓
Recolectar 500 ejercicios más
    ↓
Entrenar modelo v4
    ↓
Evaluar: 92% accuracy ✅✅
```

### 3. Análisis de Patrones

```python
# Analizar qué hace que un ejercicio sea "correcto"
correct_exercises = load_exercises(label=1)
incorrect_exercises = load_exercises(label=0)

# Comparar patrones
analyze_differences(correct_exercises, incorrect_exercises)

# Resultados:
# - Ejercicios correctos: movimiento más suave
# - Ejercicios incorrectos: movimiento brusco
# - Ejercicios correctos: rango de movimiento completo
```

---

## 🔍 Diferencia: Correcto vs Incorrecto

### Ejercicio CORRECTO (label=1)

**Características:**
- ✅ Movimiento controlado
- ✅ Rango de movimiento completo
- ✅ Postura correcta
- ✅ Velocidad constante

**Ejemplo de secuencia:**
```
Frame 1:  Brazos abajo (inicio)
Frame 10: Brazos a media altura (subiendo suave)
Frame 20: Brazos arriba (pico del movimiento)
Frame 30: Brazos bajando (controlado)

Patrón: Curva suave y continua
```

### Ejercicio INCORRECTO (label=0)

**Características:**
- ❌ Movimiento brusco
- ❌ Rango incompleto
- ❌ Postura incorrecta
- ❌ Velocidad irregular

**Ejemplo de secuencia:**
```
Frame 1:  Brazos abajo
Frame 10: Salto brusco (movimiento rápido)
Frame 20: Brazos no llegan arriba
Frame 30: Caída rápida

Patrón: Picos y valles irregulares
```

---

## 📊 Visualización de Datos (Gráficas de Ondas)

### ¿Qué son las gráficas de ondas?

Son gráficas que muestran cómo cambian las coordenadas de los keypoints a lo largo del tiempo.

**Ejemplo: Posición Y de la muñeca izquierda**

```
Ejercicio CORRECTO:
Y
│     ╱‾‾‾╲
│   ╱       ╲
│ ╱           ╲
└──────────────────> Tiempo (frames)
  1  10  20  30

Curva suave = Movimiento controlado


Ejercicio INCORRECTO:
Y
│   ╱╲
│  ╱  ╲  ╱╲
│╱      ╲╱  ╲
└──────────────────> Tiempo (frames)
  1  10  20  30

Curva irregular = Movimiento brusco
```

### Implementación de Gráficas

Para implementar las gráficas de ondas, necesitarías:

1. **Librería de gráficas:** Chart.js o D3.js
2. **Componente nuevo:** `WaveformChartComponent`
3. **Datos:** Las secuencias guardadas

**Ejemplo con Chart.js:**
```typescript
// Graficar posición Y de muñeca izquierda
const wristYData = currentSequence.map(frame => frame[14]); // índice 14 = muñeca izq Y

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array.from({length: 30}, (_, i) => i + 1),
    datasets: [{
      label: 'Muñeca Izquierda (Y)',
      data: wristYData,
      borderColor: '#10B981',
      tension: 0.4
    }]
  }
});
```

---

## 🎓 Resumen

### Al guardar como CORRECTO (✓):
1. Se guarda con `label = 1`
2. El modelo aprenderá que ese patrón es bueno
3. Futuras predicciones similares serán clasificadas como correctas

### Al guardar como INCORRECTO (✗):
1. Se guarda con `label = 0`
2. El modelo aprenderá que ese patrón es malo
3. Futuras predicciones similares serán clasificadas como incorrectas

### Objetivo Final:
```
Recolectar 500+ ejercicios bien etiquetados
    ↓
Entrenar modelo con datos reales
    ↓
Modelo aprende patrones correctos e incorrectos
    ↓
Precisión >85%
    ↓
Sistema útil para entrenar usuarios reales ✅
```

---

**💡 Tip:** Cuantos más ejercicios guardes (bien etiquetados), mejor será el modelo. Objetivo: 250 correctos + 250 incorrectos = 500 total.
