"""
Servicio de inferencia en tiempo real para el modelo LSTM
"""
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, Dict
import logging
import sys
import os

# Añadir el directorio raíz al path para imports
if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.models.lstm_model import PoseLSTM, PoseLSTMLight, create_model

logger = logging.getLogger(__name__)


class InferenceService:
    """
    Servicio para realizar inferencia en tiempo real con el modelo LSTM
    """
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        model_type: str = "full",
        device: str = "cpu"
    ):
        """
        Inicializa el servicio de inferencia
        
        Args:
            model_path: Ruta al modelo entrenado (.pth)
            model_type: Tipo de modelo ("full" o "light")
            device: Dispositivo (cpu o cuda)
        """
        self.device = device
        self.model_type = model_type
        self.model = None
        self.is_loaded = False
        
        # Mapeo de clases
        self.class_names = {
            0: "incorrecto",
            1: "correcto"
        }
        
        # Umbral de confianza
        self.confidence_threshold = 0.7
        
        # Cargar modelo si se proporciona ruta
        if model_path:
            self.load_model(model_path)
        else:
            # Crear modelo sin entrenar (para testing)
            logger.warning("No se proporcionó ruta de modelo. Creando modelo sin entrenar.")
            self.model = create_model(model_type)
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
    
    def load_model(self, model_path: str) -> bool:
        """
        Carga un modelo entrenado desde un checkpoint
        
        Args:
            model_path: Ruta al checkpoint (.pth)
        
        Returns:
            True si se cargó exitosamente
        """
        try:
            path = Path(model_path)
            if not path.exists():
                logger.error(f"Modelo no encontrado: {model_path}")
                return False
            
            # Cargar checkpoint
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Crear modelo
            self.model = create_model(self.model_type)
            
            # Cargar pesos
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            
            self.is_loaded = True
            
            logger.info(f"Modelo cargado exitosamente desde: {model_path}")
            logger.info(f"Época: {checkpoint.get('epoch', 'N/A')}")
            logger.info(f"Val Accuracy: {checkpoint.get('val_acc', 'N/A'):.2f}%")
            
            return True
        
        except Exception as e:
            logger.error(f"Error al cargar modelo: {str(e)}")
            return False
    
    def predict(
        self,
        sequence: np.ndarray,
        return_probabilities: bool = False
    ) -> Dict:
        """
        Realiza predicción sobre una secuencia
        
        Args:
            sequence: Secuencia normalizada de shape (30, 18)
            return_probabilities: Si retornar probabilidades de todas las clases
        
        Returns:
            Diccionario con predicción y confianza
        """
        if not self.is_loaded:
            raise RuntimeError("Modelo no cargado. Llama a load_model() primero.")
        
        try:
            # Convertir a tensor y añadir dimensión de batch
            if isinstance(sequence, np.ndarray):
                sequence = torch.FloatTensor(sequence)
            
            # Asegurar shape correcto: (1, 30, 18)
            if sequence.dim() == 2:
                sequence = sequence.unsqueeze(0)
            
            sequence = sequence.to(self.device)
            
            # Inferencia
            with torch.no_grad():
                logits = self.model(sequence)
                probabilities = torch.softmax(logits, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            # Extraer valores
            predicted_class = predicted.item()
            confidence_score = confidence.item()
            
            # Crear respuesta
            result = {
                "classification": self.class_names[predicted_class],
                "confidence": float(confidence_score),
                "is_confident": confidence_score >= self.confidence_threshold,
                "predicted_class": int(predicted_class)
            }
            
            if return_probabilities:
                result["probabilities"] = {
                    "incorrecto": float(probabilities[0, 0].item()),
                    "correcto": float(probabilities[0, 1].item())
                }
            
            return result
        
        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            raise
    
    def predict_batch(
        self,
        sequences: np.ndarray
    ) -> list:
        """
        Realiza predicción sobre un batch de secuencias
        
        Args:
            sequences: Array de secuencias (batch_size, 30, 18)
        
        Returns:
            Lista de diccionarios con predicciones
        """
        if not self.is_loaded:
            raise RuntimeError("Modelo no cargado.")
        
        try:
            # Convertir a tensor
            if isinstance(sequences, np.ndarray):
                sequences = torch.FloatTensor(sequences)
            
            sequences = sequences.to(self.device)
            
            # Inferencia
            with torch.no_grad():
                logits = self.model(sequences)
                probabilities = torch.softmax(logits, dim=1)
                confidences, predicted = torch.max(probabilities, 1)
            
            # Crear lista de resultados
            results = []
            for i in range(len(sequences)):
                predicted_class = predicted[i].item()
                confidence_score = confidences[i].item()
                
                result = {
                    "classification": self.class_names[predicted_class],
                    "confidence": float(confidence_score),
                    "is_confident": confidence_score >= self.confidence_threshold,
                    "predicted_class": int(predicted_class),
                    "probabilities": {
                        "incorrecto": float(probabilities[i, 0].item()),
                        "correcto": float(probabilities[i, 1].item())
                    }
                }
                results.append(result)
            
            return results
        
        except Exception as e:
            logger.error(f"Error en predicción batch: {str(e)}")
            raise
    
    def set_confidence_threshold(self, threshold: float):
        """
        Establece el umbral de confianza
        
        Args:
            threshold: Umbral entre 0 y 1
        """
        if not 0 <= threshold <= 1:
            raise ValueError("Threshold debe estar entre 0 y 1")
        
        self.confidence_threshold = threshold
        logger.info(f"Umbral de confianza actualizado a: {threshold}")
    
    def get_model_info(self) -> Dict:
        """
        Obtiene información del modelo
        
        Returns:
            Diccionario con información
        """
        if not self.is_loaded:
            return {"status": "not_loaded"}
        
        info = {
            "status": "loaded",
            "model_type": self.model_type,
            "device": str(self.device),
            "confidence_threshold": self.confidence_threshold,
            "class_names": self.class_names
        }
        
        if hasattr(self.model, 'get_model_info'):
            info.update(self.model.get_model_info())
        
        return info


# Instancia global del servicio (singleton)
_inference_service: Optional[InferenceService] = None


def get_inference_service() -> InferenceService:
    """
    Obtiene la instancia global del servicio de inferencia
    
    Returns:
        Instancia de InferenceService
    """
    global _inference_service
    
    if _inference_service is None:
        # Crear servicio sin modelo cargado
        # El modelo se cargará cuando esté disponible
        _inference_service = InferenceService(
            model_path=None,
            model_type="full",
            device="cuda" if torch.cuda.is_available() else "cpu"
        )
        logger.info("Servicio de inferencia inicializado")
    
    return _inference_service


def initialize_inference_service(
    model_path: Optional[str] = None,
    model_type: str = "full"
) -> InferenceService:
    """
    Inicializa el servicio de inferencia con un modelo específico
    
    Args:
        model_path: Ruta al modelo entrenado
        model_type: Tipo de modelo
    
    Returns:
        Instancia de InferenceService
    """
    global _inference_service
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    _inference_service = InferenceService(
        model_path=model_path,
        model_type=model_type,
        device=device
    )
    
    logger.info(f"Servicio de inferencia inicializado con modelo: {model_path}")
    
    return _inference_service


if __name__ == "__main__":
    # Test del servicio de inferencia
    print("=" * 60)
    print("Test del Servicio de Inferencia")
    print("=" * 60)
    
    # Crear servicio
    print("\n1. Creando servicio de inferencia...")
    service = InferenceService(model_type="full")
    print(f"   ✅ Servicio creado")
    
    # Información del modelo
    print("\n2. Información del modelo:")
    info = service.get_model_info()
    for key, value in info.items():
        print(f"   {key}: {value}")
    
    # Test predicción
    print("\n3. Test de predicción:")
    sequence = np.random.randn(30, 18).astype(np.float32)
    result = service.predict(sequence, return_probabilities=True)
    print(f"   Clasificación: {result['classification']}")
    print(f"   Confianza: {result['confidence']:.4f}")
    print(f"   Es confiable: {result['is_confident']}")
    print(f"   Probabilidades: {result['probabilities']}")
    
    # Test predicción batch
    print("\n4. Test de predicción batch:")
    sequences = np.random.randn(5, 30, 18).astype(np.float32)
    results = service.predict_batch(sequences)
    print(f"   ✅ {len(results)} predicciones realizadas")
    for i, result in enumerate(results):
        print(f"   Muestra {i+1}: {result['classification']} (conf: {result['confidence']:.4f})")
    
    # Test cambio de umbral
    print("\n5. Test de cambio de umbral:")
    service.set_confidence_threshold(0.9)
    result = service.predict(sequence)
    print(f"   Nuevo umbral: 0.9")
    print(f"   Es confiable: {result['is_confident']}")
    
    print("\n✅ Todos los tests del servicio de inferencia pasaron!")
