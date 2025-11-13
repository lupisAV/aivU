"""
Script de prueba para el WebSocket de análisis de pose
"""
import asyncio
import websockets
import json
import numpy as np


def generate_random_keypoints():
    """Genera 6 keypoints aleatorios (brazos) con coordenadas x, y, z"""
    return np.random.rand(6, 3).tolist()


async def test_pose_analysis():
    """
    Prueba el WebSocket enviando 30 frames de keypoints simulados
    """
    uri = "ws://localhost:8000/ws/pose-analysis"
    
    print(f"Conectando a {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            # Recibir mensaje de bienvenida
            welcome = await websocket.recv()
            print(f"\n✅ Conectado: {json.loads(welcome)}\n")
            
            # Simular 30 frames de keypoints
            print("Enviando 30 frames de keypoints simulados...\n")
            
            for i in range(30):
                keypoints = generate_random_keypoints()
                
                # Enviar frame
                await websocket.send(json.dumps({
                    "type": "frame",
                    "keypoints": keypoints
                }))
                
                # Recibir respuesta(s) - puede haber múltiples respuestas
                buffer_full = False
                while True:
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=0.5)
                        response_data = json.loads(response)
                        
                        if response_data["type"] == "buffer_status":
                            stats = response_data["stats"]
                            print(f"Frame {i+1}/30 - Buffer: {stats['current_size']}/{stats['window_size']} "
                                  f"({stats['fill_percentage']:.1f}%)")
                            buffer_full = stats['is_ready']
                            if not buffer_full:
                                break  # Si no está lleno, solo esperamos buffer_status
                        
                        elif response_data["type"] == "prediction":
                            print(f"\n🎯 PREDICCIÓN DEL MODELO:")
                            print(f"   Clasificación: {response_data['classification']}")
                            print(f"   Confianza: {response_data['confidence']:.4f}")
                            print(f"   Es confiable: {response_data['is_confident']}")
                            if 'probabilities' in response_data:
                                probs = response_data['probabilities']
                                print(f"   Probabilidades:")
                                print(f"      - Incorrecto: {probs['incorrecto']:.4f}")
                                print(f"      - Correcto: {probs['correcto']:.4f}")
                            print()
                            # Continuar para recibir buffer_status
                        
                        elif response_data["type"] == "sequence_ready":
                            print(f"\n🎯 {response_data.get('message', 'Secuencia lista')}")
                            if 'sequence_shape' in response_data:
                                print(f"   Shape: {response_data['sequence_shape']}")
                            print()
                            # Continuar para recibir buffer_status
                        
                        elif response_data["type"] == "error":
                            print(f"❌ Error: {response_data['message']}")
                            break
                    
                    except asyncio.TimeoutError:
                        break
                
                # Pequeña pausa para simular captura real
                await asyncio.sleep(0.033)  # ~30 FPS
            
            # Probar reset
            print("\nProbando reset del buffer...")
            await websocket.send(json.dumps({"type": "reset"}))
            reset_response = await websocket.recv()
            print(f"✅ {json.loads(reset_response)['message']}")
            
            # Probar ping
            print("\nProbando ping...")
            await websocket.send(json.dumps({"type": "ping"}))
            ping_response = await websocket.recv()
            print(f"✅ {json.loads(ping_response)['type']}")
            
            print("\n✅ Prueba completada exitosamente!")
    
    except ConnectionRefusedError:
        print("❌ Error: No se pudo conectar al servidor.")
        print("   Asegúrate de que el servidor esté corriendo en http://localhost:8000")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    print("=" * 60)
    print("Test de WebSocket - aivU Backend")
    print("=" * 60)
    asyncio.run(test_pose_analysis())
