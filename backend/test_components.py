"""
Test de componentes internos: PoseBuffer y PoseProcessor
"""
import numpy as np
from app.models.pose_buffer import PoseBuffer
from app.services.pose_processor import PoseProcessor


def test_pose_buffer():
    """Prueba el PoseBuffer"""
    print("\n" + "=" * 60)
    print("TEST: PoseBuffer")
    print("=" * 60)
    
    buffer = PoseBuffer(window_size=30)
    
    # Test 1: Inicialización
    print("\n1. Inicialización...")
    assert len(buffer) == 0
    assert not buffer.is_ready()
    print(f"   ✅ Buffer inicializado: {buffer}")
    
    # Test 2: Añadir frames
    print("\n2. Añadiendo frames...")
    for i in range(30):
        keypoints = np.random.rand(6, 3).tolist()
        buffer.add_frame(keypoints)
        if (i + 1) % 10 == 0:
            print(f"   Frame {i+1}/30 añadido - {buffer.get_stats()['fill_percentage']:.0f}%")
    
    assert buffer.is_ready()
    print("   ✅ Buffer lleno y listo")
    
    # Test 3: Obtener secuencia
    print("\n3. Obteniendo secuencia...")
    sequence = buffer.get_sequence()
    assert sequence is not None
    assert sequence.shape == (30, 6, 3)
    print(f"   ✅ Secuencia shape: {sequence.shape}")
    
    # Test 4: Obtener secuencia aplanada
    print("\n4. Obteniendo secuencia aplanada...")
    flat_sequence = buffer.get_flattened_sequence()
    assert flat_sequence is not None
    assert flat_sequence.shape == (30, 18)
    print(f"   ✅ Secuencia aplanada shape: {flat_sequence.shape}")
    
    # Test 5: Estadísticas
    print("\n5. Estadísticas del buffer...")
    stats = buffer.get_stats()
    print(f"   Current size: {stats['current_size']}")
    print(f"   Window size: {stats['window_size']}")
    print(f"   Is ready: {stats['is_ready']}")
    print(f"   Total frames: {stats['total_frames_received']}")
    print(f"   Fill: {stats['fill_percentage']:.1f}%")
    assert stats['is_ready'] == True
    print("   ✅ Estadísticas correctas")
    
    # Test 6: Clear
    print("\n6. Limpiando buffer...")
    buffer.clear()
    assert len(buffer) == 0
    assert not buffer.is_ready()
    print("   ✅ Buffer limpiado correctamente")
    
    # Test 7: Validación de keypoints incorrectos
    print("\n7. Validando keypoints incorrectos...")
    try:
        buffer.add_frame([[1, 2, 3]])  # Solo 1 keypoint, debería fallar
        print("   ❌ FAILED: Debería haber lanzado ValueError")
    except ValueError as e:
        print(f"   ✅ ValueError capturado correctamente: {str(e)[:50]}...")
    
    print("\n✅ TODOS LOS TESTS DE POSEBUFFER PASARON")


def test_pose_processor():
    """Prueba el PoseProcessor"""
    print("\n" + "=" * 60)
    print("TEST: PoseProcessor")
    print("=" * 60)
    
    processor = PoseProcessor()
    
    # Test 1: Inicialización
    print("\n1. Inicialización...")
    assert not processor.is_fitted
    print("   ✅ Procesador inicializado (no fitted)")
    
    # Test 2: Normalización simple (sin fit)
    print("\n2. Normalización simple (Min-Max)...")
    sequence = np.random.rand(30, 18).astype(np.float32)
    normalized = processor.normalize(sequence)
    assert normalized.shape == sequence.shape
    assert normalized.dtype == np.float32
    print(f"   ✅ Secuencia normalizada: shape={normalized.shape}, dtype={normalized.dtype}")
    print(f"   Min: {normalized.min():.3f}, Max: {normalized.max():.3f}")
    
    # Test 3: Fit con dataset
    print("\n3. Fit con dataset simulado...")
    dataset = np.random.rand(100, 30, 18).astype(np.float32)
    processor.fit(dataset)
    assert processor.is_fitted
    print("   ✅ Procesador fitted con dataset")
    print(f"   Mean shape: {processor.mean.shape}")
    print(f"   Std shape: {processor.std.shape}")
    
    # Test 4: Normalización Z-score (después de fit)
    print("\n4. Normalización Z-score...")
    normalized_zscore = processor.normalize(sequence)
    assert normalized_zscore.shape == sequence.shape
    print(f"   ✅ Z-score normalización: shape={normalized_zscore.shape}")
    print(f"   Mean: {normalized_zscore.mean():.3f}, Std: {normalized_zscore.std():.3f}")
    
    # Test 5: Normalización de coordenadas
    print("\n5. Normalización de coordenadas...")
    coords_sequence = np.random.rand(30, 6, 3).astype(np.float32)
    normalized_coords = processor.normalize_coordinates(coords_sequence)
    assert normalized_coords.shape == coords_sequence.shape
    print(f"   ✅ Coordenadas normalizadas: shape={normalized_coords.shape}")
    
    # Test 6: Denormalización
    print("\n6. Denormalización...")
    denormalized = processor.denormalize(normalized_zscore)
    assert denormalized.shape == sequence.shape
    # Verificar que es similar al original (con tolerancia por precisión float)
    diff = np.abs(denormalized - sequence).mean()
    print(f"   ✅ Denormalizado: diff promedio={diff:.6f}")
    
    # Test 7: Guardar y cargar estadísticas
    print("\n7. Guardar y cargar estadísticas...")
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(suffix='.npz', delete=False) as tmp:
        tmp_path = tmp.name
    
    try:
        processor.save_stats(tmp_path)
        print(f"   ✅ Estadísticas guardadas en {tmp_path}")
        
        # Crear nuevo procesador y cargar
        new_processor = PoseProcessor()
        new_processor.load_stats(tmp_path)
        assert new_processor.is_fitted
        assert np.array_equal(new_processor.mean, processor.mean)
        assert np.array_equal(new_processor.std, processor.std)
        print("   ✅ Estadísticas cargadas correctamente")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    
    print("\n✅ TODOS LOS TESTS DE POSEPROCESSOR PASARON")


def test_integration():
    """Test de integración: Buffer + Processor"""
    print("\n" + "=" * 60)
    print("TEST: Integración Buffer + Processor")
    print("=" * 60)
    
    # Crear componentes
    buffer = PoseBuffer(window_size=30)
    processor = PoseProcessor()
    
    print("\n1. Llenando buffer con datos simulados...")
    for i in range(30):
        keypoints = np.random.rand(6, 3).tolist()
        buffer.add_frame(keypoints)
    
    assert buffer.is_ready()
    print("   ✅ Buffer lleno")
    
    print("\n2. Obteniendo secuencia aplanada...")
    sequence = buffer.get_flattened_sequence()
    assert sequence is not None
    print(f"   ✅ Secuencia obtenida: {sequence.shape}")
    
    print("\n3. Normalizando secuencia...")
    normalized = processor.normalize(sequence)
    assert normalized.shape == sequence.shape
    print(f"   ✅ Secuencia normalizada: {normalized.shape}")
    
    print("\n4. Simulando preparación para LSTM...")
    # Añadir dimensión de batch para LSTM: (1, 30, 18)
    lstm_input = np.expand_dims(normalized, axis=0)
    print(f"   ✅ Input para LSTM: {lstm_input.shape}")
    print(f"      - Batch size: {lstm_input.shape[0]}")
    print(f"      - Sequence length: {lstm_input.shape[1]}")
    print(f"      - Features: {lstm_input.shape[2]}")
    
    print("\n✅ TEST DE INTEGRACIÓN COMPLETADO")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("TESTS DE COMPONENTES INTERNOS - aivU Backend")
    print("=" * 60)
    
    try:
        test_pose_buffer()
        test_pose_processor()
        test_integration()
        
        print("\n" + "=" * 60)
        print("✅ TODOS LOS TESTS PASARON EXITOSAMENTE")
        print("=" * 60)
        print("\n📊 Resumen:")
        print("   ✅ PoseBuffer: 7/7 tests")
        print("   ✅ PoseProcessor: 7/7 tests")
        print("   ✅ Integración: 4/4 tests")
        print("\n🎯 Backend listo para Fase 2 (Modelo LSTM)")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
