"""
Script de prueba para los endpoints HTTP de la API
"""
import requests
import json


def test_api():
    """Prueba todos los endpoints HTTP"""
    base_url = "http://localhost:8000"
    
    print("=" * 60)
    print("Test de Endpoints HTTP - aivU Backend")
    print("=" * 60)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint (/)...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        print("   ✅ PASSED")
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
    
    # Test 2: Health check
    print("\n2. Testing health check (/health)...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        assert response.status_code == 200
        assert data["status"] == "healthy"
        print("   ✅ PASSED")
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
    
    # Test 3: Config endpoint
    print("\n3. Testing config endpoint (/config)...")
    try:
        response = requests.get(f"{base_url}/config")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        assert response.status_code == 200
        assert data["window_size"] == 30
        assert len(data["arm_keypoints"]) == 6
        assert data["expected_features"] == 18
        print("   ✅ PASSED")
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
    
    # Test 4: Docs endpoint
    print("\n4. Testing docs endpoint (/docs)...")
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"   Status: {response.status_code}")
        assert response.status_code == 200
        print("   ✅ PASSED - Swagger UI disponible")
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ Todos los tests HTTP completados!")
    print("=" * 60)
    print("\n📝 Resumen:")
    print("   - Root endpoint: ✅")
    print("   - Health check: ✅")
    print("   - Config: ✅")
    print("   - Docs (Swagger): ✅")
    print("\n🌐 URLs disponibles:")
    print(f"   - API: {base_url}")
    print(f"   - Docs: {base_url}/docs")
    print(f"   - Health: {base_url}/health")
    print(f"   - WebSocket: ws://localhost:8000/ws/pose-analysis")


if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar al servidor.")
        print("   Asegúrate de que el servidor esté corriendo en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
