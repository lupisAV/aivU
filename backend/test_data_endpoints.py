"""
Script para probar los endpoints de recoleccion de datos
"""
import requests
import numpy as np
import json
import sys
import io

# Configurar encoding para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000/api/data"

print("=" * 60)
print("TEST DE ENDPOINTS DE RECOLECCION DE DATOS")
print("=" * 60)

# 1. Probar guardar ejercicio
print("\n[1] Probando guardar ejercicio...")
try:
    # Crear secuencia sintética
    sequence = np.random.randn(30, 18).tolist()
    
    exercise_data = {
        "sequence": sequence,
        "label": 1,  # Correcto
        "user_id": "test_user_123",
        "exercise_type": "bicep_curl",
        "metadata": {
            "notes": "Ejercicio de prueba",
            "test": True
        }
    }
    
    response = requests.post(f"{BASE_URL}/exercise", json=exercise_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   OK - Ejercicio guardado: {result['exercise_id']}")
        print(f"   Ruta: {result['saved_path']}")
        exercise_id = result['exercise_id']
    else:
        print(f"   ERROR: {response.status_code}")
        print(f"   {response.text}")
        exercise_id = None

except Exception as e:
    print(f"   ERROR: {str(e)}")
    exercise_id = None

# 2. Probar listar ejercicios
print("\n[2] Probando listar ejercicios...")
try:
    response = requests.get(f"{BASE_URL}/exercises?limit=5")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   OK - Ejercicios encontrados: {result['count']}")
        if result['count'] > 0:
            print(f"   Primer ejercicio:")
            first = result['exercises'][0]
            print(f"      - ID: {first['exercise_id']}")
            print(f"      - Tipo: {first['exercise_type']}")
            print(f"      - Label: {first['label_name']}")
    else:
        print(f"   ERROR: {response.status_code}")

except Exception as e:
    print(f"   ERROR: {str(e)}")

# 3. Probar obtener ejercicio específico
if exercise_id:
    print(f"\n[3] Probando obtener ejercicio especifico...")
    try:
        response = requests.get(f"{BASE_URL}/exercise/{exercise_id}")
        
        if response.status_code == 200:
            result = response.json()
            exercise = result['exercise']
            print(f"   OK - Ejercicio obtenido:")
            print(f"      - ID: {exercise['exercise_id']}")
            print(f"      - Usuario: {exercise['user_id']}")
            print(f"      - Tipo: {exercise['exercise_type']}")
            print(f"      - Label: {exercise['label_name']}")
            print(f"      - Timestamp: {exercise['timestamp']}")
        else:
            print(f"   ERROR: {response.status_code}")

    except Exception as e:
        print(f"   ERROR: {str(e)}")

# 4. Probar guardar sesión
print("\n[4] Probando guardar sesion...")
try:
    session_data = {
        "session_id": "test_session_123",
        "user_id": "test_user_123",
        "start_time": "2025-11-04T02:00:00",
        "end_time": "2025-11-04T02:15:00",
        "total_reps": 10,
        "correct_reps": 8,
        "incorrect_reps": 2,
        "average_confidence": 0.92,
        "exercises": [
            {"classification": "correcto", "confidence": 0.95},
            {"classification": "correcto", "confidence": 0.89}
        ]
    }
    
    response = requests.post(f"{BASE_URL}/session", json=session_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   OK - Sesion guardada: {result['session_id']}")
        print(f"   Ruta: {result['saved_path']}")
        session_id = result['session_id']
    else:
        print(f"   ERROR: {response.status_code}")
        print(f"   {response.text}")
        session_id = None

except Exception as e:
    print(f"   ERROR: {str(e)}")
    session_id = None

# 5. Probar listar sesiones
print("\n[5] Probando listar sesiones...")
try:
    response = requests.get(f"{BASE_URL}/sessions?limit=5")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   OK - Sesiones encontradas: {result['count']}")
        if result['count'] > 0:
            print(f"   Primera sesion:")
            first = result['sessions'][0]
            print(f"      - ID: {first['session_id']}")
            print(f"      - Total reps: {first['total_reps']}")
            print(f"      - Correctas: {first['correct_reps']}")
    else:
        print(f"   ERROR: {response.status_code}")

except Exception as e:
    print(f"   ERROR: {str(e)}")

# 6. Probar estadísticas
print("\n[6] Probando estadisticas del dataset...")
try:
    response = requests.get(f"{BASE_URL}/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print(f"   OK - Estadisticas obtenidas:")
        print(f"      - Total ejercicios: {stats['total_exercises']}")
        print(f"      - Correctos: {stats['correct_exercises']}")
        print(f"      - Incorrectos: {stats['incorrect_exercises']}")
        print(f"      - Usuarios: {len(stats['users'])}")
        print(f"      - Tipos: {stats['exercise_types']}")
    else:
        print(f"   ERROR: {response.status_code}")

except Exception as e:
    print(f"   ERROR: {str(e)}")

# 7. Probar exportar dataset
print("\n[7] Probando exportar dataset...")
try:
    response = requests.post(f"{BASE_URL}/export-dataset")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   OK - Dataset exportado:")
        print(f"      - Total muestras: {result['info']['total_samples']}")
        print(f"      - Shape: {result['info']['shape']}")
        print(f"      - Distribución: {result['info']['class_distribution']}")
        print(f"      - Ruta: {result['info']['output_path']}")
    else:
        print(f"   ERROR: {response.status_code}")

except Exception as e:
    print(f"   ERROR: {str(e)}")

print("\n" + "=" * 60)
print("PRUEBAS COMPLETADAS")
print("=" * 60)
print("\nAhora puedes probar el frontend en:")
print("   http://localhost:4200")
print("\nPara probar manualmente:")
print("   1. Abre la aplicación en el navegador")
print("   2. Inicia la cámara")
print("   3. Realiza un ejercicio (espera 30 frames)")
print("   4. Presiona 'Guardar Ejercicio'")
print("   5. Etiqueta el ejercicio")
print("   6. Verifica que se guardó en backend/data/exercises/")
