"""
FastAPI Backend para aivU - Análisis de pose en tiempo real
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import json
import logging

from app.config import settings
from app.models.pose_buffer import PoseBuffer
from app.services.pose_processor import PoseProcessor
from app.services.inference import get_inference_service
from app.routes import data as data_routes

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Incluir routers
app.include_router(data_routes.router)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instancia global del procesador de pose
pose_processor = PoseProcessor()

# Servicio de inferencia (se inicializa en startup)
inference_service = None

# Diccionario para mantener buffers por conexión WebSocket
active_buffers: Dict[str, PoseBuffer] = {}


@app.get("/")
async def root():
    """Endpoint raíz - Health check"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "websocket": "/ws/pose-analysis"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_connections": len(active_buffers),
        "pose_processor_fitted": pose_processor.is_fitted,
        "model_loaded": inference_service.is_loaded if inference_service else False
    }


@app.get("/config")
async def get_config():
    """Obtiene la configuración del sistema"""
    return {
        "window_size": settings.WINDOW_SIZE,
        "arm_keypoints": settings.ARM_KEYPOINTS,
        "keypoint_coords": settings.KEYPOINT_COORDS,
        "expected_features": len(settings.ARM_KEYPOINTS) * settings.KEYPOINT_COORDS
    }


@app.get("/model/info")
async def get_model_info():
    """Obtiene información del modelo LSTM"""
    if inference_service:
        return inference_service.get_model_info()
    else:
        return {"status": "not_initialized"}


@app.websocket("/ws/pose-analysis")
async def websocket_pose_analysis(websocket: WebSocket):
    """
    WebSocket endpoint para análisis de pose en tiempo real
    
    Protocolo:
    - Cliente envía: {"type": "frame", "keypoints": [[x,y,z], ...]}
    - Servidor responde: {"type": "status", "buffer_status": {...}}
    - Cuando buffer lleno: {"type": "ready", "sequence": [...]}
    """
    await websocket.accept()
    
    # Generar ID único para esta conexión
    connection_id = id(websocket)
    
    # Crear buffer para esta conexión
    buffer = PoseBuffer()
    active_buffers[str(connection_id)] = buffer
    
    logger.info(f"Nueva conexión WebSocket: {connection_id}")
    
    try:
        # Enviar mensaje de bienvenida
        await websocket.send_json({
            "type": "connected",
            "message": "Conectado al servidor de análisis de pose",
            "connection_id": str(connection_id),
            "config": {
                "window_size": settings.WINDOW_SIZE,
                "expected_keypoints": len(settings.ARM_KEYPOINTS)
            }
        })
        
        while True:
            # Recibir datos del cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "frame":
                # Procesar frame de keypoints
                keypoints = message.get("keypoints")
                
                if not keypoints:
                    await websocket.send_json({
                        "type": "error",
                        "message": "No se recibieron keypoints"
                    })
                    continue
                
                try:
                    # Añadir frame al buffer
                    buffer.add_frame(keypoints)
                    
                    # Obtener estadísticas del buffer
                    stats = buffer.get_stats()
                    
                    # Enviar estado del buffer
                    await websocket.send_json({
                        "type": "buffer_status",
                        "stats": stats
                    })
                    
                    # Si el buffer está listo, procesar secuencia
                    if buffer.is_ready():
                        sequence = buffer.get_flattened_sequence()
                        
                        # Normalizar secuencia
                        normalized_sequence = pose_processor.normalize(sequence)
                        
                        # Realizar inferencia con el modelo LSTM
                        if inference_service and inference_service.is_loaded:
                            try:
                                # Predicción
                                prediction = inference_service.predict(
                                    normalized_sequence,
                                    return_probabilities=True
                                )
                                
                                # Enviar predicción al cliente
                                await websocket.send_json({
                                    "type": "prediction",
                                    "classification": prediction["classification"],
                                    "confidence": prediction["confidence"],
                                    "is_confident": prediction["is_confident"],
                                    "probabilities": prediction.get("probabilities", {}),
                                    "stats": stats
                                })
                                
                                logger.info(
                                    f"Predicción: {prediction['classification']} "
                                    f"(conf: {prediction['confidence']:.4f})"
                                )
                            
                            except Exception as e:
                                logger.error(f"Error en inferencia: {str(e)}")
                                await websocket.send_json({
                                    "type": "error",
                                    "message": f"Error en inferencia: {str(e)}"
                                })
                        else:
                            # Modelo no cargado, enviar solo secuencia lista
                            await websocket.send_json({
                                "type": "sequence_ready",
                                "message": "Secuencia lista (modelo no cargado)",
                                "sequence_shape": list(normalized_sequence.shape),
                                "stats": stats
                            })
                        
                        # Limpiar buffer para la siguiente secuencia
                        buffer.clear()
                
                except ValueError as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
            
            elif message_type == "reset":
                # Resetear buffer
                buffer.clear()
                await websocket.send_json({
                    "type": "reset_complete",
                    "message": "Buffer reseteado"
                })
            
            elif message_type == "ping":
                # Responder a ping
                await websocket.send_json({
                    "type": "pong"
                })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Tipo de mensaje desconocido: {message_type}"
                })
    
    except WebSocketDisconnect:
        logger.info(f"Cliente desconectado: {connection_id}")
    
    except Exception as e:
        logger.error(f"Error en WebSocket {connection_id}: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "message": f"Error del servidor: {str(e)}"
        })
    
    finally:
        # Limpiar buffer al desconectar
        if str(connection_id) in active_buffers:
            del active_buffers[str(connection_id)]
        logger.info(f"Conexión cerrada: {connection_id}")


@app.on_event("startup")
async def startup_event():
    """Evento de inicio de la aplicación"""
    global inference_service
    
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Configuración: Window size={settings.WINDOW_SIZE}, Keypoints={settings.ARM_KEYPOINTS}")
    
    # Inicializar servicio de inferencia
    inference_service = get_inference_service()
    
    # Intentar cargar modelo entrenado
    from pathlib import Path
    model_path = Path("models/pose_lstm_best.pth")
    if model_path.exists():
        success = inference_service.load_model(str(model_path))
        if success:
            logger.info(f"✅ Modelo LSTM cargado desde: {model_path}")
        else:
            logger.warning(f"⚠️  No se pudo cargar el modelo desde: {model_path}")
    else:
        logger.warning(f"⚠️  No se encontró modelo entrenado en: {model_path}")
    
    logger.info(f"Servicio de inferencia inicializado (modelo cargado: {inference_service.is_loaded})")


@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre de la aplicación"""
    logger.info("Cerrando aplicación...")
    active_buffers.clear()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
